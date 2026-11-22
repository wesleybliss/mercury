import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

import { getAllowedEmail } from '@/lib/mobile-jwt'

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [Google],
    session: { strategy: 'jwt' },
    trustHost: true,
    pages: {
        signIn: '/',
        error: '/',
    },
    callbacks: {
        signIn({ profile }) {
            const allowedEmail = getAllowedEmail()
            if (!allowedEmail) return false
            return (
                profile?.email_verified === true
                && typeof profile.email === 'string'
                && profile.email.toLowerCase() === allowedEmail
            )
        },
    },
})
