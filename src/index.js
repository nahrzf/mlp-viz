import React from "react";
import ReactDOM from "react-dom/client";
import MlpViz from "./visualization";
import WeightMatrixAndParams from "./components/WeightMatrix";
import LossChart from "./components/LossChart";
import ActivationVectors from "./components/ActivationVectors";
import GradientMatrix from "./components/GradientMatrix";
import "./shared.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MlpViz />
  </React.StrictMode>
);

export {
  MlpViz as default,
  WeightMatrixAndParams,
  LossChart,
  ActivationVectors,
  GradientMatrix,
};
