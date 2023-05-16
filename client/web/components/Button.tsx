import React from "react";

export function Button(props: {
    children: React.ReactNode,
    onClick?: () => void,
}) {
    return (
        <a
            onClick={props.onClick}
            role="button"
        >
            {props.children}
        </a>
    );
}
