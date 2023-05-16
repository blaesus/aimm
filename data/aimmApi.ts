import type { FileRecord, Job, Repository, Revision, StorageService } from "@prisma/client";

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

export interface SearchSuccess {
    ok: true,
    keyword: string,
    repos: Repository[],
    revisions: Revision[],
    fileRecords: FileRecord[],
}

export type JobType =
    "civitai-index"
    | "huggingface-index"
    | "obtain-files"

export const jobTypes: { [key in JobType]: JobType } = {
    "civitai-index": "civitai-index",
    "huggingface-index": "huggingface-index",
    "obtain-files": "obtain-files",
};

export interface StartJobSuccess {
    ok: true,
    job: Job,
}
