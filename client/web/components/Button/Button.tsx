import * as React from "react";

import "./Button.css"

export function Button(props: {
    className?: string,
    light?: boolean,
    secondary?: boolean,
    children?: React.ReactNode,
    onClick?(event: React.MouseEvent): void,
}) {
    return (
        <button
            className={`Button ${props.className || ""} ${props.secondary ? "secondary" : ""} ${props.light ? "light" : ""}`}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    )
}
