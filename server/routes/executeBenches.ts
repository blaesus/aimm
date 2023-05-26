import { getWebuiApiRequester, WebUiApiRequester } from "../ai/sd-webui-api";
import { prisma } from "../../data/prismaClient";
import { hashLocalFile, sleep } from "../jobs/utils";
import { BenchExecuteParams, BenchTxt2ImgFileTarget, ObtainFilesParams } from "../../data/aimmApi";
import { aiModelExtensions, looksLikeAiModel, sizeLocalFile } from "../serverUtils";
import path from "path";
import { NodeSSH, SSHExecCommandResponse } from "node-ssh";
import { JobDescription, JobStats } from "../jobs/job";
import { Benchmark } from "@prisma/client";

interface RemoteSSHController {
    connection: NodeSSH,

    connect(): Promise<void>

    execCommand(command: string): Promise<SSHExecCommandResponse>
}

function makeRemoteControl(): RemoteSSHController {
    const remoteControl: RemoteSSHController = {
        connection: new NodeSSH(),
        async connect() {
            remoteControl.connection = await remoteControl.connection.connect({
                host: "104.143.3.153",
                username: "root",
                port: 10168,
                privateKey: process.env["SD_PRIVATE_KEY"],
            });
        },
        async execCommand(command: string) {
            if (!remoteControl.connection.isConnected()) {
                console.info("Remote control disconnected; reconnecting...");
                await remoteControl.connect();
            }
            return remoteControl.connection.execCommand(command);
        },
    };
    return remoteControl;
}


interface BenchJobProps {
    benchIds: string[],
    targets: BenchTxt2ImgFileTarget[],
    jobId: string
}

const webuiApiBase = "https://9vccn95kcg7bk5-3000.proxy.runpod.net";


const ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36`;

const modelRoot = `/workspace/stable-diffusion-webui/models/Stable-diffusion/for_bench`;

const PARTIAL_EXT = "part";

function downloadInBackground(remoteControl: RemoteSSHController, url: string, filename: string) {
    const tempPath = `${modelRoot}/${filename}.${PARTIAL_EXT}`;
    const finalPath = `${modelRoot}/${filename}`;
    const wget = `wget --user-agent="${ua}" --quiet -O "${tempPath}" "${url}"`;
    remoteControl.execCommand(`nohup ${wget} &`)
                 .then(() => {
                     remoteControl.execCommand(`mv "${tempPath}" "${finalPath}"`).catch(console.error);
                 })
                 .catch(console.error);
}

async function downloadModels(remoteControl: RemoteSSHController, targets: BenchTxt2ImgFileTarget[]) {
    for (const target of targets) {
        downloadInBackground(remoteControl, target.downloadUrl, target.filename);
    }
}

async function allModelsReady(remoteControl: RemoteSSHController, targets: BenchTxt2ImgFileTarget[]): Promise<boolean> {
    const result = await remoteControl.execCommand(`ls ${modelRoot}`);
    const existingFiles = result.stdout.split("\n").filter(Boolean);
    const finishedFiles = existingFiles.filter(file => !file.endsWith(`.${PARTIAL_EXT}`));
    console.info("existingFiles", existingFiles);
    console.info("finishedFiles", finishedFiles);
    console.info("targets", targets);
    return targets.every(target => finishedFiles.includes(target.filename));
}

async function clearModels(remoteControl: RemoteSSHController) {
    const fallbackRoot = `/workspace/stable-diffusion-webui/models/Stable-diffusion/for_bench`;
    const root = modelRoot || fallbackRoot; // Ensure we don't delete everything
    return remoteControl.execCommand(`rm -rf ${root}/*`);
}

async function deleteModelFile(remoteControl: RemoteSSHController, filepath: string) {
    return remoteControl.execCommand(`rm "${filepath}"`);
}

interface State extends JobStats {
    targets: BenchTxt2ImgFileTarget[]
    benches: Benchmark[],
    remoteControl: RemoteSSHController,
    requester: WebUiApiRequester,
    processed: number,
}

export const benchExecutor: JobDescription<BenchExecuteParams, State> = {
    name: "bench-executor",
    async init(params) {
        const {benchIds, revisionIds} = params;
        const records = await prisma.revision.findMany({
            where: {
                id: {
                    in: params.revisionIds,
                },
            },
            select: {
                id: true,
                repo: {
                    select: {
                        id: true,
                    },
                },
                fileRecords: {
                    select: {
                        id: true,
                        downloadUrl: true,
                        filename: true,
                        hashA: true,
                    },
                },
            },
            take: params.revisionIds.length,
        });
        const targets: BenchTxt2ImgFileTarget[] = records
            .map(record =>
                record.fileRecords.map((file): BenchTxt2ImgFileTarget => ({
                    type: "txt2img" as "txt2img",
                    subtype: "stable-diffusion",
                    downloadUrl: file.downloadUrl,
                    repository: record.repo.id,
                    revision: record.id,
                    file: file.id,
                    filename: `${file.hashA}_${file.filename}`,
                })),
            )
            .flat()
            .sort((a, b) => a.revision.localeCompare(b.revision));

        const remoteControl = makeRemoteControl();
        await remoteControl.connect();
        console.info("Connected");
        await clearModels(remoteControl);

        const benches = await prisma.benchmark.findMany({
            where: {
                id: {
                    in: benchIds,
                },
            },
        });

        const label = `txt2img-bench-${Date.now()}`;

        const requester = getWebuiApiRequester(webuiApiBase);


        return {
            targets,
            benches,
            remoteControl,
            requester,
            total: targets.length,
            processed: 0,
        };
    },
    async iterate(state) {
        const {targets, benches, remoteControl, requester} = state;
        const target = targets[state.processed];
        if (!target) {
            return false;
        }
        state.processed += 1;

        console.info(`Processing target file ${target.filename}`);

        try {
            // Skip if benches had been executed for this target
            {
                let allBenchesDone = true;
                for (const bench of benches) {
                    const existingResults = await prisma.benchmarkResult.count({
                        where: {
                            benchmarkId: bench.id,
                            targetFileId: target.file,
                        },
                    });
                    if (existingResults === 0) {
                        allBenchesDone = false;
                        break;
                    }
                }
                if (allBenchesDone) {
                    console.info(`Found existing benchmark result for ${target.filename} on all benches, skipped`);
                    return true;
                }
            }
            {
                if (!looksLikeAiModel(target.filename)) {
                    console.info(`${target.filename} is not a model file, skipped`);
                    return true;
                }
            }

            {
                const start = Date.now();
                await downloadModels(remoteControl, [target]);
                console.info(`started to download target ${target.filename} (${target.downloadUrl})`);
                while (true) {
                    if (await allModelsReady(remoteControl, [target])) {
                        break;
                    }
                    if (Date.now() - start > 1000_000) {
                        console.error(`timeout when getting ${target.filename}`);
                        return true;
                    }
                    console.info(`${target.filename} Not ready...`);
                    await sleep(10_000);
                }
                console.info(`${target.filename} ready`);
            }
            await requester.refreshCheckpoints();
            const models = await requester.getCheckpoints();
            const model = models.find(model => model.filename.includes(target.filename));
            if (!model) {
                console.error("no model found:", target.filename);
                return true;
            }

            await requester.setCheckpointWithTitle(model.title);
            for (const bench of benches) {
                // Find existing result, skip if found
                const params = JSON.parse(JSON.stringify((bench.parameters)));
                const time = Date.now();
                const filename = `${bench.id}_${target.file}_${time}.png`;
                const pathName = path.join("benches", filename);
                const benchResultPath = path.join(process.env["PUBLIC_ASSET_BASE"] || ".", pathName);
                console.info("Trying to generate bench result, to be saved to", benchResultPath);
                const success = await requester.txt2img(params, benchResultPath);
                await clearModels(remoteControl);
                if (success) {
                    const hash = await hashLocalFile(benchResultPath);
                    const size = await sizeLocalFile(benchResultPath);
                    if (hash === null || size === null) {
                        console.info(`Failed to hash or size local file ${benchResultPath}`);
                        continue;
                    }
                    const file = await prisma.fileRecord.create({
                        data: {
                            revisionId: undefined,
                            filename,
                            downloadUrl: pathName,
                            hashA: hash,
                            updated: time,
                            size,
                        },
                    });

                    const storage = await prisma.fileStorageRecord.create({
                        data: {
                            hashA: hash,
                            service: "Local",
                            idInService: benchResultPath,
                            created: time,
                            size,
                        },
                    });

                    await prisma.fileStorageRecordOnFileRecord.create({
                        data: {
                            fileRecordId: file.id,
                            fileStorageRecordId: storage.id,
                            assignmentTime: time,
                        },
                    });

                    await prisma.benchmarkResult.create({
                        data: {
                            benchmarkId: bench.id,
                            targetFileId: target.file,
                            resultFileId: file.id,
                            time,
                        },
                    });
                }
                await sleep(1000);
            }
            return true;
        }
        catch (error) {
            console.error(error);
            return true;
        }
    },

};
