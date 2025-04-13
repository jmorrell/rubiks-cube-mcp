import { RubiksCube, initialSolvedState } from "./rubiksCube";
import type { CubeState, Face, Color } from "./rubiksCube";
import { deepStrictEqual } from "assert"; // Using Node's assert for deep comparison

// Helper for cleaner tests
function assertCubeIsSolved(cube: RubiksCube, message?: string) {
  expect(cube.isSolved()).toBe(true);
  // Optionally, verify against the initial state directly for extra confidence
  try {
    deepStrictEqual(cube.getCurrentState(), initialSolvedState);
  } catch (e: any) {
    console.error("Assertion Error Details:", e.message);
    console.log("Current State:", JSON.stringify(cube.getCurrentState(), null, 2));
    console.log("Expected State:", JSON.stringify(initialSolvedState, null, 2));
    throw new Error(`Cube state mismatch: ${message || ""}`);
  }
}

describe("RubiksCube", () => {
  let cube: RubiksCube;

  beforeEach(() => {
    cube = new RubiksCube();
  });

  test("should initialize in a solved state", () => {
    assertCubeIsSolved(cube, "Initial state");
    expect(cube.getMoveHistory()).toEqual([]);
  });

  test("should apply a single clockwise R move", () => {
    cube.applyMoveSequence("R");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["R"]);
    // Spot check a few known sticker changes for R move
    const state = cube.getCurrentState();
    // Up face, right column should now be Blue (from Front)
    expect(state.U[0][2]).toBe("B");
    expect(state.U[1][2]).toBe("B");
    expect(state.U[2][2]).toBe("B");
    // Front face, right column should now be White (from Down)
    expect(state.F[0][2]).toBe("W");
    expect(state.F[1][2]).toBe("W");
    expect(state.F[2][2]).toBe("W");
    // Right face should be rotated
    expect(state.R[0][0]).toBe("R"); // Center unchanged
    expect(state.R[0][1]).toBe("R");
    expect(state.R[1][0]).toBe("R");
    expect(state.R[0][2]).toBe("R"); // Corner moved
  });

  test("should apply a single clockwise L move", () => {
    cube.applyMoveSequence("L");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["L"]);
    const state = cube.getCurrentState();
    // Up face left col should be Blue (from Front)
    expect(state.U[0][0]).toBe("B");
    expect(state.U[1][0]).toBe("B");
    expect(state.U[2][0]).toBe("B");
    // Front face left col should be White (from Down)
    expect(state.F[0][0]).toBe("W");
    expect(state.F[1][0]).toBe("W");
    expect(state.F[2][0]).toBe("W");
    // Left face should be rotated
    expect(state.L[0][1]).toBe("O"); // Top edge moved
    expect(state.L[1][0]).toBe("O"); // Middle edge moved
  });

  test("should apply a single clockwise U move", () => {
    cube.applyMoveSequence("U");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U"]);
    const state = cube.getCurrentState();
    // Front face top row should be Red (from Right)
    expect(state.F[0][0]).toBe("R");
    expect(state.F[0][1]).toBe("R");
    expect(state.F[0][2]).toBe("R");
    // Right face top row should be Green (from Back)
    expect(state.R[0][0]).toBe("G");
    expect(state.R[0][1]).toBe("G");
    expect(state.R[0][2]).toBe("G");
    // Up face should be rotated
    expect(state.U[0][1]).toBe("Y"); // Top edge moved
    expect(state.U[1][0]).toBe("Y"); // Middle edge moved
  });

  test("should apply a single clockwise D move", () => {
    cube.applyMoveSequence("D");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["D"]);
    const state = cube.getCurrentState();
    // Front face bottom row should be Orange (from Left)
    expect(state.F[2][0]).toBe("O");
    expect(state.F[2][1]).toBe("O");
    expect(state.F[2][2]).toBe("O");
    // Left face bottom row should be Green (from Back)
    expect(state.L[2][0]).toBe("G");
    expect(state.L[2][1]).toBe("G");
    expect(state.L[2][2]).toBe("G");
    // Down face should be rotated
    expect(state.D[0][1]).toBe("W"); // Top edge moved (relative to D face)
    expect(state.D[1][0]).toBe("W"); // Middle edge moved
  });

  test("should apply a single clockwise F move", () => {
    cube.applyMoveSequence("F");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["F"]);
    const state = cube.getCurrentState();
    // Up face bottom row should be Red (from Right)
    expect(state.U[2][0]).toBe("R");
    expect(state.U[2][1]).toBe("R");
    expect(state.U[2][2]).toBe("R");
    // Right face left col should be White (from Down)
    expect(state.R[0][0]).toBe("W");
    expect(state.R[1][0]).toBe("W");
    expect(state.R[2][0]).toBe("W");
    // Front face should be rotated
    expect(state.F[0][1]).toBe("B"); // Top edge moved
    expect(state.F[1][0]).toBe("B"); // Middle edge moved
  });

  test("should apply a single clockwise B move", () => {
    cube.applyMoveSequence("B");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["B"]);
    const state = cube.getCurrentState();
    // Up face top row should be Orange (from Left)
    expect(state.U[0][0]).toBe("O");
    expect(state.U[0][1]).toBe("O");
    expect(state.U[0][2]).toBe("O");
    // Left face left col should be White (from Down)
    expect(state.L[0][0]).toBe("W");
    expect(state.L[1][0]).toBe("W");
    expect(state.L[2][0]).toBe("W");
    // Back face should be rotated
    expect(state.B[0][1]).toBe("G"); // Top edge moved
    expect(state.B[1][0]).toBe("G"); // Middle edge moved
  });

  test("should apply a single counter-clockwise F' move", () => {
    cube.applyMoveSequence("F'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["F'"]);
    const state = cube.getCurrentState();
    // Up face bottom row should be Red (from Right)
    expect(state.U[2][0]).toBe("R");
    expect(state.U[2][1]).toBe("R");
    expect(state.U[2][2]).toBe("R");
    // Right face left col should be White (from Down)
    expect(state.R[0][0]).toBe("W");
    expect(state.R[1][0]).toBe("W");
    expect(state.R[2][0]).toBe("W");
  });

  test("should apply a single counter-clockwise R' move", () => {
    cube.applyMoveSequence("R'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["R'"]);
    let state = cube.getCurrentState();
    // Up face right col should be Green (from Back)
    expect(state.U[0][2]).toBe("G");
    expect(state.U[1][2]).toBe("G");
    expect(state.U[2][2]).toBe("G");
    // Back face left col should be White (from Down)
    expect(state.B[0][2]).toBe("W"); // Note: Back face is indexed differently
    expect(state.B[1][2]).toBe("W");
    expect(state.B[2][2]).toBe("W");
    // Right face should be rotated counter-clockwise
    expect(state.R[0][1]).toBe("R"); // Top edge moved
    expect(state.R[1][2]).toBe("R"); // Right edge moved
  });

  test("should apply a single counter-clockwise L' move", () => {
    cube.applyMoveSequence("L'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["L'"]);
    let state = cube.getCurrentState();
    // Up face left col should be Green (from Back)
    expect(state.U[0][0]).toBe("G");
    expect(state.U[1][0]).toBe("G");
    expect(state.U[2][0]).toBe("G");
    // Back face right col should be White (from Down)
    expect(state.B[0][0]).toBe("W");
    expect(state.B[1][0]).toBe("W");
    expect(state.B[2][0]).toBe("W");
    // Left face should be rotated counter-clockwise
    expect(state.L[0][1]).toBe("O"); // Top edge moved
    expect(state.L[1][2]).toBe("O"); // Right edge moved
  });

  test("should apply a single counter-clockwise U' move", () => {
    cube.applyMoveSequence("U'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U'"]);
    let state = cube.getCurrentState();
    // Front face top row should be Orange (from Left)
    expect(state.F[0][0]).toBe("O");
    expect(state.F[0][1]).toBe("O");
    expect(state.F[0][2]).toBe("O");
    // Left face top row should be Blue (from Front)
    expect(state.L[0][0]).toBe("B");
    expect(state.L[0][1]).toBe("B");
    expect(state.L[0][2]).toBe("B");
    // Up face should be rotated counter-clockwise
    expect(state.U[0][1]).toBe("Y"); // Top edge moved
    expect(state.U[1][2]).toBe("Y"); // Right edge moved
  });

  test("should apply a single counter-clockwise D' move", () => {
    cube.applyMoveSequence("D'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["D'"]);
    let state = cube.getCurrentState();
    // Front face bottom row should be Red (from Right)
    expect(state.F[2][0]).toBe("R");
    expect(state.F[2][1]).toBe("R");
    expect(state.F[2][2]).toBe("R");
    // Right face bottom row should be Blue (from Front)
    expect(state.R[2][0]).toBe("B");
    expect(state.R[2][1]).toBe("B");
    expect(state.R[2][2]).toBe("B");
    // Down face should be rotated counter-clockwise
    expect(state.D[0][1]).toBe("W"); // Top edge moved (relative to D face)
    expect(state.D[1][2]).toBe("W"); // Right edge moved
  });

  test("should apply a single counter-clockwise B' move", () => {
    cube.applyMoveSequence("B'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["B'"]);
    let state = cube.getCurrentState();
    // Up face top row should be Red (from Right)
    expect(state.U[0][0]).toBe("R");
    expect(state.U[0][1]).toBe("R");
    expect(state.U[0][2]).toBe("R");
    // Right face right col should be White (from Down)
    expect(state.R[0][2]).toBe("W");
    expect(state.R[1][2]).toBe("W");
    expect(state.R[2][2]).toBe("W");
    // Back face should be rotated counter-clockwise
    expect(state.B[0][1]).toBe("G"); // Top edge moved
    expect(state.B[1][2]).toBe("G"); // Right edge moved
  });

  test("should apply a double move", () => {
    cube.applyMoveSequence("U2");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U2"]);
    const state = cube.getCurrentState();
    // Front top row should be Green (from Back)
    expect(state.F[0][0]).toBe("G");
    expect(state.F[0][1]).toBe("G");
    expect(state.F[0][2]).toBe("G");
    // Back top row should be Blue (from Front)
    expect(state.B[0][0]).toBe("B");
    expect(state.B[0][1]).toBe("B");
    expect(state.B[0][2]).toBe("B");
  });

  test("should parse complex move sequences", () => {
    cube.applyMoveSequence("R U R' U' F2 B'");
    expect(cube.getMoveHistory()).toEqual(["R", "U", "R'", "U'", "F2", "B'"]);
    expect(cube.isSolved()).toBe(false);
  });

  test("rotating any same side 4 times should return to solved state", () => {
    const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
    faces.forEach((face) => {
      const cube_ = new RubiksCube(); // Fresh cube for each face test
      cube_.applyMoveSequence(`${face} ${face} ${face} ${face}`);
      assertCubeIsSolved(cube_, `4x ${face}`);
    });
  });

  test('rotating any same side twice with "2" modifier should return to solved state', () => {
    const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face}2 ${face}2`);
      assertCubeIsSolved(cube_, `2x ${face}2`);
    });
  });

  test("rotating a face clockwise then counterclockwise should return to solved state", () => {
    const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face} ${face}'`);
      assertCubeIsSolved(cube_, `${face} ${face}'`);
    });
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face}' ${face}`);
      assertCubeIsSolved(cube_, `${face}' ${face}`);
    });
  });

  test("performing the sequence R U R' U' 6 times should return to solved state", () => {
    const sequence = "R U R' U'";
    for (let i = 0; i < 6; i++) {
      cube.applyMoveSequence(sequence);
    }
    assertCubeIsSolved(cube, "(R U R' U') x 6");
  });

  test("performing the sequence F B U D L R F B U D L R should NOT return to solved state", () => {
    // This is just a sanity check that not *all* sequences return to solved quickly
    const sequence = "F B U D L R F B U D L R";
    cube.applyMoveSequence(sequence);
    expect(cube.isSolved()).toBe(false);
  });

  test("reset method should clear history and return to solved state", () => {
    cube.applyMoveSequence("R U R'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory().length).toBeGreaterThan(0);

    cube.reset();

    expect(cube.getMoveHistory()).toEqual([]);
    assertCubeIsSolved(cube, "After reset");
  });

  test("scramble method should apply random moves and usually result in unsolved state", () => {
    assertCubeIsSolved(cube, "Before scramble");
    cube.scramble(25);
    expect(cube.getMoveHistory().length).toBe(25);
    // It's theoretically possible (but astronomically unlikely) to scramble back to solved
    // So we just check that it's generally not solved.
    // We can also check that the state is different from initial
    let isDifferent = false;
    try {
      deepStrictEqual(cube.getCurrentState(), initialSolvedState);
    } catch {
      isDifferent = true;
    }
    expect(isDifferent).toBe(true);

    // Scrambling again should clear the old history
    const firstScrambleHistory = cube.getMoveHistory();
    cube.scramble(5);
    expect(cube.getMoveHistory().length).toBe(5);
    expect(cube.getMoveHistory()).not.toEqual(firstScrambleHistory);
  });

  test("constructor should accept initial moves", () => {
    const cubeWithMoves = new RubiksCube("R U R'");
    expect(cubeWithMoves.getMoveHistory()).toEqual(["R", "U", "R'"]);
    expect(cubeWithMoves.isSolved()).toBe(false);
  });

  test("isSolved should correctly identify a solved state after moves", () => {
    cube.applyMoveSequence("R U R' U' R U R' U'"); // Apply part of the cycle
    expect(cube.isSolved()).toBe(false);
    cube.applyMoveSequence("R U R' U' R U R' U' R U R' U' R U R' U'"); // Complete the 6 cycles
    assertCubeIsSolved(cube, "Solved after (R U R' U') x 6 applied incrementally");
  });
});
