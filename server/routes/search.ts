import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { SearchSuccess } from "../../data/aimmApi";
import { serialize } from "../../data/serialize";
import { FileRecord, Repository, Revision } from "@prisma/client";
import { dedupeById } from "./utils";

function looksLikeHashHex(s: string): boolean {
    return /^[0-9a-fA-F]{6,64}$/.test(s);
}

const MAX_PAGE_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 100;

export async function search(ctx: Koa.Context) {
    const keyword = ctx.params.keyword;
    const pageSize = ctx.params.limit || DEFAULT_PAGE_SIZE;
    const page = ctx.params.page || 0;

    const reposByName = await prisma.repository.findMany({
        where: {
            name: keyword || {
                contains: keyword,
                mode: "insensitive",
            },
        },
        orderBy: {
            favour: "desc",
        },
        take: Math.min(MAX_PAGE_SIZE, pageSize),
        skip: page ? page * pageSize : undefined,
    });

    const revisionsForReposByName = await prisma.revision.findMany({
        where: {
            repoId: {
                in: reposByName.map(repo => repo.id),
            },
        },
    });

    const fileRecordsFromReposByName = await prisma.fileRecord.findMany({
        where: {
            revisionId: {
                in: revisionsForReposByName.map(revision => revision.id),
            },
        },
    });

    let filesByHash: FileRecord[] = [];
    if (looksLikeHashHex(keyword)) {
        filesByHash = await prisma.fileRecord.findMany({
            where: {
                hashA: {
                    startsWith: keyword.toLowerCase(),
                },
            },
        });
    }
    let revisionsFromFilesByHash: Revision[] = [];
    if (filesByHash.length) {
        revisionsFromFilesByHash = await prisma.revision.findMany({
            where: {
                id: {
                    in: filesByHash.map(f => f.revisionId || ""),
                },
            },
        });
    }
    let reposForFilesByHash: Repository[] = [];
    if (filesByHash.length) {
        reposForFilesByHash = await prisma.repository.findMany({
            where: {
                id: {
                    in: revisionsFromFilesByHash.map(f => f.repoId),
                },
            },
        });

    }

    const revisions = dedupeById([
        ...revisionsForReposByName,
        ...revisionsFromFilesByHash,
    ]);

    const foundFiles = dedupeById([
        ...fileRecordsFromReposByName,
        ...filesByHash,
    ]);

    const repositories = dedupeById([
        ...reposByName,
        ...reposForFilesByHash,
    ]);

    const benchmarks = await prisma.benchmark.findMany({});

    const benchmarkResults = await prisma.benchmarkResult.findMany({
        where: {
            targetFileId: {
                in: foundFiles.map(f => f.id),
            },
        },
    });

    const benchmarkResultFiles: FileRecord[] = await prisma.fileRecord.findMany({
        where: {
            id: {
                in: benchmarkResults.map(r => r.resultFileId),
            },
        },
    });

    const fileRecords = dedupeById([
        ...foundFiles,
        ...benchmarkResultFiles,
    ]);

    const result: SearchSuccess = {
        ok: true,
        keyword,
        repositories,
        revisions,
        fileRecords,
        benchmarks,
        benchmarkResults,

        reposByName: reposByName.map(r => r.id),
        filesByHash: filesByHash.map(f => f.id),
    };

    ctx.set("Content-Type", "application/json");
    ctx.body = serialize(result);
}
