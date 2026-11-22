import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type { BuildManifest } from '@/types/build'

const APK_CONTENT_TYPE = 'application/vnd.android.package-archive'
const PRESIGNED_URL_TTL_SECONDS = 5 * 60

let cachedClient: S3Client | null = null

function getR2Bucket(): string {
    const bucket = process.env.R2_BUCKET?.trim()
    if (!bucket) throw new Error('R2_BUCKET is not configured')
    return bucket
}

function getR2Client(): S3Client {
    if (cachedClient) return cachedClient
    
    const endpoint = process.env.R2_ENDPOINT?.trim()
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
    
    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('R2 credentials are not configured')
    }
    
    cachedClient = new S3Client({
        region: 'auto',
        endpoint,
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
                Key: 'index.json',
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
