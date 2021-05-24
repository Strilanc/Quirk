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
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "../circuit/KetShaderUtil.js"
import {modulusTooBigChecker} from "./ModularIncrementGates.js"

let PivotFlipGates = {};

const PIVOT_FLIP_SHADER = ketShaderPermute(
    `
        ${ketInputGateShaderCode('A')}
    `,
    `
        float a = read_input_A();
        return out_id >= a ? out_id : a - out_id - 1.0;
    `);

PivotFlipGates.FlipUnderA = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId('Flip<A' + span).
    setSymbol('Flip\n< A').
    setTitle('Pivot-Flip Gate').
    setBlurb('Reverses the order of states below the pivot value.').
    setRequiredContextKeys('Input Range A').
    setExtraDisableReasonFinder(modulusTooBigChecker('A', span, 'pivot')).
    setActualEffectToShaderProvider(ctx => PIVOT_FLIP_SHADER.withArgs(...ketArgs(ctx, span, ['A']))).
    setKnownEffectToParametrizedPermutation((t, a) => t >= a ? t : a - t - 1));

PivotFlipGates.all = [
    ...PivotFlipGates.FlipUnderA.all,
];

export {PivotFlipGates}
