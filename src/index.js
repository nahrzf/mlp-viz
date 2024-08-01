import React from "react";
import ReactDOM from "react-dom/client";
import MlpViz from "./visualization";
import "./shared.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MlpViz />
  </React.StrictMode>
);
