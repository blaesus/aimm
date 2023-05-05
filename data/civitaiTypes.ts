type CivitaiModelType =
    "Checkpoint"
    | "TextualInversion"
    | "Hypernetwork"
    | "AestheticGradient"
    | "LORA"
    | "LoCon"
    | "Controlnet"
    | "Poses"
    | "Wildcards"
    | "Other"

type ModelStatus =
    "Draft"
    | "Published"
    | "Unpublished"
    | "UnpublishedViolation"
    | "GatherInterest"
    | "Deleted"

type CheckpointType = "Trained" | "Merge"

type ModelModifier = "Archived" | "TakenDown"

type CommercialUse = "None" | "Image" | "Rent" | "Sell"

export type CivitaiModelJson = {
    id: number
    name: string
    description: string | null
    type: CivitaiModelType
    createdAt: string
    updatedAt: string
    lastVersionAt: string | null
    nsfw: boolean
    tosViolation: boolean
    poi: boolean
    userId: number
    status: ModelStatus
    publishedAt: string | null
    fromImportId: number | null
    meta: {}
    deletedAt: string | null
    deletedBy: number | null
    checkpointType: CheckpointType | null
    locked: boolean
    underAttack: boolean
    earlyAccessDeadline: Date | null
    mode: ModelModifier | null
    allowNoCredit: boolean
    allowCommercialUse: CommercialUse
    allowDerivatives: boolean
    allowDifferentLicense: boolean

    // Joined fields
    modelVersions: CivitaiModelVersionJson[],
    "stats": {
        "downloadCount": number,
        "favoriteCount": number,
        "commentCount": number,
        "ratingCount": number,
        "rating": number,
    },
}

export type CivitaiModelVersionJson = {
    id: number
    index: number | null
    name: string
    description: string | null
    modelId: number
    trainedWords: string[]
    steps: number | null
    epochs: number | null
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    status: ModelStatus
    fromImportId: number | null
    inaccurate: boolean
    baseModel: string | null
    meta: {}
    earlyAccessTimeFrame: number

    // Joined fields
    files: CivitaiModelFileJson[],
    creator: {
        username: string,
    }
    tags: string[],
    stats: {
        "downloadCount": number,
        "ratingCount": number,
        "rating": number
    }
}

type ScanResultCode = "Pending" | "Success" | "Danger" | "Error"

export type CivitaiModelFileJson = {
    id: number
    name: string
    url: string
    sizeKB: number
    createdAt: Date
    type: string
    modelVersionId: number
    pickleScanResult: ScanResultCode
    exists: boolean | null
    pickleScanMessage: string | null
    virusScanResult: ScanResultCode
    virusScanMessage: string | null
    scannedAt: Date | null
    scanRequestedAt: Date | null
    rawScanResult: {} | null
    metadata: { fp: string, size: string, format: string } | null
    "hashes": {
        AutoV1?: string,
        AutoV2?: string,
        SHA256?: string,
        CRC32?: string,
        BLAKE3?: string,
    },

    // Joined fields
    downloadUrl: string

}
