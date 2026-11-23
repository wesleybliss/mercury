import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type { BuildManifest } from '@/types/build'

const APK_CONTENT_TYPE = 'application/vnd.android.package-archive'
const PRESIGNED_URL_TTL_SECONDS = 5 * 60
const INDEX_KEY = 'index.json'

let cachedClient: S3Client | null = null

function getR2Bucket(): string {
    const bucket = process.env.R2_BUCKET?.trim()
    if (!bucket) throw new Error('R2_BUCKET is not configured')
    return bucket
}

/** Strip trailing slash and optional /<bucket> suffix (same as push-build). */
function normalizeR2Endpoint(rawEndpoint: string, bucket: string): string {
    let endpoint = rawEndpoint.trim().replace(/\/+$/, '')
    const bucketSuffix = `/${bucket}`
    if (endpoint.endsWith(bucketSuffix)) {
        endpoint = endpoint.slice(0, -bucketSuffix.length)
    }
    return endpoint
}

function getR2Client(): S3Client {
    if (cachedClient) return cachedClient
    
    const rawEndpoint = process.env.R2_ENDPOINT?.trim()
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
    const bucket = getR2Bucket()
    
    if (!rawEndpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('R2 credentials are not configured')
    }
    
    cachedClient = new S3Client({
        region: 'auto',
        endpoint: normalizeR2Endpoint(rawEndpoint, bucket),
        forcePathStyle: true,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    })
    
    return cachedClient
}

function isNoSuchKeyError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false
    const err = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } }
    return (
        err.name === 'NoSuchKey'
        || err.Code === 'NoSuchKey'
        || err.$metadata?.httpStatusCode === 404
    )
}

function isBuildManifest(item: unknown): item is BuildManifest {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    return (
        typeof record.id === 'string'
        && typeof record.app === 'string'
        && typeof record.timestamp === 'string'
        && typeof record.branch === 'string'
        && typeof record.commit === 'string'
        && typeof record.notes === 'string'
        && typeof record.sha256 === 'string'
        && typeof record.apkKey === 'string'
        && typeof record.sizeBytes === 'number'
    )
}

export async function getBuildsIndex(): Promise<BuildManifest[]> {
    const client = getR2Client()
    const bucket = getR2Bucket()
    
    try {
        const response = await client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: INDEX_KEY,
            }),
        )
        
        const body = await response.Body?.transformToString()
        if (!body) return []
        
        const parsed: unknown = JSON.parse(body)
        if (!Array.isArray(parsed)) return []
        
        return parsed.filter(isBuildManifest)
    } catch (error) {
        if (isNoSuchKeyError(error)) return []
        throw error
    }
}

async function putBuildsIndex(builds: BuildManifest[]): Promise<void> {
    const client = getR2Client()
    const bucket = getR2Bucket()
    
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: INDEX_KEY,
            Body: JSON.stringify(builds),
            ContentType: 'application/json',
        }),
    )
}

async function deleteObjectIfExists(key: string): Promise<void> {
    const client = getR2Client()
    const bucket = getR2Bucket()
    
    try {
        await client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        )
    } catch (error) {
        if (isNoSuchKeyError(error)) return
        throw error
    }
}

function manifestKeyFromApkKey(apkKey: string): string | null {
    const slash = apkKey.lastIndexOf('/')
    if (slash <= 0) return null
    return `${apkKey.slice(0, slash)}/manifest.json`
}

/** Remove a build from index.json and delete its APK + manifest from R2. */
export async function deleteBuild(id: string): Promise<'deleted' | 'not_found'> {
    const builds = await getBuildsIndex()
    const index = builds.findIndex(build => build.id === id)
    if (index < 0) return 'not_found'
    
    const [removed] = builds.splice(index, 1)
    await putBuildsIndex(builds)
    
    await deleteObjectIfExists(removed.apkKey)
    const manifestKey = manifestKeyFromApkKey(removed.apkKey)
    if (manifestKey) await deleteObjectIfExists(manifestKey)
    
    return 'deleted'
}

export async function getBuildsSnapshot(): Promise<{
    builds: BuildManifest[]
    error: string | null
    fetchedAt: number
}> {
    const fetchedAt = Date.now()
    try {
        const builds = await getBuildsIndex()
        return { builds, error: null, fetchedAt }
    } catch {
        return {
            builds: [],
            error: 'Could not load builds from R2. Check your configuration and try again.',
            fetchedAt,
        }
    }
}

export function validateApkKey(rawKey: string | null): string | null {
    if (!rawKey) return null
    const key = rawKey.trim()
    if (!key) return null
    if (key.startsWith('/')) return null
    if (key.includes('..') || key.includes('\\') || key.includes('\0')) return null
    if (!key.endsWith('.apk')) return null
    return key
}

function buildDownloadFilename(key: string): string {
    const parts = key.split('/').filter(Boolean)
    const rawName = parts.length >= 2
        ? `${parts.slice(0, -1).join('-')}.apk`
        : parts[0] ?? 'app.apk'
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '-')
    return safeName.endsWith('.apk') ? safeName : `${safeName}.apk`
}

export async function getApkDownloadUrl(key: string): Promise<string> {
    const client = getR2Client()
    const bucket = getR2Bucket()
    const filename = buildDownloadFilename(key)
    
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: APK_CONTENT_TYPE,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
    })
    
    return getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS })
}
