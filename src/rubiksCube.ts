// rubiksCube.ts
// Custom deep comparison function instead of using node:assert
function deepStrictEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
    return false;
  }

  let keys1 = Object.keys(obj1);
  let keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepStrictEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

// --- Constants ---

export type Color = "W" | "Y" | "B" | "G" | "R" | "O"; // White, Yellow, Blue, Green, Red, Orange
export type Face = "U" | "D" | "F" | "B" | "L" | "R"; // Up, Down, Front, Back, Left, Right

export type Sticker = Color;
export type FaceState = Sticker[][]; // 3x3 array of stickers
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

// Use direct keys for clarity and type safety
export const initialSolvedState: CubeState = {
  U: [
    // Yellow
    [COLORS.YELLOW, COLORS.YELLOW, COLORS.YELLOW],
    [COLORS.YELLOW, COLORS.YELLOW, COLORS.YELLOW],
    [COLORS.YELLOW, COLORS.YELLOW, COLORS.YELLOW],
  ],
  D: [
    // White
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
  ],
  F: [
    // Blue
    [COLORS.BLUE, COLORS.BLUE, COLORS.BLUE],
    [COLORS.BLUE, COLORS.BLUE, COLORS.BLUE],
    [COLORS.BLUE, COLORS.BLUE, COLORS.BLUE],
  ],
  B: [
    // Green
    [COLORS.GREEN, COLORS.GREEN, COLORS.GREEN],
    [COLORS.GREEN, COLORS.GREEN, COLORS.GREEN],
    [COLORS.GREEN, COLORS.GREEN, COLORS.GREEN],
  ],
  L: [
    // Orange
    [COLORS.ORANGE, COLORS.ORANGE, COLORS.ORANGE],
    [COLORS.ORANGE, COLORS.ORANGE, COLORS.ORANGE],
    [COLORS.ORANGE, COLORS.ORANGE, COLORS.ORANGE],
  ],
  R: [
    // Red
    [COLORS.RED, COLORS.RED, COLORS.RED],
    [COLORS.RED, COLORS.RED, COLORS.RED],
    [COLORS.RED, COLORS.RED, COLORS.RED],
  ],
};

// --- Helper Functions ---

// Deep copy a cube state
function deepCopyState(state: CubeState): CubeState {
  return JSON.parse(JSON.stringify(state));
}

// Rotate a 3x3 face clockwise
function rotateFaceCW(face: FaceState): FaceState {
  // Initialize with a valid placeholder color
  const newFace: FaceState = [
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      newFace[j][2 - i] = face[i][j];
    }
  }
  return newFace;
}

// Rotate a 3x3 face counter-clockwise
function rotateFaceCCW(face: FaceState): FaceState {
  // Initialize with a valid placeholder color
  const newFace: FaceState = [
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
    [COLORS.WHITE, COLORS.WHITE, COLORS.WHITE],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      newFace[2 - j][i] = face[i][j];
    }
  }
  return newFace;
}

// Apply a single move notation to a given state
function applySingleMoveToState(state: CubeState, move: string): CubeState {
  const newState = deepCopyState(state);
  const faceChar = move.charAt(0) as Face; // Assume valid face char after regex parse
  const modifier = move.slice(1); // '', "'", "2"

  // Use CCW rotation for prime moves for potentially cleaner logic,
  // or stick to multiple CW rotations as before. Let's stick to CW for now.
  const turns = modifier === "'" ? 3 : modifier === "2" ? 2 : 1;

  for (let turn = 0; turn < turns; turn++) {
    // Rotate the face itself
    newState[faceChar] = rotateFaceCW(newState[faceChar]);

    // Rotate adjacent stickers (this is the complex part)
    let tempRow: Sticker[];
    let tempCol: Sticker[];

    switch (faceChar) {
      case "U":
        tempRow = newState.F[0];
        newState.F[0] = newState.R[0];
        newState.R[0] = newState.B[0];
        newState.B[0] = newState.L[0];
        newState.L[0] = tempRow;
        break;
      case "D":
        tempRow = newState.F[2];
        newState.F[2] = newState.L[2];
        newState.L[2] = newState.B[2];
        newState.B[2] = newState.R[2];
        newState.R[2] = tempRow;
        break;
      case "F":
        tempCol = [newState.U[0][0], newState.U[0][1], newState.U[0][2]];
        newState.U[0][0] = newState.R[0][2];
        newState.U[0][1] = newState.R[1][2];
        newState.U[0][2] = newState.R[2][2];
        newState.R[0][2] = newState.D[2][2];
        newState.R[1][2] = newState.D[2][1];
        newState.R[2][2] = newState.D[2][0];
        newState.D[2][0] = newState.L[0][0];
        newState.D[2][1] = newState.L[1][0];
        newState.D[2][2] = newState.L[2][0];
        newState.L[0][0] = tempCol[2];
        newState.L[1][0] = tempCol[1];
        newState.L[2][0] = tempCol[0];
        break;
      case "B":
        tempCol = [newState.U[2][0], newState.U[2][1], newState.U[2][2]];
        newState.U[2][0] = newState.L[2][2];
        newState.U[2][1] = newState.L[1][2];
        newState.U[2][2] = newState.L[0][2];
        newState.L[0][2] = newState.D[0][0];
        newState.L[1][2] = newState.D[0][1];
        newState.L[2][2] = newState.D[0][2];
        newState.D[0][0] = newState.R[2][0];
        newState.D[0][1] = newState.R[1][0];
        newState.D[0][2] = newState.R[0][0];
        newState.R[0][0] = tempCol[0];
        newState.R[1][0] = tempCol[1];
        newState.R[2][0] = tempCol[2];
        break;
      case "L":
        tempCol = [newState.U[0][0], newState.U[1][0], newState.U[2][0]];
        newState.U[0][0] = newState.B[2][2];
        newState.U[1][0] = newState.B[1][2];
        newState.U[2][0] = newState.B[0][2];
        newState.B[0][2] = newState.D[2][0];
        newState.B[1][2] = newState.D[1][0];
        newState.B[2][2] = newState.D[0][0];
        newState.D[0][0] = newState.F[0][0];
        newState.D[1][0] = newState.F[1][0];
        newState.D[2][0] = newState.F[2][0];
        newState.F[0][0] = tempCol[0];
        newState.F[1][0] = tempCol[1];
        newState.F[2][0] = tempCol[2];
        break;
      case "R":
        tempCol = [newState.U[0][2], newState.U[1][2], newState.U[2][2]];
        newState.U[0][2] = newState.F[0][2];
        newState.U[1][2] = newState.F[1][2];
        newState.U[2][2] = newState.F[2][2];
        newState.F[0][2] = newState.D[0][2];
        newState.F[1][2] = newState.D[1][2];
        newState.F[2][2] = newState.D[2][2];
        newState.D[0][2] = newState.B[2][0];
        newState.D[1][2] = newState.B[1][0];
        newState.D[2][2] = newState.B[0][0];
        newState.B[0][0] = tempCol[2];
        newState.B[1][0] = tempCol[1];
        newState.B[2][0] = tempCol[0];
        break;
    }
  }

  return newState;
}

// --- RubiksCube Class ---

export class RubiksCube {
  private moveHistory: string[] = [];
  // Make initial state truly readonly from outside
  public readonly initialState: Readonly<CubeState> = initialSolvedState;

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
  getCurrentState(): CubeState {
    // Start with a deep copy of the initial state
    let currentState = deepCopyState(this.initialState as CubeState); // Cast needed as deepCopy expects mutable
    for (const move of this.moveHistory) {
      currentState = applySingleMoveToState(currentState, move);
    }
    return currentState;
  }

  /**
   * Checks if the cube is currently in the solved state.
   * @returns True if solved, false otherwise.
   */
  isSolved(): boolean {
    let currentState = this.getCurrentState();
    // Using our custom deepStrictEqual implementation
    if (deepStrictEqual(currentState, this.initialState)) {
      return true;
    }

    // Fallback: Check if every sticker on a face matches the center sticker's color
    for (const face of Object.keys(this.initialState) as Face[]) {
      let expectedColor = this.initialState[face][1][1]; // Initial center piece color
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (currentState[face][i][j] !== expectedColor) {
            return false;
          }
        }
      }
    }

    // This shouldn't be reached if the logic is correct,
    // but serves as a fallback if there's an issue with the comparison
    console.warn("State comparison discrepancy: deepStrictEqual failed but face check passed. Check implementation.");
    return true; // Return true if face check passed
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
