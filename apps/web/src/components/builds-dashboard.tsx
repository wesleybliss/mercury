'use client'

import { AlertCircle, LogOut, Package, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { signOutUser } from '@/app/actions'
import { BuildCard } from '@/components/build-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { BuildManifest } from '@/types/build'

interface BuildsDashboardProps {
    initialBuilds: BuildManifest[]
    initialError?: string | null
    initialNowMs: number
    userEmail: string
}

export function BuildsDashboard({
    initialBuilds,
    initialError = null,
    initialNowMs,
    userEmail,
}: BuildsDashboardProps) {
    const [builds, setBuilds] = useState<BuildManifest[]>(initialBuilds)
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(initialError)
    const [nowMs, setNowMs] = useState<number>(initialNowMs)
    
    const appCounts = useMemo(() => {
        const counts = new Map<string, number>()
        for (const build of builds) {
            counts.set(build.app, (counts.get(build.app) ?? 0) + 1)
        }
        return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b))
    }, [builds])
    
    const latestIdByApp = useMemo(() => {
        const map = new Map<string, string>()
        for (const build of builds) {
            if (!map.has(build.app)) {
                map.set(build.app, build.id)
            }
        }
        return map
    }, [builds])
    
    const activeApp = selectedApp && appCounts.some(([app]) => app === selectedApp)
        ? selectedApp
        : null
    
    const visibleBuilds = useMemo(() => {
        if (!activeApp) return builds
        return builds.filter(build => build.app === activeApp)
    }, [builds, activeApp])
    
    async function handleRefresh() {
        setIsRefreshing(true)
        setError(null)
        
        try {
            const response = await fetch('/api/builds', { cache: 'no-store' })
            if (response.status === 401) {
                window.location.reload()
                return
            }
            if (!response.ok) {
                throw new Error('Failed to load builds')
            }
            const data = (await response.json()) as BuildManifest[]
            setBuilds(Array.isArray(data) ? data : [])
            setNowMs(Date.now())
        } catch {
            setError('Could not load builds from R2. Check your configuration and try again.')
        } finally {
            setIsRefreshing(false)
        }
    }
    
    return (
        <div className="min-h-dvh">
            <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur-md">
                <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className={cn(
                                'bg-primary text-primary-foreground flex size-8 shrink-0',
                                'items-center justify-center rounded-lg',
                            )}
                        >
                            <Package className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                                Mercury
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground hidden max-w-48 truncate text-xs sm:inline">
                            {userEmail}
                        </span>
                        
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            aria-label="Refresh builds"
                        >
                            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        
                        <form action={signOutUser}>
                            <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
                                <LogOut className="size-3.5" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </header>
            
            <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
                {appCounts.length > 0 && (
                    <nav
                        aria-label="Filter builds by app"
                        className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedApp(null)}
                            className={cn(
                                'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5',
                                'rounded-full border px-3 text-xs font-medium transition-colors',
                                activeApp === null
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-foreground hover:bg-muted',
                            )}
                        >
                            <span>All</span>
                            <span
                                className={cn(
                                    'text-[11px]',
                                    activeApp === null
                                        ? 'text-primary-foreground/80'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {builds.length}
                            </span>
                        </button>
                        
                        {appCounts.map(([app, count]) => {
                            const isSelected = activeApp === app
                            return (
                                <button
                                    key={app}
                                    type="button"
                                    onClick={() => setSelectedApp(app)}
                                    className={cn(
                                        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5',
                                        'rounded-full border px-3 text-xs font-medium transition-colors',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-card text-foreground hover:bg-muted',
                                    )}
                                >
                                    <span>{app}</span>
                                    <span
                                        className={cn(
                                            'text-[11px]',
                                            isSelected
                                                ? 'text-primary-foreground/80'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </nav>
                )}
                
                {error && (
                    <div
                        role="alert"
                        className={cn(
                            'bg-destructive/10 text-destructive flex items-center',
                            'justify-between gap-3 rounded-xl px-4 py-3 text-sm',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="xs"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            Retry
                        </Button>
                    </div>
                )}
                
                {isRefreshing && builds.length === 0 ? (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-44 w-full rounded-xl" />
                        <Skeleton className="h-44 w-full rounded-xl" />
                    </div>
                ) : visibleBuilds.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <div
                                className={cn(
                                    'bg-muted text-muted-foreground mb-1 flex size-10',
                                    'items-center justify-center rounded-full',
                                )}
                            >
                                <Package className="size-5" />
                            </div>
                            <p className="text-sm font-medium">No builds found</p>
                            <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
                                Push an APK to your R2 bucket and hit Refresh to see it here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {visibleBuilds.map(build => (
                            <BuildCard
                                key={build.id}
                                build={build}
                                isLatest={latestIdByApp.get(build.app) === build.id}
                                nowMs={nowMs}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
