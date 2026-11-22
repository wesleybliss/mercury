import { AlertCircle, Package } from 'lucide-react'

import { signInWithGoogle } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SignInViewProps {
    error?: string
}

const GOOGLE_BLUE_PATH = [
    'M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44',
    'a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z',
].join('')

const GOOGLE_GREEN_PATH = [
    'M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3',
    'c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95',
    'H1.28v3.1A12 12 0 0 0 12 24Z',
].join('')

const GOOGLE_YELLOW_PATH = [
    'M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.29',
    'v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4-3.1Z',
].join('')

const GOOGLE_RED_PATH = [
    'M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44',
    'C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.28 6.61',
    'l4 3.1C6.23 6.87 8.88 4.76 12 4.76Z',
].join('')

function getErrorMessage(error?: string): string | null {
    if (!error) return null
    if (error === 'AccessDenied') {
        return 'This Google account is not authorized to access Mercury.'
    }
    return 'Sign-in could not be completed. Please try again.'
}

function GoogleMark() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
            <path fill="#4285F4" d={GOOGLE_BLUE_PATH} />
            <path fill="#34A853" d={GOOGLE_GREEN_PATH} />
            <path fill="#FBBC05" d={GOOGLE_YELLOW_PATH} />
            <path fill="#EA4335" d={GOOGLE_RED_PATH} />
        </svg>
    )
}

export function SignInView({ error }: SignInViewProps) {
    const errorMessage = getErrorMessage(error)
    
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <div
                        className={cn(
                            'bg-primary text-primary-foreground mb-2 flex size-12',
                            'items-center justify-center rounded-xl shadow-xs',
                        )}
                    >
                        <Package className="size-6" />
                    </div>
                    <CardTitle className="text-xl tracking-tight">Mercury</CardTitle>
                    <CardDescription>
                        Private Android dev builds
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-4">
                    {errorMessage && (
                        <div
                            role="alert"
                            className={cn(
                                'bg-destructive/10 text-destructive flex items-start gap-2',
                                'rounded-lg px-3 py-2.5 text-xs leading-relaxed',
                            )}
                        >
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                    
                    <form action={signInWithGoogle}>
                        <Button type="submit" size="lg" className="w-full">
                            <GoogleMark />
                            Sign in with Google
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}
