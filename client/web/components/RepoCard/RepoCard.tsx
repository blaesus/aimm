import React, { useContext } from "react";
import { Benchmark, BenchmarkResult, FileRecord, Registry, Repository, Revision } from "@prisma/client";
import { getRepoOnRevisionUrl, getRepoUrl } from "../../utils";

import "./RepoCard.css";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { HashTag } from "../HashTag/HashTag";
import { SizeTag } from "../SizeTag/SizeTag";
import { ObjectMap, ObjectWithId } from "../../../../data/sharedTypes";
import { ClientStateContext } from "../../context/state";
import { ClientState } from "../../reducer/state";

interface RepoMetaInfo {
    tags: string[];
    description: string,
}

type RepoRaw = { [key in string]: any };

function readRepoRaw(registry: Registry, rawInput?: any): Partial<RepoMetaInfo> {
    const raw: RepoRaw = JSON.parse(rawInput ? rawInput.toString() : "{}");
    switch (registry) {
        case "Civitai": {
            return {
                tags: raw.tags ?? [],
                description: raw.description ?? "",
            };
        }
        case "Huggingface": {
            return {
                tags: raw.tags ?? [],
            };
        }
        default: {
            return {};
        }
    }
}

type RevisionMetaInfo = {
    lastUpdated: Date,
    name: string
}

function readRevisionRaw(registry: Registry, rawInput?: any): Partial<RevisionMetaInfo> {
    const raw: RepoRaw = JSON.parse(rawInput ? rawInput.toString() : "{}");
    switch (registry) {
        case "Civitai": {
            return {
                lastUpdated: new Date(raw.updatedAt),
                name: raw.name,
            };
        }
        case "Huggingface": {
            return {
                lastUpdated: new Date(raw.lastModified),
            };
        }
        default: {
            return {};
        }
    }
}

export function FileRecordCard(props: {
    file: FileRecord
}) {
    const {file} = props;
    return (
        <a href={file.downloadUrl}>
            <div className="FileRecordCard">
                <span className="FilenameTag">{file.filename}</span>
                <SizeTag size={file.size}/>
                <HashTag hash={file.hashA}/>
            </div>
        </a>
    );
}

function chooseResult(results: BenchmarkResult[]): BenchmarkResult | undefined {
    return results.sort((a, b) => Number(b.time - a.time))[0];
}

function Txt2ImgBenchmarkBar(props: {
    fileId: string,
}) {
    const {fileId} = props;
    const {entities} = useContext<ClientState>(ClientStateContext);
    const {benchmarks, benchmarkResults} = entities;

    return (
        <div className="Txt2ImgBenchmarkBar">
            {
                Object.values(benchmarks).map(benchmark => {
                    const results = Object.values(benchmarkResults)
                                          .filter(r =>
                                              r.benchmarkId === benchmark.id
                                              && r.targetFileId === fileId,
                                          );
                    const result = chooseResult(results);
                    if (!result) {
                        return null;
                    }
                    const file = entities.fileRecords[result.resultFileId];
                    if (!file) {
                        return null;
                    }
                    return (
                        <img
                            key={file.id}
                            src={`/public/${file.downloadUrl}`}
                            alt={file.filename}
                            width={100}
                        />
                    );
                })
            }
        </div>
    );


}

export function FileList(props: {
    files: FileRecord[],
    repositories?: ObjectMap<Repository>,
    revisions?: ObjectMap<Revision>,
    benchmarks?: ObjectMap<Benchmark>,
    benchmarkResults?: ObjectMap<BenchmarkResult>,
    showRepo?: boolean,
    showBench?: boolean,
}) {
    const {files, repositories, revisions, showRepo} = props;
    const {entities} = useContext<ClientState>(ClientStateContext);
    const {benchmarkResults, benchmarks, fileRecords} = entities;

    return (
        <div className="FileRecordList">
            {
                files.map(f => {
                    if (showRepo && repositories && revisions) {
                        const rev = Object.values(revisions).find(r => r.id === f.revisionId);
                        if (rev) {
                            const repo = repositories[rev.repoId];
                            if (repo) {
                                return (
                                    <div key={f.id}>
                                        <h3>{repo.name} {repo.favour.toString()}</h3>
                                        <FileRecordCard key={f.id} file={f}/>
                                    </div>
                                );
                            }
                        }
                    }
                    if (props.showBench) {
                        return (
                            <div key={f.id}>
                                <Txt2ImgBenchmarkBar fileId={f.id}/>
                                <FileRecordCard key={f.id} file={f}/>
                            </div>
                        );
                    }
                    return <FileRecordCard key={f.id} file={f}/>;
                })
            }
        </div>
    );
}

export function RevisionCard(props: {
    revision: Revision,
    repository: Repository,
    registry: Registry,
    files: FileRecord[],
    defaultExpand?: boolean,
}) {
    const {revision, files, registry, repository} = props;
    const [expanded, setExpanded] = React.useState(props.defaultExpand ?? false);

    const meta = readRevisionRaw(registry, revision.raw);

    if (expanded) {
        return (
            <div key={revision.id} className="RevisionCard">
                <h3>
                    <a href={getRepoOnRevisionUrl(repository, revision.idInRegistry)}>
                        {meta.name}

                        <HashTag hash={revision.hashA}/>
                    </a>
                </h3>
                {meta.lastUpdated?.toISOString()}
                <FileList files={files} showBench={true}/>

                <div>
                    <h3>Install</h3>
                    <code>
                        aimm install {getRepoUrl(repository)}/tree/{revision.idInRegistry}
                    </code>
                </div>
            </div>
        );
    }
    else {
        return (
            <div>
                <h3>
                    <HashTag hash={revision.hashA}/>
                    <AnchorButton onClick={() => setExpanded(true)}>Expand</AnchorButton>
                </h3>
            </div>
        );
    }
}

export function RepoCard(props: {
    repoId: string,
    repositories: ObjectMap<Repository>,
    revisions: ObjectMap<Revision>,
    fileRecords: ObjectMap<FileRecord>,
}) {
    const {repoId, repositories, revisions, fileRecords} = props;
    const repo = repositories[repoId];
    if (!repo) {
        return null;
    }

    const repoRevisions = Object.values(revisions)
                                .filter(r => r.repoId === repoId)
                                .sort((r1, r2) => Number(r2.updatedInRegistry) - Number(r1.updatedInRegistry));

    const meta = readRepoRaw(repo.registry, repo.raw as string);


    return (
        <div key={repo.id} className="RepoCard">
            <h2><a href={getRepoUrl(repo)}>{repo.name}</a></h2>
            <div>
                {repo.registry}
            </div>
            <div>
                {repo.subtype}
            </div>
            <div>
                {repo.favour.toString()}
            </div>
            <div>
                {meta.tags?.map(tag => (
                    <span key={tag} className="TagLabel">{tag}</span>
                ))}
            </div>
            <div>
                {
                    repoRevisions.map((revision, i) => {
                        const files = Object.values(fileRecords).filter(r => r.revisionId === revision.id);
                        return (
                            <RevisionCard
                                key={revision.id}
                                revision={revision}
                                repository={repo}
                                registry={repo.registry}
                                defaultExpand={i === 0}
                                files={files}
                            />
                        );
                    })
                }
            </div>
        </div>
    );
}
