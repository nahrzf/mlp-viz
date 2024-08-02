import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";

const LossChart = ({ trainingData, isTraining }) => {
  const svgRef = useRef();

  const updateLossChart = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(trainingData, (d) => d.step)])
      .range([0, chartWidth]);

    const y = d3
      .scaleLog()
      .domain([
        d3.min(trainingData, (d) => d.loss),
        d3.max(trainingData, (d) => d.loss),
      ])
      .range([chartHeight, 0]);

    const line = d3
      .line()
      .x((d) => x(d.step))
      .y((d) => y(d.loss));

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .append("text")
      .attr("fill", "#000")
      .attr("y", 25)
      .attr("x", chartWidth / 2)
      .attr("text-anchor", "middle")
      .text("Training Steps");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .text("Loss (log scale)");

    g.append("path")
      .datum(trainingData)
      .attr("fill", "none")
      .attr("stroke", "rgb(110, 122, 234)")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [trainingData]);

  useEffect(() => {
    if (trainingData.length > 0) {
      updateLossChart();
    }
  }, [trainingData, updateLossChart]);

  const [display, setDisplay] = useState("none");

  useEffect(() => {
    if (isTraining) {
      setDisplay("block");
    }
  }, [isTraining]);

  return (
    <div className="training-c">
      <svg ref={svgRef} style={{ display }}></svg>
    </div>
  );
};

export default LossChart;
