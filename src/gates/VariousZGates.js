import Gate from "src/circuit/Gate.js"
import Matrix from "src/math/Matrix.js"

let VariousZGates = {};
export default VariousZGates;

VariousZGates.Z3 = Gate.fromKnownMatrix(
    "Z^⅓",
    Matrix.fromPauliRotation(0, 0, 1 / 6),
    "Z^⅓ Gate",
    "Principle third root of Z.");
VariousZGates.Z3i = Gate.fromKnownMatrix(
    "Z^-⅓",
    Matrix.fromPauliRotation(0, 0, -1 / 6),
    "Z^-⅓ Gate",
    "Adjoint third root of Z.");
VariousZGates.Z4 = Gate.fromKnownMatrix(
    "Z^¼",
    Matrix.fromPauliRotation(0, 0, 1 / 8),
    "Z^¼ Gate",
    "Principle fourth root of Z.\nAlso known as the 'T' gate.");
VariousZGates.Z4i = Gate.fromKnownMatrix(
    "Z^-¼",
    Matrix.fromPauliRotation(0, 0, -1 / 8),
    "Z^-¼ Gate",
    "Adjoint fourth root of Z.");
VariousZGates.Z8 = Gate.fromKnownMatrix(
    "Z^⅛",
    Matrix.fromPauliRotation(0, 0, 1 / 16),
    "Z^⅛ Gate",
    "Principle eighth root of Z.");
VariousZGates.Z8i = Gate.fromKnownMatrix(
    "Z^-⅛",
    Matrix.fromPauliRotation(0, 0, -1 / 16),
    "Z^-⅛ Gate",
    "Adjoint eighth root of Z.");
VariousZGates.Z16 = Gate.fromKnownMatrix(
    "Z^⅟₁₆",
    Matrix.fromPauliRotation(0, 0, 1 / 32),
    "Z^⅟₁₆ Gate",
    "Principle sixteenth root of Z.");
VariousZGates.Z16i = Gate.fromKnownMatrix(
    "Z^-⅟₁₆",
    Matrix.fromPauliRotation(0, 0, -1 / 32),
    "Z^-⅟₁₆ Gate",
    "Adjoint sixteenth root of Z.");

VariousZGates.all =[
    VariousZGates.Z3,
    VariousZGates.Z4,
    VariousZGates.Z8,
    VariousZGates.Z16,
    VariousZGates.Z3i,
    VariousZGates.Z4i,
    VariousZGates.Z8i,
    VariousZGates.Z16i
];
