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

import {Gate} from "../circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "../circuit//KetShaderUtil.js"
import {WglArg} from "../webgl/WglArg.js"

let IncrementGates = {};

const offsetShader = ketShaderPermute(
    'uniform float amount;',
    'return mod(out_id - amount + span, span);');

IncrementGates.IncrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("inc" + span).
    setSymbol("+1").
    setTitle("Increment Gate").
    setBlurb("Adds 1 to the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", +1))).
    setKnownEffectToPermutation(t => (t + 1) & ((1 << span) - 1)));

IncrementGates.DecrementFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setAlternateFromFamily(IncrementGates.IncrementFamily).
    setSerializedId("dec" + span).
    setSymbol("−1").
    setTitle("Decrement Gate").
    setBlurb("Subtracts 1 from the little-endian number represented by a block of qubits.").
    setActualEffectToShaderProvider(ctx => offsetShader.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("amount", -1))).
    setKnownEffectToPermutation(t => (t - 1) & ((1 << span) - 1)));

IncrementGates.all = [
    ...IncrementGates.IncrementFamily.all,
    ...IncrementGates.DecrementFamily.all,
];

export {IncrementGates, offsetShader}
