import { useAgent } from "agents/react";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import type { RubiksCubeState } from "./server";
import { initialSolvedState } from "./rubiksCube";
import "./styles.css";

function App() {
  let [state, setState] = useState<RubiksCubeState>({
    moveHistory: [],
    isSolved: false,
    state: initialSolvedState,
  });
  let agent = useAgent<RubiksCubeState>({
    agent: "rubiks-cube-agent",
    prefix: "cube",
    onStateUpdate: (state) => {
      setState(state);
    },
  });

  let applyMove = async (move: string) => {
    await agent.call("applyMoveSequence", [move]);
  };

  let handleReset = async () => {
    await agent.call("reset");
  };

  let handleScramble = async () => {
    await agent.call("scramble", [20]);
  };

  return (
    <>
      <div className="game-container">
        <h1>Rubiks Cube</h1>

        <div className="controls">
          <div className="move-buttons">
            <h3>Basic Moves</h3>
            <div className="move-grid">
              <div className="move-row">
                <button onClick={() => applyMove("R")}>R</button>
                <button onClick={() => applyMove("R'")}>R'</button>
              </div>
              <div className="move-row">
                <button onClick={() => applyMove("L")}>L</button>
                <button onClick={() => applyMove("L'")}>L'</button>
              </div>
              <div className="move-row">
                <button onClick={() => applyMove("U")}>U</button>
                <button onClick={() => applyMove("U'")}>U'</button>
              </div>
              <div className="move-row">
                <button onClick={() => applyMove("D")}>D</button>
                <button onClick={() => applyMove("D'")}>D'</button>
              </div>
              <div className="move-row">
                <button onClick={() => applyMove("F")}>F</button>
                <button onClick={() => applyMove("F'")}>F'</button>
              </div>
              <div className="move-row">
                <button onClick={() => applyMove("B")}>B</button>
                <button onClick={() => applyMove("B'")}>B'</button>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleReset}>Reset</button>
            <button onClick={handleScramble}>Scramble</button>
          </div>
        </div>
      </div>

      <div className="game-container">
        <h3>Current State</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
