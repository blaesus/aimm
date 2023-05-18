import React from "react";
import "./HashTag.css"
export function HashTag(props: {hash: string}) {
    const {hash} = props;
    return (
        <span className="HashTag" title={hash}>{hash.slice(0, 8)}</span>
    )
}
