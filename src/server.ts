import { Agent, routeAgentRequest, unstable_callable as callable, type AgentNamespace } from "agents";
import { initialSolvedState, RubiksCube } from "./rubiksCube";
import type { CubeState } from "./rubiksCube";

type Env = {
  RubiksCube: AgentNamespace<RubiksCubeAgent>;
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
  previewResult(sequence: string) {
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

export default {
  async fetch(request: Request, env: Env) {
    if (request.url.includes("/cube")) {
      return (await routeAgentRequest(request, env, { prefix: "cube" })) || new Response("Not found", { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
