import React from "react";
import "./TopBar.css"
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
export function TopBar(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {
    const [keyword, setKeyword] = React.useState("")
    return (
        <nav className="TopBar">
            aimm
            <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
            />
        </nav>
    )
}
