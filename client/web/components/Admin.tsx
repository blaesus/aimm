import React, { useEffect } from "react";
import { Job, JobStatus } from "@prisma/client";
import { GetJobsSuccess, JobType, jobTypes } from "../../../data/aimmApi";
import { ADMIN_TOKEN_KEY } from "../shared";
import { AnchorButton } from "./AnchorButton/AnchorButton";

export function Admin() {

    const [adminToken, setAdminToken] = React.useState<string>("");
    async function getJobs() {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        const response = await fetch(`/admin/jobs/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data: GetJobsSuccess = await response.json();
        await setJobs(data.jobs as any[] as Job[]);
    }

    async function startNewJob(type: JobType) {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        const response = await fetch(`/admin/jobs/${type}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method: "POST",
        });
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
                <AnchorButton
                    onClick={() => {
                        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
                    }}
                >
                    Set admin token
                </AnchorButton>
            </div>

            <main>
                <h2>Jobs</h2>
                <div>
                    {
                        Object.values(jobTypes).map(jobType => (
                            <AnchorButton
                                key={jobType}
                                newLine={true}
                                onClick={() => startNewJob(jobType)}
                            >
                                Start {jobType}
                            </AnchorButton>
                        ))
                    }
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
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </main>


        </div>
    );

}
