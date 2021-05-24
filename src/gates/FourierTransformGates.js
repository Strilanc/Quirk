/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Complex} from "../math/Complex.js"
import {Gate} from "../circuit/Gate.js"
import {ketArgs, ketShaderPhase} from "../circuit/KetShaderUtil.js"
import {Matrix} from "../math/Matrix.js"
import {HalfTurnGates} from "./HalfTurnGates.js"
import {reverseShaderForSize} from "./ReverseBitsGate.js"
import {WglArg} from "../webgl/WglArg.js"

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 */
function applyControlledPhaseGradient(ctx, qubitSpan, factor=1) {
    ctx.applyOperation(CONTROLLED_PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("factor", factor)));
}
const CONTROLLED_PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    `
        float hold = floor(out_id * 2.0 / span);
        float step = mod(out_id, span / 2.0);
        return hold * step * factor * 6.2831853071795864769 / span;
    `);

const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), Math.PI*2*r*c/(1<<span)));
const INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    FOURIER_TRANSFORM_MATRIX_MAKER(span).adjoint();

let FourierTransformGates = {};

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 */
function applyForwardGradientShaders(ctx, span) {
    if (span > 1) {
        ctx.applyOperation(reverseShaderForSize(span));
    }
    for (let i = 0; i < span; i++) {
        if (i > 0) {
            applyControlledPhaseGradient(ctx, i + 1, +1);
        }
        HalfTurnGates.H.customOperation(ctx.withRow(ctx.row + i));
    }
}

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 */
function applyBackwardGradientShaders(ctx, span) {
    for (let i = span - 1; i >= 0; i--) {
        HalfTurnGates.H.customOperation(ctx.withRow(ctx.row + i));
        if (i > 0) {
            applyControlledPhaseGradient(ctx, i + 1, -1);
        }
    }
    if (span > 1) {
        ctx.applyOperation(reverseShaderForSize(span));
    }
}

FourierTransformGates.FourierTransformFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("QFT" + span).
    setSymbol("QFT").
    setTitle("Fourier Transform Gate").
    setBlurb("Transforms to/from phase frequency space.").
    setActualEffectToUpdateFunc(ctx => applyForwardGradientShaders(ctx, span)).
    promiseEffectIsUnitary().
    setTooltipMatrixFunc(() => FOURIER_TRANSFORM_MATRIX_MAKER(span)));

FourierTransformGates.InverseFourierTransformFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("QFT†" + span).
    setSymbol("QFT^†").
    setAlternateFromFamily(FourierTransformGates.FourierTransformFamily).
    setTitle("Inverse Fourier Transform Gate").
    setBlurb("Transforms from/to phase frequency space.").
    setActualEffectToUpdateFunc(ctx => applyBackwardGradientShaders(ctx, span)).
    promiseEffectIsUnitary().
    setTooltipMatrixFunc(() => INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER(span)));

FourierTransformGates.all = [
    ...FourierTransformGates.FourierTransformFamily.all,
    ...FourierTransformGates.InverseFourierTransformFamily.all
];

export {applyControlledPhaseGradient, FourierTransformGates}
