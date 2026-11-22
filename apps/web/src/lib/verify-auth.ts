import { auth } from '@/auth'
import { getAllowedEmail, verifyMobileJwt } from '@/lib/mobile-jwt'

const BEARER_PREFIX = /^Bearer\s+(.+)$/i

export async function verifyAuth(request?: Request): Promise<string | null> {
    const authHeader = request?.headers.get('authorization')?.trim()
    if (authHeader) {
        const match = BEARER_PREFIX.exec(authHeader)
        if (!match) return null
        return verifyMobileJwt(match[1].trim())
    }
    
    const allowedEmail = getAllowedEmail()
    if (!allowedEmail) return null
    
    const session = await auth()
    const email = session?.user?.email?.toLowerCase()
    if (!email || email !== allowedEmail) return null
    
    return email
}
