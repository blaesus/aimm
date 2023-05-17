import React from "react";
import "./TopBar.css"
export function TopBar() {
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
