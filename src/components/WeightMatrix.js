import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";

const WeightMatrixAndParams = ({ params, setParams, weights, setTooltip }) => {
  const matrixRef = useRef();

  const paramOptions = useMemo(
    () => ({
      m: [1, 2, 4, 8],
      k: [2, 4, 8, 16],
      n: [1, 2, 4, 8],
      lr: [0.1, 0.01, 0.001, 0.0001],
      steps: [100, 500, 1000, 2000],
    }),
    []
  );

  const updateWeightMatrix = useCallback(() => {
    const svg = d3.select(matrixRef.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 500;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const layers = [params.m, params.k, params.n];
    const maxNodes = Math.max(...layers);
    const cellSize = Math.min(
      width / (2.5 * maxNodes),
      height / (layers.length - 1) / 2
    );

    const colorScale = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range(["#ff4136", "#ffffff", "#0074d9"]);

    const createLabels = (count, prefix) => {
      if (count <= 10)
        return [...Array(count)].map((_, i) => `${prefix}${i + 1}`);
      return [
        `${prefix}1`,
        `${prefix}2`,
        `${prefix}3`,
        "...",
        `${prefix}${count - 2}`,
        `${prefix}${count - 1}`,
        `${prefix}${count}`,
      ];
    };

    const LAYER_COLORS = {
      input: "#ff7f0e",
      hidden: "#2ca02c",
      output: "#d62728",
    };

    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayerNodes = layers[layerIndex];
      const nextLayerNodes = layers[layerIndex + 1];

      const startX =
        layerIndex === 0
          ? width / 3 - (cellSize * nextLayerNodes) / 2
          : (3 * width) / 3.75 - (cellSize * nextLayerNodes) / 2;
      const startY = (height - cellSize * currentLayerNodes) / 2;

      const layerWeights =
        layerIndex === 0 ? weights.inputHidden : weights.hiddenOutput;

      svg
        .append("text")
        .attr("x", startX + (cellSize * nextLayerNodes) / 2)
        .attr("y", startY - 50)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "normal")
        .style("fill", "#212529")
        .text(
          layerIndex === 0 ? "Input-Hidden Weights" : "Hidden-Output Weights"
        );

      const rowLabels = createLabels(
        currentLayerNodes,
        layerIndex === 0 ? "I" : "H"
      );
      rowLabels.forEach((label, i) => {
        const y =
          startY +
          (i / (rowLabels.length - 1)) * (currentLayerNodes - 1) * cellSize +
          cellSize / 2;
        svg
          .append("text")
          .attr("x", startX - 25)
          .attr("y", y)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .style("font-size", "12px")
          .style(
            "fill",
            layerIndex === 0 ? LAYER_COLORS.input : LAYER_COLORS.hidden
          )
          .text(label);
      });

      const colLabels = createLabels(
        nextLayerNodes,
        layerIndex === 0 ? "H" : "O"
      );
      colLabels.forEach((label, i) => {
        const x =
          startX +
          (i / (colLabels.length - 1)) * (nextLayerNodes - 1) * cellSize +
          cellSize / 2;
        svg
          .append("text")
          .attr("x", x)
          .attr("y", startY - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style(
            "fill",
            layerIndex === 0 ? LAYER_COLORS.hidden : LAYER_COLORS.output
          )
          .text(label);
      });

      for (let i = 0; i < currentLayerNodes; i++) {
        for (let j = 0; j < nextLayerNodes; j++) {
          const weight = layerWeights[i * nextLayerNodes + j] || 0;

          const cell = svg
            .append("g")
            .attr(
              "transform",
              `translate(${startX + j * cellSize}, ${startY + i * cellSize})`
            );

          cell
            .append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("fill", colorScale(weight))
            .attr("stroke", "#212529");

          cell
            .on("mouseover", (event) => {
              setTooltip({
                show: true,
                text: `Weight[${i + 1},${j + 1}]: ${weight.toFixed(4)}`,
                x: event.pageX,
                y: event.pageY,
              });
            })
            .on("mouseout", () => {
              setTooltip({ show: false, text: "", x: 0, y: 0 });
            });
        }
      }
    }

    svg
      .append("text")
      .attr("x", width / 1.8)
      .attr("y", height - 50)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#212529aa")
      .text(
        "Color intensity represents weight value: Blue (positive), White (near zero), Red (negative)"
      );
  }, [params, weights, setTooltip]);

  useEffect(() => {
    updateWeightMatrix();
  }, [params, weights, updateWeightMatrix]);

  const updateParam = (param, value) => {
    setParams((prevParams) => ({ ...prevParams, [param]: value }));
  };

  return (
    <div className="flex-container">
      <div className="matrix-container">
        <div className="input-matrix">
          <h3>Weight Matrix Visualization</h3>
          <svg ref={matrixRef}></svg>
        </div>
      </div>
      <div className="params-container">
        <h3>Parameters</h3>
        <div className="param-items">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="param-item">
              <label className="param-label">
                {key}: {value}
              </label>
              <select
                value={value}
                onChange={(e) =>
                  updateParam(
                    key,
                    key === "lr"
                      ? parseFloat(e.target.value)
                      : parseInt(e.target.value)
                  )
                }
                className="param-select"
              >
                {paramOptions[key].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeightMatrixAndParams;
