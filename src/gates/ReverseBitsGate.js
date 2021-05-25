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
import {ketArgs, ketShaderPermute} from "../circuit/KetShaderUtil.js"
import {Seq} from "../base/Seq.js"

let _generateReverseShaderForSize = span => span < 2 ? undefined : ketShaderPermute(
    '',
    `
        float rev = 0.0;
        for (int k = 0; k < ${span}; k++) {
            rev *= 2.0;
            rev += mod(out_id, 2.0);
            out_id = floor(out_id*0.5);
        }
        return rev;
    `,
    span);

let reverseShaders = Seq.range(Config.MAX_WIRE_COUNT + 1).map(_generateReverseShaderForSize).toArray();

/**
 * @param {!int} span
 * @returns {!function(!CircuitEvalContext) : !WglConfiguredShader}
 */
let reverseShaderForSize = span => ctx => reverseShaders[span].withArgs(...ketArgs(ctx, span));

let ReverseBitsGateFamily = Gate.buildFamily(2, 16, (span, builder) => builder.
    setSerializedId("rev" + span).
    setSymbol("Reverse").
    setTitle("Reverse Order").
    setBlurb("Swaps bits into the opposite order.").
    setKnownEffectToBitPermutation(i => span - 1 - i).
    setActualEffectToShaderProvider(reverseShaderForSize(span)));

export {ReverseBitsGateFamily, reverseShaderForSize}
