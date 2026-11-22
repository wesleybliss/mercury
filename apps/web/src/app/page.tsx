import { auth } from '@/auth'
import { BuildsDashboard } from '@/components/builds-dashboard'
import { SignInView } from '@/components/sign-in-view'
import { getAllowedEmail } from '@/lib/mobile-jwt'
import { getBuildsSnapshot } from '@/lib/r2'

export const dynamic = 'force-dynamic'

interface HomePageProps {
    searchParams: Promise<{ error?: string | string[] }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
    const [session, params] = await Promise.all([auth(), searchParams])
    const allowedEmail = getAllowedEmail()
    const userEmail = session?.user?.email?.toLowerCase() ?? null
    
    if (!userEmail || !allowedEmail || userEmail !== allowedEmail) {
        const errorParam = Array.isArray(params.error) ? params.error[0] : params.error
        return <SignInView error={errorParam} />
    }
    
    const { builds, error, fetchedAt } = await getBuildsSnapshot()
    
    return (
        <BuildsDashboard
            initialBuilds={builds}
            initialError={error}
            initialNowMs={fetchedAt}
            userEmail={userEmail}
        />
    )
}
