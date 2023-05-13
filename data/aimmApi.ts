export type HuggingfaceRepoType = "datasets" | "models";

export interface CivitaiIndexingParams {
    pageSize?: number,
    requestWaitMs?: number
}
export interface HuggingFaceReindexParams {
    pageSize?: number;
    initialPage?: string;
    requestWaitMs?: number;
    repoType?: HuggingfaceRepoType;
}
