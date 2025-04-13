// rubiksCube.ts

export type Color = "W" | "Y" | "B" | "G" | "R" | "O"; // White, Yellow, Blue, Green, Red, Orange
export type Face = "U" | "D" | "F" | "B" | "L" | "R"; // Up, Down, Front, Back, Left, Right

export type Sticker = Color;
export type FaceState = Sticker[]; // array of stickers

// A cube is an array of 9 * 6 = 54 stickers
// The order is [U, R, F, D, L, B]
export type Cube = Sticker[];

function map_face_to_initial_sticker(face: Face): Sticker {
  switch (face) {
    case "U":
      return COLORS.YELLOW;
    case "D":
      return COLORS.WHITE;
    case "F":
      return COLORS.BLUE;
    case "B":
      return COLORS.GREEN;
    case "L":
      return COLORS.ORANGE;
    case "R":
      return COLORS.RED;
  }
}

let solved_cube: Cube = (["U", "R", "F", "D", "L", "B"] as Face[])
  .map((s) => map_face_to_initial_sticker(s).repeat(9))
  .flat() as Cube;

// S(F, 4) will refer to the 4th facelet on the F face (FL), counting from top to bottom, left to right
// The mapping assumes the cube is "unrolled" with the Front face (F) towards you:
//
//                 +--+--+--+
//                 |U1|U2|U3|
//                 +--+--+--+
//                 |U4|U5|U6|
//                 +--+--+--+
//                 |U7|U8|U9|
//      +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
//      |L1|L2|L3| |F1|F2|F3| |R1|R2|R3| |B1|B2|B3|
//      +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
//      |L4|L5|L6| |F4|F5|F6| |R4|R5|R6| |B4|B5|B6|
//      +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
//      |L7|L8|L9| |F7|F8|F9| |R7|R8|R9| |B7|B8|B9|
//      +--+--+--+ |--+--+--| |--+--+--| |--+--+--|
//                 |D1|D2|D3|
//                 +--+--+--+
//                 |D4|D5|D6|
//                 +--+--+--+
//                 |D7|D8|D9|
//                 +--+--+--+
function S(f: Face, i: number): number {
  return "URFDLB".indexOf(f) * 9 + i - 1;
}

function perm_from_cycle(cycle: number[]) {
  let perms = [];
  for (let i = 0; i < cycle.length - 1; i++) {
    perms.push([cycle[i], cycle[i + 1]]);
  }
  perms.push([cycle[cycle.length - 1], cycle[0]]);
  return perms;
}

const u_move = [
  perm_from_cycle([S("U", 1), S("U", 3), S("U", 9), S("U", 7)]),
  perm_from_cycle([S("U", 2), S("U", 6), S("U", 8), S("U", 4)]),
  perm_from_cycle([S("F", 1), S("L", 1), S("B", 1), S("R", 1)]),
  perm_from_cycle([S("F", 2), S("L", 2), S("B", 2), S("R", 2)]),
  perm_from_cycle([S("F", 3), S("L", 3), S("B", 3), S("R", 3)]),
].flat();

const r_move = [
  perm_from_cycle([S("R", 1), S("R", 3), S("R", 9), S("R", 7)]),
  perm_from_cycle([S("R", 2), S("R", 6), S("R", 8), S("R", 4)]),
  perm_from_cycle([S("U", 9), S("B", 1), S("D", 9), S("F", 9)]),
  perm_from_cycle([S("U", 6), S("B", 4), S("D", 6), S("F", 6)]),
  perm_from_cycle([S("U", 3), S("B", 7), S("D", 3), S("F", 3)]),
].flat();

const f_move = [
  perm_from_cycle([S("F", 1), S("F", 3), S("F", 9), S("F", 7)]),
  perm_from_cycle([S("F", 2), S("F", 6), S("F", 8), S("F", 4)]),
  perm_from_cycle([S("U", 7), S("R", 1), S("D", 3), S("L", 9)]),
  perm_from_cycle([S("U", 8), S("R", 4), S("D", 2), S("L", 6)]),
  perm_from_cycle([S("U", 9), S("R", 7), S("D", 1), S("L", 3)]),
].flat();

const b_move = [
  perm_from_cycle([S("B", 1), S("B", 3), S("B", 9), S("B", 7)]),
  perm_from_cycle([S("B", 2), S("B", 6), S("B", 8), S("B", 4)]),
  perm_from_cycle([S("U", 3), S("L", 1), S("D", 7), S("R", 3)]),
  perm_from_cycle([S("U", 2), S("L", 4), S("D", 8), S("R", 6)]),
  perm_from_cycle([S("U", 1), S("L", 7), S("D", 9), S("R", 9)]),
].flat();

const l_move = [
  perm_from_cycle([S("L", 1), S("L", 3), S("L", 9), S("L", 7)]),
  perm_from_cycle([S("L", 2), S("L", 6), S("L", 8), S("L", 4)]),
  perm_from_cycle([S("U", 1), S("F", 1), S("D", 1), S("B", 9)]),
  perm_from_cycle([S("U", 4), S("F", 4), S("D", 4), S("B", 6)]),
  perm_from_cycle([S("U", 7), S("F", 7), S("D", 7), S("B", 3)]),
].flat();

const d_move = [
  perm_from_cycle([S("D", 1), S("D", 3), S("D", 9), S("D", 7)]),
  perm_from_cycle([S("D", 2), S("D", 6), S("D", 8), S("D", 4)]),
  perm_from_cycle([S("F", 7), S("R", 7), S("B", 7), S("L", 7)]),
  perm_from_cycle([S("F", 8), S("R", 8), S("B", 8), S("L", 8)]),
  perm_from_cycle([S("F", 9), S("R", 9), S("B", 9), S("L", 9)]),
].flat();

function apply_move(cube: Cube, perm: number[][]): Cube {
  let new_cube = [...cube];
  for (let x of perm) {
    new_cube[x[1]] = cube[x[0]];
  }
  //perm.forEach( ([src, dst]) => new_cube[dst] = cube[src] );
  return new_cube;
}

// Ensure CubeState explicitly requires all Face keys
export type CubeState = {
  [key in Face]: FaceState;
};

export const COLORS: Record<string, Color> = {
  WHITE: "W",
  YELLOW: "Y",
  BLUE: "B",
  GREEN: "G",
  RED: "R",
  ORANGE: "O",
};

function apply_single_move_to_cube(cube: Cube, move: string): Cube {
  // To implement CCW moves, we can rotate the cube 3 times
  switch (move) {
    case "U":
      return apply_move(cube, u_move);
    case "U2":
      return apply_move(apply_move(cube, u_move), u_move);
    case "U'":
      return apply_move(apply_move(apply_move(cube, u_move), u_move), u_move);
    case "D":
      return apply_move(cube, d_move);
    case "D2":
      return apply_move(apply_move(cube, d_move), d_move);
    case "D'":
      return apply_move(apply_move(apply_move(cube, d_move), d_move), d_move);
    case "F":
      return apply_move(cube, f_move);
    case "F2":
      return apply_move(apply_move(cube, f_move), f_move);
    case "F'":
      return apply_move(apply_move(apply_move(cube, f_move), f_move), f_move);
    case "B":
      return apply_move(cube, b_move);
    case "B2":
      return apply_move(apply_move(cube, b_move), b_move);
    case "B'":
      return apply_move(apply_move(apply_move(cube, b_move), b_move), b_move);
    case "L":
      return apply_move(cube, l_move);
    case "L2":
      return apply_move(apply_move(cube, l_move), l_move);
    case "L'":
      return apply_move(apply_move(apply_move(cube, l_move), l_move), l_move);
    case "R":
      return apply_move(cube, r_move);
    case "R2":
      return apply_move(apply_move(cube, r_move), r_move);
    case "R'":
      return apply_move(apply_move(apply_move(cube, r_move), r_move), r_move);
    default:
      throw new Error(`Invalid move: ${move}`);
  }
}

export class RubiksCube {
  private moveHistory: string[] = [];
  // Make initial state truly readonly from outside
  public readonly initialState: Readonly<Cube> = solved_cube;

  constructor(initialMoves?: string) {
    if (initialMoves) {
      this.applyMoveSequence(initialMoves);
    }
  }

  /**
   * Applies a sequence of moves described in standard notation.
   * @param sequence - A string like "R U R' U'"
   */
  applyMoveSequence(sequence: string): void {
    // Regex to match valid moves: R, U', F2 etc. Handles spaces correctly.
    const moves = sequence.trim().match(/([RLUDFB])(['2]?)/g);
    if (moves) {
      // Filter out any potential null/empty matches if regex/string is weird
      this.moveHistory.push(...moves.filter((m) => m));
    } else if (sequence.trim() !== "") {
      console.warn(`Could not parse move sequence: "${sequence}"`);
    }
  }

  /**
   * Get the current state of the cube by applying all moves from history.
   * @returns The calculated CubeState.
   */
  getCurrentState(): Cube {
    // Start with a deep copy of the initial state
    // let currentState = deepCopyState(this.initialState as CubeState); // Cast needed as deepCopy expects mutable
    let cube = [...this.initialState];
    for (const move of this.moveHistory) {
      cube = apply_single_move_to_cube(cube, move);
    }
    return cube;
  }

  /**
   * Checks if the cube is currently in the solved state.
   * @returns True if solved, false otherwise.
   */
  isSolved(): boolean {
    let currentState = this.getCurrentState();

    if (currentState.length !== this.initialState.length) {
      return false;
    }

    for (let i = 0; i < currentState.length; i++) {
      if (currentState[i] !== this.initialState[i]) {
        return false;
      }
    }

    return true;
  }

  getStickerAt(face: Face, i: number): Sticker {
    return this.getCurrentState()[S(face, i)];
  }

  /**
   * Resets the cube to the solved state by clearing the move history.
   */
  reset(): void {
    this.moveHistory = [];
  }

  /**
   * Applies a random sequence of moves to scramble the cube.
   * Clears the current history before scrambling.
   * @param numMoves - The number of random moves to apply (default: 25).
   */
  scramble(numMoves: number = 25): void {
    this.reset(); // Start from a solved state for scrambling

    const faces = Object.keys(this.initialState) as Face[];
    const modifiers = ["", "'", "2"];
    let lastFace: Face | null = null;
    const randomMoves: string[] = [];

    for (let i = 0; i < numMoves; i++) {
      let randomFace: Face;
      // Avoid redundant moves like R L R or R R'
      let potentialFace: Face;
      do {
        potentialFace = faces[Math.floor(Math.random() * faces.length)];
        // Prevent immediate inverse face (e.g. R then L) - less common but good practice
        // Prevent same face twice in a row (e.g. R then R') - more important
      } while (
        potentialFace === lastFace ||
        (lastFace === "R" && potentialFace === "L") ||
        (lastFace === "L" && potentialFace === "R") ||
        (lastFace === "U" && potentialFace === "D") ||
        (lastFace === "D" && potentialFace === "U") ||
        (lastFace === "F" && potentialFace === "B") ||
        (lastFace === "B" && potentialFace === "F")
      );

      randomFace = potentialFace;
      const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      randomMoves.push(`${randomFace}${randomModifier}`);
      lastFace = randomFace;
    }

    this.applyMoveSequence(randomMoves.join(" "));
  }

  /**
   * Returns the history of moves applied.
   */
  getMoveHistory(): readonly string[] {
    // Return as readonly
    // Return a copy to prevent external modification
    return [...this.moveHistory];
  }
}
