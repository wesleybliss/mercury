import { createRemoteJWKSet, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

import { getAllowedEmail, signMobileJwt } from '@/lib/mobile-jwt'

export const dynamic = 'force-dynamic'

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

export async function POST(request: Request) {
    const allowedEmail = getAllowedEmail()
    const googleClientId = process.env.AUTH_GOOGLE_ID?.trim()
    
    if (!allowedEmail || !googleClientId || !process.env.AUTH_SECRET) {
        return NextResponse.json({ error: 'Server auth is not configured' }, { status: 500 })
    }
    
    let idToken: string | null = null
    try {
        const body: unknown = await request.json()
        if (typeof body === 'object' && body !== null && 'idToken' in body) {
            const candidate = (body as { idToken?: unknown }).idToken
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                idToken = candidate.trim()
            }
        }
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!idToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
        const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
            issuer: GOOGLE_ISSUERS,
            audience: googleClientId,
        })
        
        const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null
        const emailVerified = payload.email_verified === true
        
        if (!emailVerified || !email || email !== allowedEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        const { token, expiresAt } = await signMobileJwt(email)
        return NextResponse.json(
            { token, expiresAt },
            { headers: { 'Cache-Control': 'no-store' } },
        )
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
