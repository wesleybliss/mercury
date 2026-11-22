import { NextResponse } from 'next/server'

import { getBuildsIndex } from '@/lib/r2'
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
