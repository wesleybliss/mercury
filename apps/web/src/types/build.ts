export interface BuildManifest {
    id: string
    app: string
    timestamp: string
    branch: string
    commit: string
    notes: string
    sha256: string
    apkKey: string
    sizeBytes: number
}
