// Convenient (and safer) access to database

import { prisma } from "./prismaClient";
import { Job, JobStatus } from "@prisma/client";

// If T has some field as JsonValue, use this type to make it usable in db.update
export type Savable<T, ValueField extends string> = Omit<Partial<Job>, ValueField> & {[key in ValueField]?: {}}
export const db = {
    jobs: {
        async initiate(props: {
            type: string,
            label: string
            total?: number,
            data?: {},
        }): Promise<Job> {
            const {type, data, label, total} = props;
            return prisma.job.create({
                data: {
                    status: "Running",
                    type,
                    label,
                    total,
                    created: Date.now(),
                    data,
                },
            });
        },
        async update(id: string, data: Savable<Job, "data">) {
            return prisma.job.update({
                where: {
                    id,
                },
                data,
            });
        }
    }
}
