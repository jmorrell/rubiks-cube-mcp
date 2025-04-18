import { RubiksCube } from "./rubiksCube";
import type { Face } from "./rubiksCube";

describe("RubiksCube", () => {
  let cube: RubiksCube;

  beforeEach(() => {
    cube = new RubiksCube();
  });

  test("should initialize in a solved state", () => {
    expect(cube.isSolved()).toBe(true);
    expect(cube.getMoveHistory()).toEqual([]);
  });

  test("should apply a single clockwise R move", () => {
    cube.applyMoveSequence("R");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["R"]);

    expect(cube.getStickerAt("U", 3)).toBe("B");
    expect(cube.getStickerAt("U", 6)).toBe("B");
    expect(cube.getStickerAt("U", 9)).toBe("B");

    expect(cube.getStickerAt("F", 3)).toBe("W");
    expect(cube.getStickerAt("F", 6)).toBe("W");
    expect(cube.getStickerAt("F", 9)).toBe("W");
  });

  test("should apply a single clockwise L move", () => {
    cube.applyMoveSequence("L");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["L"]);
    expect(cube.getStickerAt("U", 1)).toBe("G");
    expect(cube.getStickerAt("U", 4)).toBe("G");
    expect(cube.getStickerAt("U", 7)).toBe("G");
    expect(cube.getStickerAt("F", 1)).toBe("Y");
    expect(cube.getStickerAt("F", 4)).toBe("Y");
    expect(cube.getStickerAt("F", 7)).toBe("Y");
  });

  test("should apply a single clockwise U move", () => {
    cube.applyMoveSequence("U");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U"]);
    expect(cube.getStickerAt("F", 1)).toBe("R");
    expect(cube.getStickerAt("F", 2)).toBe("R");
    expect(cube.getStickerAt("F", 3)).toBe("R");
    expect(cube.getStickerAt("R", 1)).toBe("G");
    expect(cube.getStickerAt("R", 2)).toBe("G");
    expect(cube.getStickerAt("R", 3)).toBe("G");
  });

  test("should apply a single clockwise D move", () => {
    cube.applyMoveSequence("D");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["D"]);
    expect(cube.getStickerAt("F", 7)).toBe("O");
    expect(cube.getStickerAt("F", 8)).toBe("O");
    expect(cube.getStickerAt("F", 9)).toBe("O");
    expect(cube.getStickerAt("L", 7)).toBe("G");
    expect(cube.getStickerAt("L", 8)).toBe("G");
    expect(cube.getStickerAt("L", 8)).toBe("G");
  });

  test("should apply a single clockwise F move", () => {
    cube.applyMoveSequence("F");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["F"]);
    expect(cube.getStickerAt("U", 7)).toBe("O");
    expect(cube.getStickerAt("U", 8)).toBe("O");
    expect(cube.getStickerAt("U", 9)).toBe("O");
    expect(cube.getStickerAt("R", 1)).toBe("Y");
    expect(cube.getStickerAt("R", 4)).toBe("Y");
    expect(cube.getStickerAt("R", 7)).toBe("Y");
  });

  test("should apply a single clockwise B move", () => {
    cube.applyMoveSequence("B");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["B"]);
    expect(cube.getStickerAt("U", 1)).toBe("R");
    expect(cube.getStickerAt("U", 2)).toBe("R");
    expect(cube.getStickerAt("U", 3)).toBe("R");
    expect(cube.getStickerAt("L", 1)).toBe("Y");
    expect(cube.getStickerAt("L", 4)).toBe("Y");
    expect(cube.getStickerAt("L", 7)).toBe("Y");
  });

  test("should apply a single counter-clockwise F' move", () => {
    cube.applyMoveSequence("F'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["F'"]);
    expect(cube.getStickerAt("U", 7)).toBe("R");
    expect(cube.getStickerAt("U", 8)).toBe("R");
    expect(cube.getStickerAt("U", 9)).toBe("R");
    expect(cube.getStickerAt("R", 1)).toBe("W");
    expect(cube.getStickerAt("R", 4)).toBe("W");
    expect(cube.getStickerAt("R", 7)).toBe("W");
  });

  test("should apply a single counter-clockwise R' move", () => {
    cube.applyMoveSequence("R'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["R'"]);
    expect(cube.getStickerAt("U", 3)).toBe("G");
    expect(cube.getStickerAt("U", 6)).toBe("G");
    expect(cube.getStickerAt("U", 9)).toBe("G");
    expect(cube.getStickerAt("B", 1)).toBe("W");
    expect(cube.getStickerAt("B", 4)).toBe("W");
    expect(cube.getStickerAt("B", 7)).toBe("W");
  });

  test("should apply a single counter-clockwise L' move", () => {
    cube.applyMoveSequence("L'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["L'"]);
    expect(cube.getStickerAt("U", 1)).toBe("B");
    expect(cube.getStickerAt("U", 4)).toBe("B");
    expect(cube.getStickerAt("U", 7)).toBe("B");
    expect(cube.getStickerAt("B", 3)).toBe("Y");
    expect(cube.getStickerAt("B", 6)).toBe("Y");
    expect(cube.getStickerAt("B", 9)).toBe("Y");
  });

  test("should apply a single counter-clockwise U' move", () => {
    cube.applyMoveSequence("U'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U'"]);
    expect(cube.getStickerAt("F", 1)).toBe("O");
    expect(cube.getStickerAt("F", 2)).toBe("O");
    expect(cube.getStickerAt("F", 3)).toBe("O");
    expect(cube.getStickerAt("L", 1)).toBe("G");
    expect(cube.getStickerAt("L", 2)).toBe("G");
    expect(cube.getStickerAt("L", 3)).toBe("G");
  });

  test("should apply a single counter-clockwise D' move", () => {
    cube.applyMoveSequence("D'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["D'"]);
    expect(cube.getStickerAt("F", 7)).toBe("R");
    expect(cube.getStickerAt("F", 8)).toBe("R");
    expect(cube.getStickerAt("F", 9)).toBe("R");
    expect(cube.getStickerAt("R", 7)).toBe("G");
    expect(cube.getStickerAt("R", 8)).toBe("G");
    expect(cube.getStickerAt("R", 9)).toBe("G");
  });

  test("should apply a single counter-clockwise B' move", () => {
    cube.applyMoveSequence("B'");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["B'"]);
    expect(cube.getStickerAt("U", 1)).toBe("O");
    expect(cube.getStickerAt("U", 2)).toBe("O");
    expect(cube.getStickerAt("U", 3)).toBe("O");
    expect(cube.getStickerAt("R", 3)).toBe("Y");
    expect(cube.getStickerAt("R", 6)).toBe("Y");
    expect(cube.getStickerAt("R", 9)).toBe("Y");
  });

  test("should apply a double move", () => {
    cube.applyMoveSequence("U2");
    expect(cube.isSolved()).toBe(false);
    expect(cube.getMoveHistory()).toEqual(["U2"]);
    expect(cube.getStickerAt("F", 1)).toBe("G");
    expect(cube.getStickerAt("F", 2)).toBe("G");
    expect(cube.getStickerAt("F", 3)).toBe("G");
    expect(cube.getStickerAt("B", 1)).toBe("B");
    expect(cube.getStickerAt("B", 2)).toBe("B");
    expect(cube.getStickerAt("B", 3)).toBe("B");
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
      expect(cube.isSolved()).toBe(true);
    });
  });

  test('rotating any same side twice with "2" modifier should return to solved state', () => {
    const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face}2 ${face}2`);
      expect(cube.isSolved()).toBe(true);
    });
  });

  test("rotating a face clockwise then counterclockwise should return to solved state", () => {
    const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face} ${face}'`);
      expect(cube.isSolved()).toBe(true);
    });
    faces.forEach((face) => {
      const cube_ = new RubiksCube();
      cube_.applyMoveSequence(`${face}' ${face}`);
      expect(cube.isSolved()).toBe(true);
    });
  });

  test("performing the sequence R U R' U' 3 times should put the cube into a known scrambled state", () => {
    const sequence = "R U R' U'";
    for (let i = 0; i < 3; i++) {
      cube.applyMoveSequence(sequence);
    }

    expect(cube.getStickerAt("U", 1)).toBe("G");
    expect(cube.getStickerAt("U", 2)).toBe("Y");
    expect(cube.getStickerAt("U", 3)).toBe("G");
    expect(cube.getStickerAt("U", 4)).toBe("Y");
    expect(cube.getStickerAt("U", 5)).toBe("Y");
    expect(cube.getStickerAt("U", 6)).toBe("Y");
    expect(cube.getStickerAt("U", 7)).toBe("Y");
    expect(cube.getStickerAt("U", 8)).toBe("Y");
    expect(cube.getStickerAt("U", 9)).toBe("W");

    expect(cube.getStickerAt("F", 1)).toBe("B");
    expect(cube.getStickerAt("F", 2)).toBe("B");
    expect(cube.getStickerAt("F", 3)).toBe("R");
    expect(cube.getStickerAt("F", 4)).toBe("B");
    expect(cube.getStickerAt("F", 5)).toBe("B");
    expect(cube.getStickerAt("F", 6)).toBe("B");
    expect(cube.getStickerAt("F", 7)).toBe("B");
    expect(cube.getStickerAt("F", 8)).toBe("B");
    expect(cube.getStickerAt("F", 9)).toBe("R");

    expect(cube.getStickerAt("R", 1)).toBe("B");
    expect(cube.getStickerAt("R", 2)).toBe("R");
    expect(cube.getStickerAt("R", 3)).toBe("O");
    expect(cube.getStickerAt("R", 4)).toBe("R");
    expect(cube.getStickerAt("R", 5)).toBe("R");
    expect(cube.getStickerAt("R", 6)).toBe("R");
    expect(cube.getStickerAt("R", 7)).toBe("B");
    expect(cube.getStickerAt("R", 8)).toBe("R");
    expect(cube.getStickerAt("R", 9)).toBe("R");
  });

  test("performing the sequence R L B should put the cube into a known scrambled state", () => {
    const sequence = "R L B";
    cube.applyMoveSequence(sequence);

    expect(cube.getStickerAt("R", 1)).toBe("R");
    expect(cube.getStickerAt("R", 2)).toBe("R");
    expect(cube.getStickerAt("R", 3)).toBe("G");
    expect(cube.getStickerAt("R", 4)).toBe("R");
    expect(cube.getStickerAt("R", 5)).toBe("R");
    expect(cube.getStickerAt("R", 6)).toBe("W");
    expect(cube.getStickerAt("R", 7)).toBe("R");
    expect(cube.getStickerAt("R", 8)).toBe("R");
    expect(cube.getStickerAt("R", 9)).toBe("B");

    expect(cube.getStickerAt("U", 1)).toBe("R");
    expect(cube.getStickerAt("U", 2)).toBe("R");
    expect(cube.getStickerAt("U", 3)).toBe("R");
    expect(cube.getStickerAt("U", 4)).toBe("G");
    expect(cube.getStickerAt("U", 5)).toBe("Y");
    expect(cube.getStickerAt("U", 6)).toBe("B");
    expect(cube.getStickerAt("U", 7)).toBe("G");
    expect(cube.getStickerAt("U", 8)).toBe("Y");
    expect(cube.getStickerAt("U", 9)).toBe("B");

    expect(cube.getStickerAt("L", 1)).toBe("B");
    expect(cube.getStickerAt("L", 2)).toBe("O");
    expect(cube.getStickerAt("L", 3)).toBe("O");
    expect(cube.getStickerAt("L", 4)).toBe("Y");
    expect(cube.getStickerAt("L", 5)).toBe("O");
    expect(cube.getStickerAt("L", 6)).toBe("O");
    expect(cube.getStickerAt("L", 7)).toBe("G");
    expect(cube.getStickerAt("L", 8)).toBe("O");
  });

  test("performing the sequence U D B should put the cube into a known scrambled state", () => {
    const sequence = "U D B";
    cube.applyMoveSequence(sequence);

    expect(cube.getStickerAt("U", 1)).toBe("G");
    expect(cube.getStickerAt("U", 2)).toBe("R");
    expect(cube.getStickerAt("U", 3)).toBe("B");
    expect(cube.getStickerAt("U", 4)).toBe("Y");
    expect(cube.getStickerAt("U", 5)).toBe("Y");
    expect(cube.getStickerAt("U", 6)).toBe("Y");
    expect(cube.getStickerAt("U", 7)).toBe("Y");
    expect(cube.getStickerAt("U", 8)).toBe("Y");
    expect(cube.getStickerAt("U", 9)).toBe("Y");

    expect(cube.getStickerAt("D", 1)).toBe("W");
    expect(cube.getStickerAt("D", 2)).toBe("W");
    expect(cube.getStickerAt("D", 3)).toBe("W");
    expect(cube.getStickerAt("D", 4)).toBe("W");
    expect(cube.getStickerAt("D", 5)).toBe("W");
    expect(cube.getStickerAt("D", 6)).toBe("W");
    expect(cube.getStickerAt("D", 7)).toBe("B");
    expect(cube.getStickerAt("D", 8)).toBe("O");
    expect(cube.getStickerAt("D", 9)).toBe("G");
  });

  test("performing the sequence L D L' D' 3 times should put the cube into a known scrambled state", () => {
    const sequence = "L D L' D'";
    for (let i = 0; i < 3; i++) {
      cube.applyMoveSequence(sequence);
    }

    expect(cube.getStickerAt("D", 1)).toBe("Y");
    expect(cube.getStickerAt("D", 2)).toBe("W");
    expect(cube.getStickerAt("D", 3)).toBe("W");
    expect(cube.getStickerAt("D", 4)).toBe("W");
    expect(cube.getStickerAt("D", 5)).toBe("W");
    expect(cube.getStickerAt("D", 6)).toBe("W");
    expect(cube.getStickerAt("D", 7)).toBe("G");
    expect(cube.getStickerAt("D", 8)).toBe("W");
    expect(cube.getStickerAt("D", 9)).toBe("G");

    expect(cube.getStickerAt("L", 1)).toBe("O");
    expect(cube.getStickerAt("L", 2)).toBe("O");
    expect(cube.getStickerAt("L", 3)).toBe("B");
    expect(cube.getStickerAt("L", 4)).toBe("O");
    expect(cube.getStickerAt("L", 5)).toBe("O");
    expect(cube.getStickerAt("L", 6)).toBe("O");
    expect(cube.getStickerAt("L", 7)).toBe("R");
    expect(cube.getStickerAt("L", 8)).toBe("O");
    expect(cube.getStickerAt("L", 9)).toBe("B");

    expect(cube.getStickerAt("F", 1)).toBe("O");
    expect(cube.getStickerAt("F", 2)).toBe("B");
    expect(cube.getStickerAt("F", 3)).toBe("B");
    expect(cube.getStickerAt("F", 4)).toBe("B");
    expect(cube.getStickerAt("F", 5)).toBe("B");
    expect(cube.getStickerAt("F", 6)).toBe("B");
    expect(cube.getStickerAt("F", 7)).toBe("O");
    expect(cube.getStickerAt("F", 8)).toBe("B");
    expect(cube.getStickerAt("F", 9)).toBe("B");
  });

  test("performing the sequence R U R' U' 6 times should return to solved state", () => {
    const sequence = "R U R' U'";
    for (let i = 0; i < 6; i++) {
      cube.applyMoveSequence(sequence);
    }
    expect(cube.isSolved()).toBe(true);
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
    expect(cube.isSolved()).toBe(true);
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
    expect(cube.isSolved()).toBe(true);
  });
});
