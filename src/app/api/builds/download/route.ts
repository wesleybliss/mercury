import { type NextRequest, NextResponse } from 'next/server'

import { getApkDownloadUrl, validateApkKey } from '@/lib/r2'
import { verifyAuth } from '@/lib/verify-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const email = await verifyAuth(request)
    if (!email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const key = validateApkKey(request.nextUrl.searchParams.get('key'))
    if (!key) {
        return NextResponse.json({ error: 'Invalid build key' }, { status: 400 })
    }
    
    try {
        const url = await getApkDownloadUrl(key)
        const shouldRedirect = request.nextUrl.searchParams.get('redirect') === '1'
        
        if (shouldRedirect) {
            return NextResponse.redirect(url, {
                status: 302,
                headers: { 'Cache-Control': 'no-store' },
            })
        }
        
        return NextResponse.json(
            { url },
            { headers: { 'Cache-Control': 'no-store' } },
        )
    } catch {
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }
}
