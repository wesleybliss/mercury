'use client'

import { Check, Clock, Copy, Download, GitBranch, HardDrive } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
    formatAbsoluteTime,
    formatFileSize,
    formatRelativeTime,
    formatShortSha,
} from '@/lib/format'
import type { BuildManifest } from '@/types/build'

interface BuildCardProps {
    build: BuildManifest
    isLatest?: boolean
    nowMs: number
}

export function BuildCard({ build, isLatest = false, nowMs }: BuildCardProps) {
    const [copied, setCopied] = useState(false)
    
    const downloadHref = `/api/builds/download?key=${encodeURIComponent(build.apkKey)}&redirect=1`
    const relativeTime = formatRelativeTime(build.timestamp, nowMs)
    const absoluteTime = formatAbsoluteTime(build.timestamp)
    
    async function handleCopySha() {
        try {
            await navigator.clipboard.writeText(build.sha256)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard access may be blocked in insecure contexts
        }
    }
    
    return (
        <Card className="transition-shadow hover:shadow-sm">
            <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <CardTitle className="truncate text-base font-semibold tracking-tight">
                            {build.app}
                        </CardTitle>
                        {isLatest && (
                            <Badge variant="default" className="text-[11px]">
                                Latest
                            </Badge>
                        )}
                    </div>
                    
                    <time
                        dateTime={build.timestamp}
                        title={absoluteTime}
                        className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs"
                    >
                        <Clock className="size-3.5" />
                        <span>{relativeTime}</span>
                    </time>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="max-w-full gap-1 font-normal">
                        <GitBranch className="size-3 shrink-0" />
                        <span className="truncate">{build.branch}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                            {build.commit}
                        </span>
                    </Badge>
                    
                    <Badge variant="outline" className="text-muted-foreground gap-1 font-normal">
                        <HardDrive className="size-3 shrink-0" />
                        <span>{formatFileSize(build.sizeBytes)}</span>
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-3">
                <p className="text-foreground/90 text-sm leading-relaxed break-words">
                    {build.notes || 'No build notes'}
                </p>
                
                <div className="bg-muted/70 flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground shrink-0 uppercase">
                            SHA-256
                        </span>
                        <code
                            title={build.sha256}
                            className="text-foreground truncate font-mono text-[11px]"
                        >
                            {formatShortSha(build.sha256)}
                        </code>
                    </div>
                    
                    <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handleCopySha}
                        aria-label={`Copy SHA-256 for ${build.app}`}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                        {copied ? (
                            <>
                                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="size-3" />
                                <span>Copy</span>
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
            
            <CardFooter className="flex items-center justify-between gap-3 pt-0">
                <span className="text-muted-foreground hidden text-xs sm:inline">
                    {absoluteTime}
                </span>
                
                <Button
                    render={<a href={downloadHref} />}
                    nativeButton={false}
                    className="w-full sm:ml-auto sm:w-auto"
                >
                    <Download className="size-4" />
                    Download APK
                </Button>
            </CardFooter>
        </Card>
    )
}
