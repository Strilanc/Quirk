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

import {BIG_MUL_MOD_SHADER_CODE} from "./MultiplyAccumulateGates.js"
import {Gate} from "../circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "../circuit/KetShaderUtil.js"
import {modulusTooBigChecker} from "./ModularIncrementGates.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"

let ModularMultiplyAccumulateGates = {};

const MODULAR_MULTIPLY_ACCUMULATE_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('B')}
        ${ketInputGateShaderCode('R')}
        ${BIG_MUL_MOD_SHADER_CODE}
    `,
    `
        float r = read_input_R();
        float a = read_input_A();
        float b = read_input_B();

        float d = big_mul_mod(factor * a, b, r);

        float in_id = floor(mod(out_id - d + 0.5, r));
        if (in_id < 0.0) {
            in_id += r;
        }
        if (in_id >= r) {
            in_id -= r;
        }

        return out_id >= r ? out_id : in_id;
    `);

ModularMultiplyAccumulateGates.PlusABModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("+ABmodR" + span).
    setSymbol("+AB\nmod R").
    setTitle("Modular Multiply-Add Gate").
    setBlurb("Adds input A times input B into the target, mod input R.\nOnly affects values below R.").
    setRequiredContextKeys("Input Range A", "Input Range B", "Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B', 'R']),
        WglArg.float("factor", +1))).
    setKnownEffectToParametrizedPermutation((t, a, b, r) => t < r ? (t + a*b) % r : t));

ModularMultiplyAccumulateGates.MinusABModRFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(ModularMultiplyAccumulateGates.PlusABModRFamily).
    setSerializedId("-ABmodR" + span).
    setSymbol("−AB\nmod R").
    setTitle("Modular Multiply-Subtract Gate").
    setBlurb("Subtracts input A times input B out of the target, mod input R.\nOnly affects values below R.").
    setRequiredContextKeys("Input Range A", "Input Range B", "Input Range R").
    setExtraDisableReasonFinder(modulusTooBigChecker("R", span)).
    setActualEffectToShaderProvider(ctx => MODULAR_MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B', 'R']),
        WglArg.float("factor", -1))).
    setKnownEffectToParametrizedPermutation((t, a, b, r) => t < r ? Util.properMod(t - a*b, r) : t));

ModularMultiplyAccumulateGates.all = [
    ...ModularMultiplyAccumulateGates.PlusABModRFamily.all,
    ...ModularMultiplyAccumulateGates.MinusABModRFamily.all,
];

export {ModularMultiplyAccumulateGates}
