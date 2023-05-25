import type { Benchmark, BenchmarkResult, FileRecord, Job, Repository, Revision, StorageService } from "@prisma/client";
import { BenchTargetApiItems } from "../server/routes/getBenchTargets";
import { getRegistry } from "../server/serverUtils";

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

export interface MatchedItems {
    reposByName: string[],
    filesByHash: string[],
}

export interface SearchSuccess extends MatchedItems {
    ok: true,
    keyword: string,
    page: number,
    pageSize: number,

    repositories: Repository[],
    revisions: Revision[],
    fileRecords: FileRecord[],
    benchmarks: Benchmark[],
    benchmarkResults: BenchmarkResult[],
}

export type JobType =
    "civitai-index"
    | "huggingface-index"
    | "obtain-files"
    | "execute-benches";

export const jobTypes: { [key in JobType]: JobType } = {
    "civitai-index": "civitai-index",
    "huggingface-index": "huggingface-index",
    "obtain-files": "obtain-files",
    "execute-benches": "execute-benches",
};

export interface StartJobSuccess {
    ok: true,
    job: Job,
}

export interface StopJobSuccess {
    ok: true,
    job: Job
}

export interface CreateBenchmarkRequest extends Pick<Benchmark, "type" | "subtype" | "name" | "parameters"> {
}

export interface BenchExecuteParams {
    benchIds: string[],
    revisionIds: string[],
}

export interface GetBenchesSuccess {
    ok: true,
    benches: Benchmark[],
}

export interface GetBenchTargetsSuccess {
    ok: true,
    repositories: BenchTargetApiItems[],
}

export interface BenchTxt2ImgFileTarget {
    type: "txt2img"
    subtype: string,
    repository: string,
    revision: string,
    file: string,
    downloadUrl: string,
    filename: string,
}

export interface SearchParams {
    keyword?: string,
    page?: number,
    pageSize?: number,
    registry?: string,
}
