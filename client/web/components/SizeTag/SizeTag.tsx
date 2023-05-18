import React from "react";

import "./SizeTag.css";

export function SizeTag(props: {
    size: number | bigint | null | undefined
}) {
    const {size} = props;
    if (!size) {
        return null;
    }
    let sizeDisplay = Number(size);
    let unit = "B";
    if (sizeDisplay > 1024) {
        sizeDisplay /= 1024;
        unit = "KB";
    }
    if (sizeDisplay > 1024) {
        sizeDisplay /= 1024;
        unit = "MB";
    }
    if (sizeDisplay > 1024) {
        sizeDisplay /= 1024;
        unit = "GB";
    }
    return (
        <span title={`${size}B`} className="SizeTag">
            {sizeDisplay.toFixed(1)}{unit}
        </span>
    );
}
