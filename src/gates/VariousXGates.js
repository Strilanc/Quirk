import Gate from "src/circuit/Gate.js"
import Matrix from "src/math/Matrix.js"

let VariousXGates = {};
export default VariousXGates;

VariousXGates.X3 = Gate.fromKnownMatrix(
    "X^⅓",
    Matrix.fromPauliRotation(1 / 6, 0, 0),
    "X^⅓ Gate",
    "Principle third root of X.");
VariousXGates.X3i = Gate.fromKnownMatrix(
    "X^-⅓",
    Matrix.fromPauliRotation(-1 / 6, 0, 0),
    "X^-⅓ Gate",
    "Adjoint third root of X.");
VariousXGates.X4 = Gate.fromKnownMatrix(
    "X^¼",
    Matrix.fromPauliRotation(1 / 8, 0, 0),
    "X^¼ Gate",
    "Principle fourth root of X.");
VariousXGates.X4i = Gate.fromKnownMatrix(
    "X^-¼",
    Matrix.fromPauliRotation(-1 / 8, 0, 0),
    "X^-¼ Gate",
    "Adjoint fourth root of X.");
VariousXGates.X8 = Gate.fromKnownMatrix(
    "X^⅛",
    Matrix.fromPauliRotation(1 / 16, 0, 0),
    "X^⅛ Gate",
    "Principle eighth root of X.");
VariousXGates.X8i = Gate.fromKnownMatrix(
    "X^-⅛",
    Matrix.fromPauliRotation(-1 / 16, 0, 0),
    "X^-⅛ Gate",
    "Adjoint eighth root of X.");
VariousXGates.X16 = Gate.fromKnownMatrix(
    "X^⅟₁₆",
    Matrix.fromPauliRotation(1 / 32, 0, 0),
    "X^⅟₁₆ Gate",
    "Principle sixteenth root of X.");
VariousXGates.X16i = Gate.fromKnownMatrix(
    "X^-⅟₁₆",
    Matrix.fromPauliRotation(-1 / 32, 0, 0),
    "X^-⅟₁₆ Gate",
    "Adjoint sixteenth root of X.");
VariousXGates.X32 = Gate.fromKnownMatrix(
    "X^⅟₃₂",
    Matrix.fromPauliRotation(1 / 64, 0, 0),
    "X^⅟₃₂ Gate",
    "Principle 32'nd root of X.");
VariousXGates.X32i = Gate.fromKnownMatrix(
    "X^-⅟₃₂",
    Matrix.fromPauliRotation(-1 / 64, 0, 0),
    "X^-⅟₃₂ Gate",
    "Adjoint 32'nd root of X.");

VariousXGates.all =[
    VariousXGates.X3,
    VariousXGates.X4,
    VariousXGates.X8,
    VariousXGates.X16,
    VariousXGates.X32,
    VariousXGates.X3i,
    VariousXGates.X4i,
    VariousXGates.X8i,
    VariousXGates.X16i,
    VariousXGates.X32i
];
