import * as React from "react";
import "./Chooser.css";

export type OptionList<Value = string> = { value: Value, label: string }[]

export function Chooser<Value>(props: {
    options: OptionList<Value>,
    chosen: Value,
    onChoose(value: Value): void
}) {
    const options = props.options || [];
    return (
        <span className="Chooser">
            {
                options.map(o =>
                    <a
                        key={o.label}
                        className={`Option ${o.value === props.chosen ? "chosen" : ""}`}
                        role="button"
                        onClick={() => props.onChoose(o.value)}
                    >
                        {o.label}
                    </a>
                )
            }
        </span>
    )

}
