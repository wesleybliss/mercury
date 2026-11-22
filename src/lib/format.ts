const COMPACT_TS_REGEX = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(?:(\d{2}))?$/

export function parseBuildTimestamp(timestamp: string): Date | null {
    const match = COMPACT_TS_REGEX.exec(timestamp.trim())
    if (match) {
        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10) - 1
        const day = Number.parseInt(match[3], 10)
        const hour = Number.parseInt(match[4], 10)
        const minute = Number.parseInt(match[5], 10)
        const second = match[6] ? Number.parseInt(match[6], 10) : 0
        const date = new Date(Date.UTC(year, month, day, hour, minute, second))
        return Number.isNaN(date.getTime()) ? null : date
    }
    
    const parsed = new Date(timestamp)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatRelativeTime(timestamp: string, nowMs = Date.now()): string {
    const date = parseBuildTimestamp(timestamp)
    if (!date) return timestamp
    
    const diffSeconds = Math.round((nowMs - date.getTime()) / 1000)
    if (diffSeconds < 60) return 'just now'
    
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths}mo ago`
    
    const diffYears = Math.floor(diffDays / 365)
    return `${diffYears}y ago`
}

export function formatAbsoluteTime(timestamp: string): string {
    const date = parseBuildTimestamp(timestamp)
    if (!date) return timestamp
    
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date)
}

export function formatFileSize(sizeBytes: number): string {
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) return '0 MB'
    const mb = sizeBytes / (1024 * 1024)
    if (mb >= 100) return `${mb.toFixed(0)} MB`
    if (mb >= 10) return `${mb.toFixed(1)} MB`
    return `${mb.toFixed(2)} MB`
}

export function formatShortSha(sha256: string): string {
    return sha256.slice(0, 12)
}
