import { Job, StorageService } from "@prisma/client";

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
export interface ObtainFilesParams {
    id?: string,
    service?: StorageService,
    registry?: string,
    batchSize?: number;
    // Minimal favour for a repo to be obtained
    favourThreshold?: number;
}

export interface JobJson extends Omit<Job, "created" | "stopped"> {
    created: string;
    stopped: string;
}

export interface GetJobsSuccess {
    ok: true;
    jobs: JobJson[];
}
