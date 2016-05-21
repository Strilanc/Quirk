import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"

let PhaseGradientGates = {};
export default PhaseGradientGates;

const τ = Math.PI * 2;
const GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, τ*r/(2<<span)) : 0);
const DE_GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, -τ*r/(2<<span)) : 0);

PhaseGradientGates.PhaseGradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^#",
    "Phase Gradient Gate",
    "Phases by an amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseGradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.phaseGradient(val, con, bit, span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^-#",
    "Inverse Phase Gradient Gate",
    "Phases by a negative amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DE_GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseUngradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.phaseGradient(val, con, bit, span, -1)));
