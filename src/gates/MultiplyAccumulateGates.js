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

import {Config} from "../Config.js";
import {Gate} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "../circuit/KetShaderUtil.js"
import {WglArg} from "../webgl/WglArg.js"

let MultiplyAccumulateGates = {};

let sectionSizes = totalSize => {
    let c = Math.ceil(totalSize / 2);
    let b = Math.ceil((totalSize - c) / 2);
    let a = Math.max(totalSize - c - b, 1);
    return [a, b, totalSize - a - b];
};

const makeScaledMultiplyAddPermutation = (span, scaleFactor) => e => {
    let [sa, sb, sc] = sectionSizes(span);
    let a = e & ((1 << sa) - 1);
    let b = (e >> sa) & ((1 << sb) - 1);
    let c = e >> (sa + sb);
    c += a*b*scaleFactor;
    c &= ((1 << sc) - 1);
    return a | (b << sa) | (c << (sa+sb));
};

const MUL_STEP = 6;
const BIG_MUL_MOD_SHADER_CODE = `
    // Avoids large multiplications that lose precision.
    float big_mul_mod(float b, float f, float modulus) {
        float t = 0.0;
        float r;
        for (int k = 0; k < ${Math.ceil(Config.MAX_WIRE_COUNT/MUL_STEP)}; k++) {
            r = floor(mod(f + 0.5, ${1<<MUL_STEP}.0));
            f -= r;
            t = floor(mod(t + b*r + 0.5, modulus));
            b = floor(mod(b * ${1<<MUL_STEP}.0 + 0.5, modulus));
            f /= ${1<<MUL_STEP}.0;
        }
        return t;
    }
`;

const MULTIPLY_ACCUMULATE_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('B')}
        ${BIG_MUL_MOD_SHADER_CODE}
    `,
    `
        float d1 = read_input_A();
        float d2 = read_input_B();
        float d = floor(mod(big_mul_mod(d1, d2, span)*factor + 0.5, span));
        return mod(out_id + span - d, span);`);

MultiplyAccumulateGates.Legacy_MultiplyAddFamily = Gate.buildFamily(3, 16, (span, builder) => builder.
    setSerializedId("c+=ab" + span).
    setSymbol("c+=ab").
    setTitle("Multiply-Add Gate").
    setBlurb("Adds the product of two numbers into a third.").
    setDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c+=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    setActualEffectToUpdateFunc(ctx => {
        let [a, b, c] = sectionSizes(span);
        return MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(c).customOperation(
            ctx.withRow(ctx.row + a + b).
                withInputSetToRange('A', ctx.row, a).
                withInputSetToRange('B', ctx.row + a, b));
    }).
    setKnownEffectToPermutation(makeScaledMultiplyAddPermutation(span, +1)));

MultiplyAccumulateGates.Legacy_MultiplySubtractFamily = Gate.buildFamily(3, 16, (span, builder) => builder.
    setAlternateFromFamily(MultiplyAccumulateGates.Legacy_MultiplyAddFamily).
    setSerializedId("c-=ab" + span).
    setSymbol("c-=ab").
    setTitle("Multiply-Subtract Gate").
    setBlurb("Subtracts the product of two numbers from a third.").
    setDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c-=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    setActualEffectToUpdateFunc(ctx => {
        let [a, b, c] = sectionSizes(span);
        return MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(c).customOperation(
            ctx.withRow(ctx.row + a + b).
                withInputSetToRange('A', ctx.row, a).
                withInputSetToRange('B', ctx.row + a, b));
    }).
    setKnownEffectToPermutation(makeScaledMultiplyAddPermutation(span, -1)));

MultiplyAccumulateGates.MultiplyAddInputsFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("+=AB" + span).
    setSymbol("+AB").
    setTitle("Multiply-Add Gate [Inputs A, B]").
    setBlurb("Adds the product of inputs A and B into the qubits covered by this gate.").
    setRequiredContextKeys('Input Range A', 'Input Range B').
    setActualEffectToShaderProvider(ctx => MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B']),
        WglArg.float("factor", +1))).
    setKnownEffectToParametrizedPermutation((t, a, b) => (t + a*b) & ((1 << span) - 1)));

MultiplyAccumulateGates.MultiplySubtractInputsFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(MultiplyAccumulateGates.MultiplyAddInputsFamily).
    setSerializedId("-=AB" + span).
    setSymbol("−AB").
    setTitle("Multiply-Subtract Gate [Inputs A, B]").
    setBlurb("Subtracts the product of inputs A and B out of the qubits covered by this gate.").
    setRequiredContextKeys('Input Range A', 'Input Range B').
    setActualEffectToShaderProvider(ctx => MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B']),
        WglArg.float("factor", -1))).
    setKnownEffectToParametrizedPermutation((t, a, b) => (t - a*b) & ((1 << span) - 1)));

MultiplyAccumulateGates.SquareAddInputFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("+=AA" + span).
    setSymbol("+A^2").
    setTitle("Square-Add Gate [Input A]").
    setBlurb("Adds the square of input A into the qubits covered by this gate.").
    setRequiredContextKeys('Input Range A').
    setActualEffectToUpdateFunc(ctx =>
        MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(span).customOperation(
            ctx.withInputSetToOtherInput('B', 'A'))).
    setKnownEffectToParametrizedPermutation((t, a) => (t + a*a) & ((1 << span) - 1)));

MultiplyAccumulateGates.SquareSubtractInputFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(MultiplyAccumulateGates.SquareAddInputFamily).
    setSerializedId("-=AA" + span).
    setSymbol("-A^2").
    setTitle("Square-Subtract Gate [Input A]").
    setBlurb("Subtracts the square of input A out of the qubits covered by this gate.").
    setRequiredContextKeys('Input Range A').
    setActualEffectToUpdateFunc(ctx =>
        MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(span).customOperation(
            ctx.withInputSetToOtherInput('B', 'A'))).
    setKnownEffectToParametrizedPermutation((t, a) => (t - a*a) & ((1 << span) - 1)));

MultiplyAccumulateGates.all = [
    ...MultiplyAccumulateGates.Legacy_MultiplyAddFamily.all,
    ...MultiplyAccumulateGates.Legacy_MultiplySubtractFamily.all,
    ...MultiplyAccumulateGates.MultiplyAddInputsFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractInputsFamily.all,
    ...MultiplyAccumulateGates.SquareAddInputFamily.all,
    ...MultiplyAccumulateGates.SquareSubtractInputFamily.all,
];

export {MultiplyAccumulateGates, BIG_MUL_MOD_SHADER_CODE, MUL_STEP}
