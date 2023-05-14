import React from "react";
import { Button } from "./Button";
import { ADMIN_TOKEN_KEY } from "./shared";
import { SpiderType } from "../../../server/routes/utils";
import { Job, JobStatus } from "@prisma/client";
import { GetJobsSuccess } from "../../../data/aimmApi";

export function Admin() {
    async function get() {
        const response = await fetch("/api/hello")
        const data = await response.json()
        console.info(data)
    }

    async function getJobs(type: SpiderType) {
        const response = await fetch(`/admin-api/jobs/${type}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_KEY)}`,
            }
        })
        const data: GetJobsSuccess = await response.json()
        await setJobs(data.jobs as any[] as Job[])
    }

    React.useEffect(() => {
        get().catch(console.error)
    }, [])

    const [jobs, setJobs] = React.useState<Job[]>([])

    const [adminToken, setAdminToken] = React.useState<string>("")

    return (
        <div className="Admin">
            <div>
                <input
                    type="text"
                    value={adminToken}
                    onChange={e => setAdminToken(e.target.value)}
                />
                <Button
                    onClick={() => {
                        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken)
                    }}
                >
                    Set admin token
                </Button>
            </div>

            <div>
                <Button onClick={() => getJobs("civitai")}>
                    Get civitai
                </Button>
                {
                    jobs.map(job => (
                        <div key={job.id}>
                            {job.id} {job.label} {job.status}
                        </div>
                    ))
                }
            </div>

        </div>
    )

}
