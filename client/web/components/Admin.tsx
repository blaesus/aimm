import React, { useEffect } from "react";
import { Job, JobStatus } from "@prisma/client";
import { GetJobsSuccess, JobType, jobTypes } from "../../../data/aimmApi";
import { ADMIN_TOKEN_KEY } from "../shared";
import { AnchorButton } from "./AnchorButton/AnchorButton";

export function Admin() {

    const [adminToken, setAdminToken] = React.useState<string>("");
    async function getJobs() {
        const response = await fetch(`/admin/jobs/`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        const data: GetJobsSuccess = await response.json();
        await setJobs(data.jobs as any[] as Job[]);
    }

    async function startNewJob(type: JobType) {
        const response = await fetch(`/admin/jobs/${type}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
            method: "POST",
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
                            >
                                Start {jobType}
                            </AnchorButton>
                        ))
                    }
                </div>
                <table>
                    <tbody>
                        {
                            jobs.map(job => (
                                <tr>
                                    <td>{job.id}</td>
                                    <td>{job.type}</td>
                                    <td>{job.status}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </main>


        </div>
    );

}
