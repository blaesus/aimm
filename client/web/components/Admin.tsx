import React, { useEffect } from "react";
import { Job, JobStatus } from "@prisma/client";
import { GetJobsSuccess, JobType, jobTypes } from "../../../data/aimmApi";
import { ADMIN_TOKEN_KEY } from "../shared";
import { AnchorButton } from "./AnchorButton/AnchorButton";

export function Admin() {

    async function getJobs(type: JobType) {
        const response = await fetch(`/admin/jobs/${type}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_KEY)}`,
            }
        })
        const data: GetJobsSuccess = await response.json()
        await setJobs(data.jobs as any[] as Job[])
    }

    useEffect(() => {
        Object.values(jobTypes).forEach(jobType => getJobs(jobType))
    }, [])

    const [jobs, setJobs] = React.useState<Job[]>([])

    const [adminToken, setAdminToken] = React.useState<string>("")

    useEffect(() => {
        setAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY) || "")
    }, [])

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
                        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken)
                    }}
                >
                    Set admin token
                </AnchorButton>
            </div>

            <main>
                <h2>Jobs</h2>
                <table>
                    <tbody>
                        {
                            Object.values(jobTypes).map(jobType => (
                                <tr key={jobType}>
                                    <td>{jobType}</td>
                                    <td><AnchorButton>Start</AnchorButton></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </main>


        </div>
    )

}
