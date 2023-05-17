const dateFields = ["time", "updated", "created", "started", "stopped", "updatedInRegistry"];

function jsonReplacerWithBigint(this: any, key: string, value: any) {
    if (typeof value === "bigint") {
        if (dateFields.includes(key)) {
            return new Date(Number(value)).toISOString();
        }
        else if (value < Number.MAX_SAFE_INTEGER) {
            return Number(value);
        }
        else {
            return value.toString();
        }
    }
    else {
        return value;
    }
}

export function serialize(obj: any, pretty = true): string {
    const indent = pretty ? 4 : undefined;
    return JSON.stringify(obj, jsonReplacerWithBigint, indent);
}
