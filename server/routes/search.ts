import Koa from "koa";
import { prisma } from "../../data/prismaClient";
import { SearchSuccess } from "../../data/aimmApi";
import { serialize } from "../../data/serialize";
import { FileRecord, Repository, Revision } from "@prisma/client";
import { dedupeById } from "./utils";

function looksLikeHashHex(s: string): boolean {
    return /^[0-9a-fA-F]{6,64}$/.test(s);
}

export async function search(ctx: Koa.Context) {
    const keyword = ctx.params.keyword;

    const reposByName = await prisma.repository.findMany({
        where: {
            name: {
                contains: keyword,
                mode: "insensitive",
            },
        },
        orderBy: {
            favour: "desc",
        },
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
                    in: filesByHash.map(f => f.revisionId),
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

    const revisions = [
        ...revisionsForReposByName,
        ...revisionsFromFilesByHash,
    ];

    const fileRecords = dedupeById([
        ...fileRecordsFromReposByName,
        ...filesByHash,
    ]);

    const repositories = dedupeById([
        ...reposByName,
        ...reposForFilesByHash,
    ]);

    const result: SearchSuccess = {
        ok: true,
        keyword,
        repositories,
        revisions,
        fileRecords,

        reposByName: reposByName.map(r => r.id),
        filesByHash: filesByHash.map(f => f.id),
    };

    ctx.set("Content-Type", "application/json");
    ctx.body = serialize(result);
}
