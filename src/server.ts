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

        You can view the cube at the following URL. Be sure to show this to the user:
        http://localhost:5173/${cubeId}
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;

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
