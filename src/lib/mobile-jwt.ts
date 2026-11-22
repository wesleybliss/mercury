import { jwtVerify, SignJWT } from 'jose'

const MOBILE_JWT_ISSUER = 'mercury'
const MOBILE_JWT_AUDIENCE = 'mercury-android'
const MOBILE_JWT_TTL_SECONDS = 30 * 24 * 60 * 60

function getJwtSecret(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error('AUTH_SECRET is not configured')
    return new TextEncoder().encode(secret)
}

export function getAllowedEmail(): string | null {
    const email = process.env.ALLOWED_EMAIL?.trim().toLowerCase()
    return email && email.length > 0 ? email : null
}

export async function signMobileJwt(email: string): Promise<{ token: string; expiresAt: string }> {
    const normalizedEmail = email.trim().toLowerCase()
    const nowSeconds = Math.floor(Date.now() / 1000)
    const expSeconds = nowSeconds + MOBILE_JWT_TTL_SECONDS
    
    const token = await new SignJWT({ email: normalizedEmail })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(normalizedEmail)
        .setIssuer(MOBILE_JWT_ISSUER)
        .setAudience(MOBILE_JWT_AUDIENCE)
        .setIssuedAt(nowSeconds)
        .setExpirationTime(expSeconds)
        .sign(getJwtSecret())
    
    return {
        token,
        expiresAt: new Date(expSeconds * 1000).toISOString(),
    }
}

export async function verifyMobileJwt(token: string): Promise<string | null> {
    const allowedEmail = getAllowedEmail()
    if (!allowedEmail || !process.env.AUTH_SECRET) return null
    
    try {
        const { payload } = await jwtVerify(token, getJwtSecret(), {
            algorithms: ['HS256'],
            issuer: MOBILE_JWT_ISSUER,
            audience: MOBILE_JWT_AUDIENCE,
        })
        
        const email = typeof payload.email === 'string'
            ? payload.email.toLowerCase()
            : typeof payload.sub === 'string'
                ? payload.sub.toLowerCase()
                : null
        
        if (!email || email !== allowedEmail) return null
        return email
    } catch {
        return null
    }
}
