import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as tf from "@tensorflow/tfjs";
import * as d3 from "d3";

// Constants
const LOSS_COLOR = "rgb(110, 122, 234)";
const TEXT_COLOR = "#212529";
const LAYER_COLORS = {
  input: "#ff7f0e",
  hidden: "#2ca02c",
  output: "#d62728",
};

// Utility functions
const createLabels = (count, prefix) => {
  if (count <= 10) return [...Array(count)].map((_, i) => `${prefix}${i + 1}`);
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

const MlpViz = () => {
  // State declarations
  const [params, setParams] = useState({
    m: 4,
    k: 8,
    n: 2,
    lr: 0.001,
    steps: 500,
  });
  const [trainingData, setTrainingData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [weights, setWeights] = useState({ inputHidden: [], hiddenOutput: [] });

  const [activations, setActivations] = useState({
    input: [],
    hiddenPre: [],
    hiddenPost: [],
    output: [],
  });

  const [gradients, setGradients] = useState({
    inputHidden: [],
    hiddenOutput: [],
  });
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });

  // Refs

  const svgRef = useRef();
  const matrixRef = useRef();
  const activationRef = useRef();
  const gradientRef = useRef();
  const [display, setDisplay] = useState("none");

  useEffect(() => {
    if (isTraining) {
      setDisplay("block");
    }
  }, [isTraining]);

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
      .attr("stroke", LOSS_COLOR)
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [trainingData]);

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
        .style("fill", TEXT_COLOR)
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
            .attr("stroke", TEXT_COLOR);

          cell
            .on("mouseover", (event, d) => {
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

  const updateActivationVectors = useCallback(() => {
    const svg = d3.select(activationRef.current);
    svg.selectAll("*").remove();

    const width = 800; // Increased width to accommodate more layers
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
        .style("fill", TEXT_COLOR)
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
          .attr("stroke", TEXT_COLOR);

        cell
          .on("mouseover", (event, d) => {
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
        .style("fill", TEXT_COLOR)
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
            .attr("stroke", TEXT_COLOR);

          cell
            .on("mouseover", (event, d) => {
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
    if (trainingData.length > 0) {
      updateLossChart();
    }
    updateWeightMatrix();
    updateActivationVectors();
    updateGradientMatrix();
  }, [
    trainingData,
    params,
    weights,
    activations,
    gradients,
    updateLossChart,
    updateWeightMatrix,
    updateActivationVectors,
    updateGradientMatrix,
  ]);

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingData([]);

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: params.k,
        activation: "relu",
        inputShape: [params.m],
      })
    );
    model.add(tf.layers.dense({ units: params.n }));
    model.compile({
      optimizer: tf.train.sgd(params.lr),
      loss: "meanSquaredError",
    });

    const xs = tf.randomNormal([1, params.m]);
    const ys = tf.randomNormal([1, params.n]);

    for (let i = 0; i < params.steps; i++) {
      const history = await model.fit(xs, ys, { epochs: 1 });
      const loss = history.history.loss[0];
      setTrainingData((prevData) => [...prevData, { step: i, loss }]);

      if (i % 10 === 0) {
        updateModelState(model, xs, ys);
        await tf.nextFrame();
      }
    }

    setIsTraining(false);
    tf.dispose([xs, ys, model]);
  };

  const updateModelState = (model, xs, ys) => {
    // Update weights
    const inputHiddenWeights = model.layers[0].getWeights()[0].arraySync();
    const hiddenOutputWeights = model.layers[1].getWeights()[0].arraySync();
    setWeights({
      inputHidden: inputHiddenWeights.flat(),
      hiddenOutput: hiddenOutputWeights.flat(),
    });

    // Update activations
    const inputActivations = xs.arraySync()[0];
    const hiddenPreActivations = tf
      .matMul(xs, model.layers[0].getWeights()[0])
      .arraySync()[0];
    const hiddenPostActivations = model.layers[0].apply(xs).arraySync()[0];
    const outputActivations = model.predict(xs).arraySync()[0];
    setActivations({
      input: inputActivations,
      hiddenPre: hiddenPreActivations,
      hiddenPost: hiddenPostActivations,
      output: outputActivations,
    });

    // Update gradients
    const f = () => model.apply(xs).squaredDifference(ys).mean();
    const { grads } = tf.variableGrads(f);
    const inputHiddenGradients =
      grads[model.layers[0].getWeights()[0].name].arraySync();
    const hiddenOutputGradients =
      grads[model.layers[1].getWeights()[0].name].arraySync();
    setGradients({
      inputHidden: inputHiddenGradients.flat(),
      hiddenOutput: hiddenOutputGradients.flat(),
    });

    // Dispose gradient tensors
    Object.values(grads).forEach((g) => g.dispose());
  };

  const updateParam = (param, value) => {
    setParams((prevParams) => ({ ...prevParams, [param]: value }));
  };

  return (
    <div className="container">
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
      <div className="training-container">
        <h3>Training Loss</h3>
        <div className="training-b">
          <button
            onClick={startTraining}
            disabled={isTraining}
            className="start-button"
          >
            {isTraining ? "Training..." : "Start Training?"}
          </button>
        </div>
        <div className="training-c">
          <svg ref={svgRef} style={{ display }}></svg>
        </div>
      </div>
      <div className="box-container">
        <div className="activation-container">
          <h3>Activation Vectors</h3>
          <svg ref={activationRef}></svg>
        </div>

        <div className="gradient-container">
          <h3>Gradient Matrices</h3>
          <br></br>
          <svg ref={gradientRef}></svg>
        </div>

        <div
          className="tooltip"
          style={{
            opacity: tooltip.show ? 1 : 0,
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {tooltip.text}
        </div>
      </div>
    </div>
  );
};

export default MlpViz;
