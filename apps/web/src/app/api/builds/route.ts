import { type NextRequest, NextResponse } from 'next/server'

import { deleteBuild, getBuildsIndex } from '@/lib/r2'
import { verifyAuth } from '@/lib/verify-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const email = await verifyAuth(request)
    if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
        const builds = await getBuildsIndex()
        return NextResponse.json(builds, {
            headers: { 'Cache-Control': 'no-store' },
        })
    } catch {
        return NextResponse.json({ error: 'Failed to load builds' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const email = await verifyAuth(request)
    if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const id = request.nextUrl.searchParams.get('id')?.trim()
    if (!id) {
        return NextResponse.json({ error: 'Missing build id' }, { status: 400 })
    }
    
    try {
        const result = await deleteBuild(id)
        if (result === 'not_found') {
            return NextResponse.json({ error: 'Build not found' }, { status: 404 })
        }
        return NextResponse.json(
            { ok: true },
            { headers: { 'Cache-Control': 'no-store' } },
        )
    } catch {
        return NextResponse.json({ error: 'Failed to delete build' }, { status: 500 })
    }
}
