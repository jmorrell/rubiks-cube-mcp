import { useAgent } from "agents/react";
import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color as ThreeColor, Euler, Vector3, Group } from "three";
import * as THREE from "three";
import type { RubiksCubeState } from "./server";
import { solved_cube, type Cube, type Color, S } from "./rubiksCube";
import "./styles.css";

// Define color map with explicit type
let colorMap: Record<string, string> = {
  W: "#FFFFFF", // White
  Y: "#FFFF00", // Yellow
  B: "#0000FF", // Blue
  G: "#00FF00", // Green
  R: "#FF0000", // Red
  O: "#FFA500", // Orange
};

// Function to safely get color from the map
function getColor(colorCode: string): string {
  return colorMap[colorCode] ?? "#333"; // Use nullish coalescing for default
}

// A single cubie (small cube that makes up the Rubik's cube)
interface CubieProps {
  position: [number, number, number];
  colors: Record<string, string>;
  size?: number;
}

function Cubie({ position, colors, size = 0.85 }: CubieProps) {
  let [x, y, z] = position;

  // Default color for empty stickers - use a dark gray instead of black
  let defaultColor = "#333";

  return (
    <group position={[x, y, z]}>
      {/* Right/Left face */}
      {x === 1 && (
        <mesh position={[size / 2 + 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.right || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}
      {x === -1 && (
        <mesh position={[-size / 2 - 0.001, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.left || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Up/Down face - increased offset to ensure visibility */}
      {y === 1 && (
        <mesh position={[0, size / 2 + 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.up || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}
      {y === -1 && (
        <mesh position={[0, -size / 2 - 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.down || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Front/Back face */}
      {z === 1 && (
        <mesh position={[0, 0, size / 2 + 0.001]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.front || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}
      {z === -1 && (
        <mesh position={[0, 0, -size / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[size * 0.95, size * 0.95]} />
          <meshPhongMaterial color={colors.back || defaultColor} shininess={50} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Black cube base with rounded edges */}
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshPhongMaterial color="#111" shininess={5} />
      </mesh>
    </group>
  );
}

// The complete Rubik's cube
function RubiksCube3D({ state }: { state: Cube }) {
  let positions: [number, number, number][] = [];
  let groupRef = useRef<THREE.Group>(null);

  // Add a subtle animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Very subtle floating animation
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  // Generate all 27 cubie positions
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip the internal cube (not visible)
        if (x === 0 && y === 0 && z === 0) continue;
        positions.push([x, y, z] as [number, number, number]);
      }
    }
  }

  return (
    <group
      ref={groupRef}
      // Standard orientation: white on bottom, yellow on top, blue facing user
      rotation={[Math.PI / 8, Math.PI / 8, 0]}
    >
      {positions.map((position, index) => {
        let [x, y, z] = position;
        let colors: Record<string, string> = {};

        // Top face (yellow) - U
        if (y === 1) {
          let row = 1 + z;
          let col = 1 + x;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.up = getColor(state[S("U", row * 3 + col + 1)]);
          }
        }

        // Bottom face (white) - D
        if (y === -1) {
          let row = 1 - z;
          let col = 1 + x;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.down = getColor(state[S("D", row * 3 + col + 1)]);
          }
        }

        // Front face (blue) - F
        if (z === 1) {
          let row = 1 - y;
          let col = 1 + x;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.front = getColor(state[S("F", row * 3 + col + 1)]);
          }
        }

        // Back face (green) - B
        if (z === -1) {
          let row = 1 - y;
          let col = 1 - x;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.back = getColor(state[S("B", row * 3 + col + 1)]);
          }
        }

        // Left face (orange) - L
        if (x === -1) {
          let row = 1 - y;
          let col = 1 + z;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.left = getColor(state[S("L", row * 3 + col + 1)]);
          }
        }

        // Right face (red) - R
        if (x === 1) {
          let row = 1 - y;
          let col = 1 - z;
          if (row >= 0 && row < 3 && col >= 0 && col < 3) {
            // Calculate 1-based index for S function
            colors.right = getColor(state[S("R", row * 3 + col + 1)]);
          }
        }

        return <Cubie key={index} position={position} colors={colors} />;
      })}
    </group>
  );
}

// Scene setup with lighting
function Scene({ state }: { state: RubiksCubeState }) {
  return (
    <>
      <color attach="background" args={["#222"]} />
      <ambientLight intensity={2.5} />
      <RubiksCube3D state={state.stateHistory[state.stateHistory.length - 1]} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.7}
      />
    </>
  );
}

function App() {
  // Read the url to get the cube id that we will sync
  let pathname = window.location.pathname;
  let id = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (id === "") {
    id = "default";
  }

  let [state, setState] = useState<RubiksCubeState>({
    moveHistory: [],
    isSolved: true,
    stateHistory: [solved_cube],
  });

  // State to handle ready status
  let [isReady, setIsReady] = useState(false);

  // Set ready state after initial render
  useEffect(() => {
    // Small delay to ensure all layout calculations are done
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  let agent = useAgent<RubiksCubeState>({
    agent: "rubiks-cube-agent",
    prefix: "cube",
    name: id,
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
    await agent.call("scramble", [2]);
  };

  return (
    <div className="app-container">
      <div className="game-container">
        <h1>Rubik's Cube</h1>

        <div className="cube-and-moves">
          <div className="cube-view">
            <div className="canvas-container" style={{ width: "100%", height: "100%" }}>
              {isReady && (
                <Canvas
                  camera={{
                    position: [5, 3, 7],
                    fov: 35,
                    near: 0.1,
                    far: 1000,
                  }}
                  shadows
                  gl={{
                    antialias: true,
                    alpha: false,
                    logarithmicDepthBuffer: true,
                    precision: "highp",
                  }}
                  dpr={[1, 2]}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Scene state={state} />
                </Canvas>
              )}
              {!isReady && <div className="canvas-loading" />}
            </div>
          </div>

          <div className="moves-history">
            <h3>Move History</h3>
            {state.moveHistory.length > 0 ? (
              <div className="moves-list">
                {state.moveHistory.map((move, index) => (
                  <div className="move-item" key={index}>
                    {index + 1}. {move}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-moves">No moves yet</div>
            )}
          </div>
        </div>

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
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
