import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Config} from "src/Config.js"
import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {ketArgs, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {ReverseBitsGateFamily} from "src/gates/ReverseBitsGateFamily.js"
import {seq, Seq} from "src/base/Seq.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!CircuitEvalArgs} args
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 * @returns {!WglConfiguredShader} A configured shader that renders the output superposition (as a grid of amplitudes).
 */
function controlledPhaseGradient(args, qubitSpan, factor=1) {
    return CONTROLLED_PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(args, qubitSpan),
        WglArg.float("factor", factor));
}
const CONTROLLED_PHASE_GRADIENT_SHADER = ketShaderPhase(
    `
        float hold = floor(out_id * 2.0 / span);
        float step = mod(out_id, span / 2.0);
        float angle = hold * step * factor * 6.2831853071795864769 / span;
        return vec2(cos(angle), sin(angle));
    `,
    'uniform float factor;',
    null);

const τ = Math.PI * 2;
const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), τ*r*c/(1<<span)));
const INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    FOURIER_TRANSFORM_MATRIX_MAKER(span).adjoint();

let FourierTransformGates = {};

let gradShaders = (n, factor) => Seq.range(n).
    flatMap(i => [
        args => controlledPhaseGradient(args, i+1, factor),
        args => GateShaders.matrixOperation(
            args.withRow(args.row + i),
            Matrix.HADAMARD)
    ]).
    skip(1);

FourierTransformGates.FourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT",
    "Fourier Transform Gate",
    "Transforms to/from phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT" + span).
    withHeight(span).
    withCustomShaders([
        ...(span > 1 ? ReverseBitsGateFamily.ofSize(span).customShaders : []),
        ...gradShaders(span, 1)
    ]));

FourierTransformGates.InverseFourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT^†",
    "Inverse Fourier Transform Gate",
    "Transforms from/to phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT†" + span).
    withHeight(span).
    withCustomShaders([
        ...gradShaders(span, -1).reverse(),
        ...(span > 1 ? ReverseBitsGateFamily.ofSize(span).customShaders : [])
    ]));

FourierTransformGates.all = [
    ...FourierTransformGates.FourierTransformFamily.all,
    ...FourierTransformGates.InverseFourierTransformFamily.all
];

export {controlledPhaseGradient, FourierTransformGates}
