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
import {GateShaders} from "../../src/circuit/GateShaders.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "../CircuitOperationTestUtil.js"

import {Complex} from "../../src/math/Complex.js"
import {Seq} from "../../src/base/Seq.js"
import {Shaders} from "../../src/webgl/Shaders.js"
import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("GateShaders");

suite.testUsingWebGL('cycleAllBits', () => {
    let inp = Shaders.vec2Data(Seq.range(16).flatMap(e => [e*4 + 1, e*4 + 2]).toFloat32Array()).toVec2Texture(4);
    let actual = GateShaders.cycleAllBits(inp, -1).readVec2Outputs(4);
    assertThat(actual).isEqualTo(new Float32Array([
        1, 2,    9,10,  17,18,  25,26,
        33,34,  41,42,  49,50,  57,58,
        5, 6,   13,14,  21,22,  29,30,
        37,38,  45,46,  53,54,  61,62
    ]));
    inp.deallocByDepositingInPool();
});

suite.testUsingWebGL("matrixOperation", () => {
    let repeats = 3;
    for (let size = 1; size < 5; size++) {
        let d = 1<<size;
        let matrix = Matrix.generate(d, d, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertThatCircuitUpdateActsLikeMatrix(
            ctx => GateShaders.applyMatrixOperation(ctx, matrix),
            matrix,
            repeats);
    }
});
