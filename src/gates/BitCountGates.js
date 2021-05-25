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

import {Config} from "../Config.js"
import {Gate} from "../circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "../circuit/KetShaderUtil.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"

let BitCountGates = {};

const POP_COUNT_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float d = read_input_A();
        float popcnt = 0.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            popcnt += mod(d, 2.0);
            d = floor(d / 2.0);
        }
        float offset = mod(popcnt * factor, span);
        return mod(out_id + span - offset, span);`);

BitCountGates.PlusBitCountAFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedIdAndSymbol("+cntA" + span).
    setSymbol("+1s(A)").
    setTitle("Bit Count Gate").
    setBlurb("Counts the number of ON bits in input A and adds that into this output.").
    setRequiredContextKeys("Input Range A").
    setActualEffectToShaderProvider(ctx => POP_COUNT_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A']),
        WglArg.float("factor", +1))).
    setKnownEffectToParametrizedPermutation((t, a) => (t + Util.numberOfSetBits(a)) & ((1 << span) - 1)));

BitCountGates.MinusBitCountAFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(BitCountGates.PlusBitCountAFamily).
    setSerializedIdAndSymbol("-cntA" + span).
    setSymbol("-1s(A)").
    setTitle("Bit Un-Count Gate").
    setBlurb("Counts the number of ON bits in input A and subtracts that into this output.").
    setRequiredContextKeys("Input Range A").
    setActualEffectToShaderProvider(ctx => POP_COUNT_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A']),
        WglArg.float("factor", -1))).
    setKnownEffectToParametrizedPermutation((t, a) => (t - Util.numberOfSetBits(a)) & ((1 << span) - 1)));

BitCountGates.all = [
    ...BitCountGates.PlusBitCountAFamily.all,
    ...BitCountGates.MinusBitCountAFamily.all
];

export {BitCountGates}
