import React from "react";
import ReactDOM from "react-dom/client";
import "./shared.css";
import MlpViz from "./visualization";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MlpViz />
  </React.StrictMode>
);
