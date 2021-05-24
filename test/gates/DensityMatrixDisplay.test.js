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

import {Suite, assertThat} from "../TestUtil.js"
import {amplitudesToCouplings} from "../../src/gates/DensityMatrixDisplay.js"
import {Shaders} from "../../src/webgl/Shaders.js"

let suite = new Suite("DensityMatrixDisplay");

suite.testUsingWebGL("amplitudesToCouplings", () => {
    let s = Math.sqrt(0.5);
    let inp = Shaders.vec2Data(new Float32Array([
        s,0,
        0,0,
        0,0,
        s,0
    ])).toVec2Texture(2);

    assertThat(amplitudesToCouplings(inp, 1).readVec2Outputs(3)).isApproximatelyEqualTo(new Float32Array([
        0.5,0,   0,0,
        0,  0,   0,0,

        0,  0,   0,0,
        0,  0,   0.5,0
    ]));
    assertThat(amplitudesToCouplings(inp, 2).readVec2Outputs(4)).isApproximatelyEqualTo(new Float32Array([
        0.5,0, 0,0, 0,0, 0.5,0,
        0,0,   0,0, 0,0, 0,0,
        0,0,   0,0, 0,0, 0,0,
        0.5,0, 0,0, 0,0, 0.5,0
    ]));

    inp.deallocByDepositingInPool();
});
