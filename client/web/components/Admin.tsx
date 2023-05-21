import React, { useEffect } from "react";
import { Benchmark, Job, JobStatus, Registry, Repository } from "@prisma/client";
import {
    BenchExecuteParams,
    CivitaiIndexingParams, GetBenchesSuccess,
    GetJobsSuccess, GetRepositorySuccess, HuggingFaceReindexParams, HuggingfaceRepoType,
    JobType,
    ObtainFilesParams,
    StopJobSuccess,
} from "../../../data/aimmApi";
import { ADMIN_TOKEN_KEY } from "../shared";
import { AnchorButton } from "./AnchorButton/AnchorButton";
import { Chooser } from "./Chooser/Chooser";

import "./Admin.css";
import { Button } from "./Button/Button";
import { RepositoryApiItems } from "../../../server/routes/repos";

function ObtainLaunchPad(props: {
    onLaunch: (params: Partial<ObtainFilesParams>) => void
}) {
    const [registry, setRegistry] = React.useState<Registry | undefined>("Huggingface");
    const [batchSize, setBatchSize] = React.useState<number>(100);

    return (
        <div className="ObtainLaunchPad">
            <h3>Obtain files</h3>
            <div>
                <Chooser
                    options={Object.values(Registry).map(r => ({value: r, label: r}))}
                    chosen={registry}
                    onChoose={setRegistry}
                />
            </div>
            <label>
                Batch size:
                <input
                    type="number"
                    value={batchSize}
                    onChange={e => {
                        setBatchSize(parseInt(e.target.value));
                    }}
                />
            </label>
            <AnchorButton
                onClick={() => {
                    props.onLaunch({
                        registry,
                        batchSize,
                    });
                }}
            >
                Launch
            </AnchorButton>
        </div>
    );
}

function CivitaiIndexLaunchPad(props: {
    onLaunch: (params: Partial<CivitaiIndexingParams>) => void
}) {
    const [pageSize, setPageSize] = React.useState<number>(100);

    return (
        <div className="CivitaiReindexerLaunchPad">
            <h3>Reindex civitai</h3>
            <label>
                Batch size:
                <input
                    type="number"
                    value={pageSize}
                    onChange={e => {
                        setPageSize(parseInt(e.target.value));
                    }}
                />
            </label>
            <AnchorButton
                onClick={() => {
                    props.onLaunch({
                        pageSize,
                    });
                }}
            >
                Launch
            </AnchorButton>
        </div>
    );
}

function HuggingfaceIndexLaunchPad(props: {
    onLaunch: (params: Partial<HuggingFaceReindexParams>) => void
}) {
    const [pageSize, setPageSize] = React.useState<number>(1000);
    const [repoType, setRepoType] = React.useState<HuggingfaceRepoType>("models");

    const repoTypes: HuggingfaceRepoType[] = ["models", "datasets"];

    return (
        <div className="HuggingfaceReindexerLaunchPad">
            <h3>Reindex Huggingface</h3>
            <Chooser
                options={repoTypes.map(r => ({value: r, label: r}))}
                chosen={repoType}
                onChoose={
                    r => setRepoType(r)
                }
            />
            <label>
                Page size:
                <input
                    type="number"
                    value={pageSize}
                    onChange={e => {
                        setPageSize(parseInt(e.target.value));
                    }}
                />
            </label>
            <AnchorButton
                onClick={() => {
                    props.onLaunch({
                        pageSize,
                        repoType,
                    });
                }}
            >
                Launch
            </AnchorButton>
        </div>
    );
}

async function startNewJob(
    type: JobType,
    params?: Partial<CivitaiIndexingParams | HuggingFaceReindexParams | ObtainFilesParams>,
) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    await fetch(`/admin-api/jobs/${type}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(params),
    });
}

function BenchmarkPanel() {
    const [benchmarks, setBenchmarks] = React.useState<Benchmark[]>([]);
    const [repos, setRepos] = React.useState<RepositoryApiItems[]>([]);
    return (
        <section>
            <h2>Benchmarks</h2>
            <Button
                onClick={async () => {
                    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
                    const response = await fetch(
                        "/admin-api/benchmarks",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    const data: GetBenchesSuccess = await response.json();
                    setBenchmarks(data.benches);
                }}
            >
                Get benchmarks
            </Button>
            <Button
                onClick={async () => {
                    const response = await fetch(
                        "/api/repositories?limit=5&registry=Civitai",
                    );
                    const data: GetRepositorySuccess = await response.json();
                    setRepos(data.repositories);
                }}
            >
                Get repos
            </Button>
            <div>
                {
                    repos.map(r => (
                        <div key={r.id}>
                            <div>{r.id}</div>
                        </div>
                    ))
                }
            </div>
            <div>
                {
                    benchmarks.map(b => (
                        <div key={b.id}>
                            <div>{b.id}</div>
                            <div>{b.name}</div>

                            <Button
                                onClick={async () => {
                                    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
                                    const params: BenchExecuteParams = {
                                        benchIds: [b.id],
                                        targetRevisionsIds: [],
                                    };
                                    const response = await fetch(
                                        "/admin-api/benchmarks/execute",
                                        {
                                            method: "POST",
                                            body: JSON.stringify(params),
                                            headers: {
                                                Authorization: `Bearer ${token}`,
                                            },
                                        },
                                    );
                                    const data = await response.json();
                                    console.info(data);
                                }}
                            >Execute</Button>
                        </div>
                    ))
                }
            </div>
        </section>
    );
}

export function Admin() {

    const [adminToken, setAdminToken] = React.useState<string>("");

    async function getJobs() {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        const response = await fetch(`/admin-api/jobs/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data: GetJobsSuccess = await response.json();
        await setJobs(data.jobs as any[] as Job[]);
    }


    useEffect(() => {
        getJobs();
    }, []);

    const [jobs, setJobs] = React.useState<Job[]>([]);


    useEffect(() => {
        setAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY) || "");
    }, []);

    return (
        <div className="Admin">
            <div>
                <input
                    type="password"
                    value={adminToken}
                    onChange={e => setAdminToken(e.target.value)}
                />
                <Button
                    onClick={() => {
                        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
                    }}
                >
                    Set admin token
                </Button>
            </div>

            <main>
                <h2>Jobs</h2>
                <div>
                    <div className="SpiderLaunchBox">
                        <ObtainLaunchPad
                            onLaunch={async params => {
                                await startNewJob("obtain-files", params);
                                await getJobs();
                            }}
                        />
                        <CivitaiIndexLaunchPad
                            onLaunch={async params => {
                                await startNewJob("civitai-index", params);
                                await getJobs();
                            }}
                        />
                        <HuggingfaceIndexLaunchPad
                            onLaunch={async params => {
                                await startNewJob("huggingface-index", params);
                                await getJobs();
                            }}
                        />
                    </div>
                </div>
                <table>
                    <tbody>
                        <tr>
                            <th>id</th>
                            <th>type</th>
                            <th>status</th>
                            <th>total</th>
                            <th>processed</th>
                            <th>start</th>
                        </tr>
                        {
                            jobs.map(job => (
                                <tr key={job.id}>
                                    <td>{job.id}</td>
                                    <td>{job.type}</td>
                                    <td>{job.status}</td>
                                    <td>{job.total}</td>
                                    <td>{job.processed}</td>
                                    <td>{job.created.toString()}</td>
                                    <td>
                                        <AnchorButton
                                            onClick={async () => {
                                                const response = await fetch(`/admin-api/jobs/${job.id}`, {
                                                    headers: {
                                                        Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_KEY)}`,
                                                    },
                                                    method: "DELETE",
                                                });
                                                const data: StopJobSuccess = await response.json();
                                                await getJobs();
                                            }}
                                        >
                                            Cancel
                                        </AnchorButton>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <BenchmarkPanel/>
            </main>
        </div>
    );

}
