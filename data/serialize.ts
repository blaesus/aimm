function jsonReplacerWithBigint(this: any, key: string, value: any) {
    if (typeof value === "bigint") {
        if (value < Number.MAX_SAFE_INTEGER) {
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
