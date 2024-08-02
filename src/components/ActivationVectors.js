import React, { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";

const ActivationVectors = ({ params, activations, setTooltip }) => {
  const activationRef = useRef();

  const updateActivationVectors = useCallback(() => {
    const svg = d3.select(activationRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 200;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const layers = [params.m, params.k, params.k, params.n];
    const maxNodes = Math.max(...layers);
    const cellSize = Math.min(width / (4 * maxNodes), height / 2);

    const colorScale = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range(["#ff4136", "#ffffff", "#0074d9"]);

    const layerNames = [
      "Input",
      "Hidden (Pre-ReLU)",
      "Hidden (Post-ReLU)",
      "Output",
    ];
    const layerActivations = [
      activations.input,
      activations.hiddenPre,
      activations.hiddenPost,
      activations.output,
    ];

    layers.forEach((layerSize, layerIndex) => {
      const startX =
        (width / 4) * layerIndex + (width / 8 - (cellSize * layerSize) / 2);
      const startY = (height - cellSize) / 2;

      svg
        .append("text")
        .attr("x", startX + (cellSize * layerSize) / 2)
        .attr("y", startY - 30)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "normal")
        .style("fill", "#212529")
        .text(`${layerNames[layerIndex]}`);

      for (let i = 0; i < layerSize; i++) {
        const activation = layerActivations[layerIndex][i] || 0;

        const cell = svg
          .append("g")
          .attr("transform", `translate(${startX + i * cellSize}, ${startY})`);

        cell
          .append("rect")
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", colorScale(activation))
          .attr("stroke", "#212529");

        cell
          .on("mouseover", (event) => {
            setTooltip({
              show: true,
              text: `${layerNames[layerIndex]}[${i}]: ${activation.toFixed(4)}`,
              x: event.pageX,
              y: event.pageY,
            });
          })
          .on("mouseout", () => {
            setTooltip({ show: false, text: "", x: 0, y: 0 });
          });
      }
    });
  }, [params, activations, setTooltip]);

  useEffect(() => {
    updateActivationVectors();
  }, [updateActivationVectors]);

  return (
    <div className="activation-container">
      <h3>Activation Vectors</h3>
      <svg ref={activationRef}></svg>
    </div>
  );
};

export default ActivationVectors;
