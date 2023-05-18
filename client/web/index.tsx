import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import "normalize.css";
import "./index.css";

const rootDom = ReactDOM.createRoot(
    document.getElementById("REACT-ROOT") as HTMLElement,
);

rootDom.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
);
