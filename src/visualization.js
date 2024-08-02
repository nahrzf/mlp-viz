import React, { useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import WeightMatrixAndParams from "./components/WeightMatrix";
import LossChart from "./components/LossChart";
import ActivationVectors from "./components/ActivationVectors";
import GradientMatrix from "./components/GradientMatrix";

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

  const updateModelState = useCallback((model, xs, ys) => {
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
  }, []);

  return (
    <div className="container">
      <WeightMatrixAndParams
        params={params}
        setParams={setParams}
        weights={weights}
        setTooltip={setTooltip}
      />
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
        <LossChart trainingData={trainingData} isTraining={isTraining} />
      </div>
      <div className="box-container">
        <ActivationVectors
          params={params}
          activations={activations}
          setTooltip={setTooltip}
        />
        <GradientMatrix
          params={params}
          gradients={gradients}
          setTooltip={setTooltip}
        />
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
