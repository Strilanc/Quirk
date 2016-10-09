import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {ketArgs, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

const τ = Math.PI * 2;
const GRADIENT_MATRIX_MAKER = span => Matrix.generateDiagonal(1<<span, k => Complex.polar(1, τ*k/(2<<span)));
const DE_GRADIENT_MATRIX_MAKER = span => Matrix.generateDiagonal(1<<span, k => Complex.polar(1, -τ*k/(2<<span)));

/**
 * @param {!CircuitEvalArgs} args
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 * @returns {!WglConfiguredShader} A configured shader that renders the output superposition (as a grid of amplitudes).
 */
function phaseGradient(args, qubitSpan, factor=1) {
    return PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(args, qubitSpan),
        WglArg.float("factor", factor));
}
const PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    'float angle = out_id * factor * 3.141592653589793 / span; return vec2(cos(angle), sin(angle));');

let PhaseGradientGates = {};

PhaseGradientGates.PhaseGradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^#",
    "Phase Gradient Gate",
    "Phases proportional to the number represented by some bits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseGradient" + span).
    withHeight(span).
    withCustomShader(args => phaseGradient(args, span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^-#",
    "Inverse Phase Gradient Gate",
    "Counter-phases proportional to the number represented by some bits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DE_GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseUngradient" + span).
    withHeight(span).
    withCustomShader(args => phaseGradient(args, span, -1)));

PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all
];

export {PhaseGradientGates, phaseGradient}
