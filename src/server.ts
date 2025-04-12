import { Agent, routeAgentRequest, getAgentByName, unstable_callable as callable, type AgentNamespace } from "agents";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { initialSolvedState, RubiksCube } from "./rubiksCube";
import type { CubeState } from "./rubiksCube";
import dedent from "dedent";

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
  state: CubeState;
};

export type RubiksCubeResponse = {
  moveHistory: string[];
  isSolved: boolean;
  state: CubeState;
};

export class RubiksCubeAgent extends Agent<Env, RubiksCubeState> {
  initialState: RubiksCubeState = {
    moveHistory: [],
    isSolved: true,
    state: initialSolvedState,
  };

  #getCurrentCube(): RubiksCube {
    return new RubiksCube(this.state.moveHistory.join(" "));
  }

  @callable()
  applyMoveSequence(sequence: string) {
    let cube = this.#getCurrentCube();
    cube.applyMoveSequence(sequence);

    this.setState({
      moveHistory: [...cube.getMoveHistory()],
      isSolved: cube.isSolved(),
      state: cube.getCurrentState(),
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
      state: cube.getCurrentState(),
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
      state: initialSolvedState,
    });
    return this.state;
  }

  @callable()
  async scramble(numMoves: number = 25) {
    let cube = new RubiksCube();
    cube.scramble(numMoves);
    this.setState({
      moveHistory: [],
      isSolved: cube.isSolved(),
      state: cube.getCurrentState(),
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

  static renderCubeState(state: CubeState) {
    return ["U", "F", "R", "B", "L", "D"]
      .map((side) => {
        return `${side}: ${state[side as keyof CubeState].map((row) => row.reverse().join(" ")).join(" ")}`;
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
        ${RubiksCubeMCP.renderCubeState(state.state)}

        You can view the cube at the following URLs. Be sure to show these to the user:
        Interactive 3D view: http://localhost:5173/${cubeId}
        SVG image view: http://localhost:5173/svg/${cubeId}
      `;

      return {
        content: [{ type: "text", text: output }],
      };
    });

    this.server.tool("getCubeState", "Get the current state of the cube", {}, async () => {
      let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
      let state = await cubeAgent.getCubeState();
      return {
        content: [{ type: "text", text: String(RubiksCubeMCP.renderCubeState(state.state)) }],
      };
    });

    // if passing the ID like this doesn't work, then we can store the cube id in the session state
    this.server.tool(
      "applyMoveSequence",
      "Apply a sequence of moves to the cube",
      { moves: z.string() },
      async ({ moves }) => {
        let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
        let state = await cubeAgent.applyMoveSequence(moves);
        return {
          content: [{ type: "text", text: String(RubiksCubeMCP.renderCubeState(state.state)) }],
        };
      }
    );

    this.server.tool(
      "previewMoveSequence",
      "Preview the result of a sequence of moves without modifying the current cube state",
      { moves: z.string() },
      async ({ moves }) => {
        let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
        let state = await cubeAgent.previewMoveSequence(moves);
        return {
          content: [{ type: "text", text: String(RubiksCubeMCP.renderCubeState(state.state)) }],
        };
      }
    );

    this.server.tool("isSolved", "Check if the cube is solved", {}, async () => {
      let cubeAgent = await getAgentByName(self.env.RubiksCubeAgent, self.state.cubeId);
      let state = await cubeAgent.getCubeState();
      return {
        content: [{ type: "text", text: String(state.isSolved) }],
      };
    });
  }
}

// Render a cube as an SVG in isometric perspective
async function renderCubeAsSvg(cubeId: string, env: Env): Promise<Response> {
  try {
    // Get the cube agent with that ID
    const cubeAgent = await getAgentByName(env.RubiksCubeAgent, cubeId);
    const state = await cubeAgent.getCubeState();

    // Define colors for the faces - matching with the client's colorMap
    const colorMap: Record<string, string> = {
      W: "#FFFFFF", // White
      Y: "#FFFF00", // Yellow
      B: "#0000FF", // Blue
      G: "#00FF00", // Green
      R: "#FF0000", // Red
      O: "#FFA500", // Orange
    };

    // SVG will use filters instead of explicit shadows

    // SVG dimensions
    const width = 300;
    const height = 300;

    // Isometric projection constants
    const cubeSize = 120;
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate coordinates for isometric projection
    // 30 degree isometric angles
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    // Start building SVG content with filters for lighting effects
    let svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="top-lighting">
            <feColorMatrix type="matrix" values="1 0 0 0 0.1
                                                 0 1 0 0 0.1
                                                 0 0 1 0 0.1
                                                 0 0 0 1 0" />
          </filter>
          <filter id="front-lighting">
            <feColorMatrix type="matrix" values="1 0 0 0 -0.05
                                                 0 1 0 0 -0.05
                                                 0 0 1 0 -0.05
                                                 0 0 0 1 0" />
          </filter>
          <filter id="right-lighting">
            <feColorMatrix type="matrix" values="1 0 0 0 -0.1
                                                 0 1 0 0 -0.1
                                                 0 0 1 0 -0.1
                                                 0 0 0 1 0" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="#222" />
    `;

    // Helper function to project 3D point to 2D
    function project(x: number, y: number, z: number): [number, number] {
      // Isometric projection
      const projX = centerX + (x - z) * cos30 * cubeSize;
      const projY = centerY + ((x + z) * sin30 - y) * cubeSize;
      return [projX, projY];
    }

    // Draw the top face (U)
    svgContent += `<g id="top-face">`;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Convert row/col to 3D coordinates (x, y, z)
        const x = (col - 1) / 3;
        const y = 0.5;
        const z = (1 - row) / 3;

        // Calculate four corners of the sticker in isometric projection
        const p1 = project(x - 1 / 6, y, z - 1 / 6);
        const p2 = project(x + 1 / 6, y, z - 1 / 6);
        const p3 = project(x + 1 / 6, y, z + 1 / 6);
        const p4 = project(x - 1 / 6, y, z + 1 / 6);

        // Create a polygon for the sticker
        svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state.state.U[row][col]]}" 
            stroke="black" 
            stroke-width="3"
            style="filter:url(#top-lighting)"
          />
        `;
      }
    }
    svgContent += `</g>`;

    // Draw the front face (F)
    svgContent += `<g id="front-face">`;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Convert row/col to 3D coordinates (x, y, z)
        const x = (col - 1) / 3;
        const y = (1 - row) / 3;
        const z = 0.5;

        // Calculate four corners of the sticker in isometric projection
        const p1 = project(x - 1 / 6, y - 1 / 6, z);
        const p2 = project(x + 1 / 6, y - 1 / 6, z);
        const p3 = project(x + 1 / 6, y + 1 / 6, z);
        const p4 = project(x - 1 / 6, y + 1 / 6, z);

        // Create a polygon for the sticker
        svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state.state.F[row][col]]}" 
            stroke="black" 
            stroke-width="3"
            style="filter:url(#front-lighting)"
          />
        `;
      }
    }
    svgContent += `</g>`;

    // Draw the right face (R)
    svgContent += `<g id="right-face">`;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Convert row/col to 3D coordinates (x, y, z)
        const x = 0.5;
        const y = (1 - row) / 3;
        const z = (col - 1) / 3;

        // Calculate four corners of the sticker in isometric projection
        const p1 = project(x, y - 1 / 6, z - 1 / 6);
        const p2 = project(x, y - 1 / 6, z + 1 / 6);
        const p3 = project(x, y + 1 / 6, z + 1 / 6);
        const p4 = project(x, y + 1 / 6, z - 1 / 6);

        // Create a polygon for the sticker
        svgContent += `
          <polygon 
            points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" 
            fill="${colorMap[state.state.R[row][col]]}" 
            stroke="black" 
            stroke-width="3"
            style="filter:url(#right-lighting)"
          />
        `;
      }
    }
    svgContent += `</g>`;

    // Close the SVG
    svgContent += `</svg>`;

    // Return the SVG as a response
    return new Response(svgContent, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "max-age=60",
      },
    });
  } catch (error) {
    console.error("Error rendering SVG:", error);
    return new Response("Error rendering cube", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route for SVG rendering
    if (path.startsWith("/svg/")) {
      const cubeId = path.slice(path.lastIndexOf("/") + 1);
      if (cubeId) {
        return renderCubeAsSvg(cubeId, env);
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
