import React, { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";

const GradientMatrix = ({ params, gradients, setTooltip }) => {
  const gradientRef = useRef();

  const updateGradientMatrix = useCallback(() => {
    const svg = d3.select(gradientRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const layers = [params.m, params.k, params.n];
    const maxNodes = Math.max(...layers);
    const cellSize = Math.min(
      width / (2 * maxNodes),
      height / (layers.length - 1) / 2
    );

    const colorScale = d3
      .scaleLinear()
      .domain([-0.1, 0, 0.1])
      .range(["#ff4136", "#ffffff", "#0074d9"]);

    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayerNodes = layers[layerIndex];
      const nextLayerNodes = layers[layerIndex + 1];

      const startX =
        (width / 1.5 - cellSize * nextLayerNodes) / 2 +
        (layerIndex * width) / 2;
      const startY = (height - cellSize * currentLayerNodes) / 2;

      const layerGradients =
        layerIndex === 0 ? gradients.inputHidden : gradients.hiddenOutput;

      svg
        .append("text")
        .attr("x", startX + (cellSize * nextLayerNodes) / 2)
        .attr("y", startY - 30)
        .attr("text-anchor", "middle")
        .style("font-size", "17px")
        .style("font-weight", "normal")
        .style("fill", "#212529")
        .text(
          layerIndex === 0
            ? "Input-Hidden Gradients"
            : "Hidden-Output Gradients"
        );

      for (let i = 0; i < currentLayerNodes; i++) {
        for (let j = 0; j < nextLayerNodes; j++) {
          const gradient = layerGradients[i * nextLayerNodes + j] || 0;

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
            .attr("fill", colorScale(gradient))
            .attr("stroke", "#212529");

          cell
            .on("mouseover", (event) => {
              setTooltip({
                show: true,
                text: `Gradient[${i},${j}]: ${gradient.toFixed(6)}`,
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
  }, [params, gradients, setTooltip]);

  useEffect(() => {
    updateGradientMatrix();
  }, [updateGradientMatrix]);

  return (
    <div className="gradient-container">
      <h3>Gradient Matrices</h3>
      <svg ref={gradientRef}></svg>
    </div>
  );
};

export default GradientMatrix;
