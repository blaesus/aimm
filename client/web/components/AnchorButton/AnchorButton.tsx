import * as React from "react";
import "./AnchorButton.css";

export function AnchorButton(props: {
    children?: React.ReactNode,
    className?: string,
    href?: string
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
    disabled?: boolean,
    newLine?: boolean,
}) {
    const className = `
    AnchorButton
    ${props.className || ""}
    ${props.disabled ? "disabled" : "none"}
    ${props.newLine ? "new-line" : ""}
    `;
    return (
        <a
            className={className}
            onClick={(event) => {
                event.preventDefault();
                props.onClick && props.onClick(event);
            }}
            role="button"
            href={props.href}
        >
            {props.children}
        </a>
    );

}
