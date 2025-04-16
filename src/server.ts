import { Agent, routeAgentRequest, getAgentByName, unstable_callable as callable, type AgentNamespace } from "agents";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RubiksCube, S, solved_cube } from "./rubiksCube";
import type { Cube, Face } from "./rubiksCube";
import dedent from "dedent";
import { initialize, svg2png, type ConvertOptions } from "svg2png-wasm";
import wasm from "svg2png-wasm/svg2png_wasm_bg.wasm";

type Env = {
  RubiksCubeAgent: AgentNamespace<RubiksCubeAgent>;
  RubiksCubeMCP: DurableObjectNamespace<RubiksCubeMCP>;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

export type RubiksCubeState = {
  moveHistory: string[];
  isSolved: boolean;
  stateHistory: Cube[];
};

export type RubiksCubeResponse = {
  moveHistory: string[];
  isSolved: boolean;
  stateHistory: Cube[];
};

export class RubiksCubeAgent extends Agent<Env, RubiksCubeState> {
  initialState: RubiksCubeState = {
    moveHistory: [],
    isSolved: true,
    stateHistory: [solved_cube],
  };

  #getCurrentCube(): RubiksCube {
    return new RubiksCube(this.state.moveHistory.join(" "), this.state.stateHistory[0]);
  }

  @callable()
  applyMoveSequence(sequence: string) {
    let cube = this.#getCurrentCube();
    cube.applyMoveSequence(sequence);

    this.setState({
      moveHistory: [...cube.getMoveHistory()],
      isSolved: cube.isSolved(),
      stateHistory: [...this.state.stateHistory, cube.getCurrentState()],
    });

    return this.state;
  }

  @callable()
  previewMoveSequence(sequence: string) {
    let cube = this.#getCurrentCube();
    cube.applyMoveSequence(sequence);

    return {
      moveHistory: [...cube.getMoveHistory()],
      isSolved: cube.isSolved(),
      stateHistory: [...this.state.stateHistory, cube.getCurrentState()],
    };
  }

  @callable()
  getCubeState() {
    return this.state;
  }

  @callable()
  async reset() {
    this.setState({
      moveHistory: [],
      isSolved: true,
      stateHistory: [solved_cube],
    });
    return this.state;
  }

  @callable()
  async scramble(numMoves: number = 2) {
    let cube = new RubiksCube();
    cube.scramble(numMoves);
    this.setState({
      moveHistory: [],
      isSolved: cube.isSolved(),
      stateHistory: [cube.getCurrentState()],
    });
    return this.state;
  }
}

export type RubiksCubeMCPState = {
  cubeId: string;
};

export class RubiksCubeMCP extends McpAgent<Env, RubiksCubeMCPState> {
  server = new McpServer({
    name: "RubiksCube",
    version: "1.0.0",
    capabilities: {
      tools: {},
    },
  });

  static renderCubeState(cube: Cube) {
    return (["U", "R", "F", "D", "L", "B"] as Face[])
      .map((face) => {
        return (
          `${face}: ` +
          cube[S(face, 1)] +
          " " +
          cube[S(face, 2)] +
          " " +
          cube[S(face, 3)] +
          " " +
          cube[S(face, 4)] +
          " " +
          cube[S(face, 5)] +
          " " +
          cube[S(face, 6)] +
          " " +
          cube[S(face, 7)] +
          " " +
          cube[S(face, 8)] +
          " " +
          cube[S(face, 9)]
        );
      })
      .join("\n");
  }

  async init() {
    const self = this;

    this.server.tool("getScrambledCube", "Get a scrambled cube", {}, async () => {
      const cubeId = self.state?.cubeId ?? crypto.randomUUID();
      if (!self.state?.cubeId) {
        self.setState({ cubeId });
      }

      // get the cube agent with that name
      const cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, cubeId);
      const state = await cubeAgent.scramble(1);

      const output = dedent`
        Here is the cube state:
        ${RubiksCubeMCP.renderCubeState(state.stateHistory[state.stateHistory.length - 1])}

        You can view the cube at the following URLs. Be sure to show these to the user:
        Interactive 3D view: http://localhost:5173/${cubeId}
      `;

      return {
        content: [{ type: "text", text: output }],
      };
    });

    this.server.tool("getCubeState", "Get the current state of the cube", {}, async () => {
      let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
      let state = await cubeAgent.getCubeState();

      return {
        content: [
          {
            type: "text",
            text: dedent`
              Here is the cube state:
              ${RubiksCubeMCP.renderCubeState(state.stateHistory[state.stateHistory.length - 1])}
              
              The cube is ${state.isSolved ? "solved" : "not solved"}
            `,
          },
        ],
      };
    });

    // if passing the ID like this doesn't work, then we can store the cube id in the session state
    this.server.tool(
      "applyMoveSequence",
      dedent`
        Apply a sequence of moves to the cube
        The moves are a space-separated list of moves.
        The moves are case-sensitive and must be one of the following:
        U, R, F, D, L, B, U', R', F', D', L', B'

        Example input: "U R U' R'"
      `,
      { moves: z.string() },
      async ({ moves }) => {
        let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
        let state = await cubeAgent.applyMoveSequence(moves);

        return {
          content: [
            {
              type: "text",
              text: String(RubiksCubeMCP.renderCubeState(state.stateHistory[state.stateHistory.length - 1])),
            },
          ],
        };
      }
    );

    this.server.prompt("rubiks-cube", "The name of the rubiks cube agent", {}, async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: dedent`
                Let's solve a rubiks cube!

                Each face has 9 positions, numbered as follows:

                1 2 3
                4 5 6
                7 8 9

                The mapping assumes the cube is "unrolled" with the Front face (F) towards you:

                           +--+--+--+
                           |U1|U2|U3|
                           +--+--+--+
                           |U4|U5|U6|
                           +--+--+--+
                           |U7|U8|U9|
                +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
                |L1|L2|L3| |F1|F2|F3| |R1|R2|R3| |B1|B2|B3|
                +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
                |L4|L5|L6| |F4|F5|F6| |R4|R5|R6| |B4|B5|B6|
                +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
                |L7|L8|L9| |F7|F8|F9| |R7|R8|R9| |B7|B8|B9|
                +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
                           |D1|D2|D3|
                           +--+--+--+
                           |D4|D5|D6|
                           +--+--+--+
                           |D7|D8|D9|
                           +--+--+--+

              Color Scheme and Orientation

              - U (Up/Top): Yellow (Y)
              - F (Front): Orange (O)
              - R (Right): Blue (B)
              - B (Back): Red (R)
              - L (Left): Green (G)
              - D (Down/Bottom): White (W)

              A solved cube would be represented as:

              U: Y Y Y Y Y Y Y Y Y
              F: O O O O O O O O O
              R: B B B B B B B B B
              B: R R R R R R R R R
              L: G G G G G G G G G
              D: W W W W W W W W W

              F: Front face clockwise
              F': Front face counter-clockwise
              F2: Front face twice (180 degrees)
              B: Back face clockwise
              B': Back face counter-clockwise
              B2: Back face twice
              U: Top face clockwise
              U': Top face counter-clockwise
              U2: Top face twice
              D: Bottom face clockwise
              D': Bottom face counter-clockwise
              D2: Bottom face twice
              L: Left face clockwise
              L': Left face counter-clockwise
              L2: Left face twice
              R: Right face clockwise
              R': Right face counter-clockwise
              R2: Right face twice

              <prompt>
                You are an beginner rubiks cube solver. 
                
                You can request a new scrambled cube by calling the "getScrambledCube" tool. This will return a new cube
                and also a URL to view the cube. Please show this URL to the user so they can follow along.
                
                Rubiks cubes do not respond well to random moves. Take your time, make a plan, and think deeply about
                the moves you are making.

                This scrambled cube will be one move away from the solved state. You need to analyze the cube and make
                sure you are confident that the move you are making is going to solve the cube. If it doesn't work, you
                can make the opposite move to undo it. Ex: if you make an F move, you can undo it with an F' move.

                At each significant step, show the resulting cube state in the face-based notation so I can follow your
                solution process.

                It's not always clear that you are going to be making progress towards your goal. It may be tempting to 
                ask for a new scrambled cube. Do not do that! Instead, try to solve the cube from the current state.
              </prompt>
              `,
            },
          },
        ],
      };
    });
  }
}

// Render a cube as an SVG in isometric perspective
async function renderCubeAsSvg(cubeId: string, env: Env): Promise<string> {
  // Get the cube agent with that ID
  const cubeAgent = await getAgentByName(env.RubiksCubeAgent, cubeId);
  const { stateHistory } = await cubeAgent.getCubeState();
  const state = stateHistory[stateHistory.length - 1];

  // Define colors for the faces - matching with the client's colorMap
  const colorMap: Record<string, string> = {
    W: "#FFFFFF", // White
    Y: "#FFFF00", // Yellow
    B: "#0000FF", // Blue
    G: "#00FF00", // Green
    R: "#FF0000", // Red
    O: "#FFA500", // Orange
  };

  // SVG dimensions
  const singleWidth = 300;
  const height = 300;
  const width = singleWidth * 2; // Double width for two views

  // Isometric projection constants
  const cubeSize = 120;
  const centerX1 = singleWidth / 2;
  const centerY1 = height / 2;
  const centerX2 = singleWidth + singleWidth / 2;
  const centerY2 = height / 2;

  // Calculate coordinates for isometric projection
  // 30 degree isometric angles
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // Start building SVG content with filters for lighting effects
  let svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#222" />
    `;

  // Helper function to project 3D point to 2D
  function project(x: number, y: number, z: number, cx: number, cy: number): [number, number] {
    // Isometric projection
    const projX = cx + (x - z) * cos30 * cubeSize;
    const projY = cy + ((x + z) * sin30 - y) * cubeSize; // Revert Y projection
    return [projX, projY];
  }

  // === Draw First Cube (U, F, R) ===
  svgContent += `<g id="cube1">`;

  // Draw the top face (U)
  svgContent += `<g id="top-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Convert row/col to 3D coordinates (x, y, z)
      const x = (col - 1) / 3;
      const y = 0.5;
      const z = (row - 1) / 3;

      // Calculate four corners of the sticker in isometric projection
      const p1 = project(x - 1 / 6, y, z - 1 / 6, centerX1, centerY1);
      const p2 = project(x + 1 / 6, y, z - 1 / 6, centerX1, centerY1);
      const p3 = project(x + 1 / 6, y, z + 1 / 6, centerX1, centerY1);
      const p4 = project(x - 1 / 6, y, z + 1 / 6, centerX1, centerY1);

      // Create a polygon for the sticker
      svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state[S("U", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Top face
  const topCenter = project(0, 0.5, 0, centerX1, centerY1);
  svgContent += `
      <text x="${topCenter[0]}" y="${topCenter[1]}" font-family="sans-serif" font-size="16" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="2" paint-order="stroke fill">U</text>
    `;

  // Draw the front face (F)
  svgContent += `<g id="front-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Convert row/col to 3D coordinates (x, y, z)
      const x = (col - 1) / 3;
      const y = (1 - row) / 3;
      const z = 0.5;

      // Calculate four corners of the sticker in isometric projection
      const p1_f = project(x - 1 / 6, y - 1 / 6, z, centerX1, centerY1);
      const p2_f = project(x + 1 / 6, y - 1 / 6, z, centerX1, centerY1);
      const p3_f = project(x + 1 / 6, y + 1 / 6, z, centerX1, centerY1);
      const p4_f = project(x - 1 / 6, y + 1 / 6, z, centerX1, centerY1);

      // Create a polygon for the sticker
      svgContent += `
          <polygon 
            points="${p1_f[0]},${p1_f[1]} ${p2_f[0]},${p2_f[1]} ${p3_f[0]},${p3_f[1]} ${p4_f[0]},${p4_f[1]}" 
            fill="${colorMap[state[S("F", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Front face
  const frontCenter = project(0, 0, 0.5, centerX1, centerY1);
  svgContent += `
      <text x="${frontCenter[0]}" y="${frontCenter[1]}" font-family="sans-serif" font-size="16" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="2" paint-order="stroke fill">F</text>
    `;

  // Draw the right face (R)
  svgContent += `<g id="right-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Convert row/col to 3D coordinates (x, y, z)
      const x = 0.5;
      const y = (1 - row) / 3;
      const z = (1 - col) / 3;

      // Calculate four corners of the sticker in isometric projection
      const p1_r = project(x, y - 1 / 6, z - 1 / 6, centerX1, centerY1);
      const p2_r = project(x, y - 1 / 6, z + 1 / 6, centerX1, centerY1);
      const p3_r = project(x, y + 1 / 6, z + 1 / 6, centerX1, centerY1);
      const p4_r = project(x, y + 1 / 6, z - 1 / 6, centerX1, centerY1);

      // Create a polygon for the sticker
      svgContent += `
          <polygon 
            points="${p1_r[0]},${p1_r[1]} ${p2_r[0]},${p2_r[1]} ${p3_r[0]},${p3_r[1]} ${p4_r[0]},${p4_r[1]}" 
            fill="${colorMap[state[S("R", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Right face
  const rightCenter = project(0.5, 0, 0, centerX1, centerY1);
  svgContent += `
      <text x="${rightCenter[0]}" y="${rightCenter[1]}" font-family="sans-serif" font-size="16" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="2" paint-order="stroke fill">R</text>
    `;

  svgContent += `</g>`; // Close cube1 group

  // === Draw Second Cube (D, B, L) using U, F, R perspective logic ===
  svgContent += `<g id="cube2">`;

  // Draw the down face (D) - using Top face logic
  svgContent += `<g id="down-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (1 - row) / 3;
      const y = -0.5;
      const z = (col - 1) / 3;

      const p1 = project(x - 1 / 6, y, z - 1 / 6, centerX2, centerY2);
      const p2 = project(x + 1 / 6, y, z - 1 / 6, centerX2, centerY2);
      const p3 = project(x + 1 / 6, y, z + 1 / 6, centerX2, centerY2);
      const p4 = project(x - 1 / 6, y, z + 1 / 6, centerX2, centerY2);

      svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state[S("D", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Down face
  const downCenter = project(0, -0.5, 0, centerX2, centerY2);
  svgContent += `
      <text x="${downCenter[0]}" y="${downCenter[1]}" font-family="sans-serif" font-size="16" fill="black" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="white" stroke-width="0.5" paint-order="stroke fill">D</text>
    `;

  // Draw the left face (L) - using Front face logic
  svgContent += `<g id="left-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) / 3;
      const y = (1 - row) / 3;
      const z = -0.5;

      const p1 = project(x - 1 / 6, y - 1 / 6, z, centerX2, centerY2);
      const p2 = project(x + 1 / 6, y - 1 / 6, z, centerX2, centerY2);
      const p3 = project(x + 1 / 6, y + 1 / 6, z, centerX2, centerY2);
      const p4 = project(x - 1 / 6, y + 1 / 6, z, centerX2, centerY2);

      svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state[S("L", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Back face
  const backCenter = project(0, 0, -0.5, centerX2, centerY2);
  svgContent += `
      <text x="${backCenter[0]}" y="${backCenter[1]}" font-family="sans-serif" font-size="16" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="2" paint-order="stroke fill">L</text>
    `;

  // Draw the back face (B) - using Right face logic
  svgContent += `<g id="back-face">`;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -0.5; // Left face coordinate (position where B is drawn)
      const y = (1 - row) / 3; // Same y mapping as Right face
      const z = (1 - col) / 3; // Reversed z mapping

      const p1 = project(x, y - 1 / 6, z - 1 / 6, centerX2, centerY2);
      const p2 = project(x, y - 1 / 6, z + 1 / 6, centerX2, centerY2);
      const p3 = project(x, y + 1 / 6, z + 1 / 6, centerX2, centerY2);
      const p4 = project(x, y + 1 / 6, z - 1 / 6, centerX2, centerY2);

      svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state[S("B", row * 3 + col + 1)]] ?? "#888"}" 
            stroke="black" 
            stroke-width="3"
          />
        `;
    }
  }
  svgContent += `</g>`;

  // Add label for Left face
  const leftCenter = project(-0.5, 0, 0, centerX2, centerY2);
  svgContent += `
      <text x="${leftCenter[0]}" y="${leftCenter[1]}" font-family="sans-serif" font-size="16" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle" stroke="black" stroke-width="2" paint-order="stroke fill">B</text>
    `;

  svgContent += `</g>`; // Close cube2 group

  // Close the SVG
  svgContent += `</svg>`;

  return svgContent;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route for SVG rendering
    if (path.startsWith("/svg/")) {
      const cubeId = path.slice(path.lastIndexOf("/") + 1);
      if (cubeId) {
        const svg = await renderCubeAsSvg(cubeId, env);
        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "max-age=60",
          },
        });
      }
      return new Response("Invalid cube ID", { status: 400 });
    }

    if (path.startsWith("/png/")) {
      initialize(wasm).catch(() => {});
      const cubeId = path.slice(path.lastIndexOf("/") + 1);
      // We want to render labels, so we need to use a font
      // We have the font file in our assets, so we download it from ourselves
      const roboto = await fetch(`${url.origin}/Roboto-ExtraBold.ttf`).then((res) => res.arrayBuffer());
      if (cubeId) {
        const svg = await renderCubeAsSvg(cubeId, env);
        const buf = await svg2png(svg, {
          width: 800,
          height: 400,
          fonts: [new Uint8Array(roboto)],
          defaultFontFamily: {
            sansSerifFamily: "Roboto",
          },
        });
        return new Response(buf, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "max-age=60",
          },
        });
      }
      return new Response("Invalid cube ID", { status: 400 });
    }

    // Route cube state requests to the Cube Agent
    if (path.startsWith("/cube")) {
      return (await routeAgentRequest(request, env, { prefix: "cube" })) || new Response("Not found", { status: 404 });
    }

    // Route MCP requests to the MCP Agent
    if (path.startsWith("/sse")) {
      const rubiksAgent = RubiksCubeMCP.mount("/sse", { binding: "RubiksCubeMCP" });
      // @ts-ignore
      return rubiksAgent.fetch(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
