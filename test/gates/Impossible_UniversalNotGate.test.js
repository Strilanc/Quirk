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
import {CircuitEvalContext} from "../../src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "../../src/circuit/CircuitShaders.js"
import {universalNot} from "../../src/gates/Impossible_UniversalNotGate.js"

import {Controls} from "../../src/circuit/Controls.js"
import {Shaders} from "../../src/webgl/Shaders.js"
import {WglTextureTrader} from "../../src/webgl/WglTextureTrader.js"

let suite = new Suite("Impossible_UniverseNotGate");

suite.testUsingWebGL('universalNot', () => {
    let input = Shaders.vec2Data(new Float32Array([
        1,2, 3,4,
        5,6, 7,8
    ])).toVec2Texture(2);
    let assertAbout = (index, control) => {
        let controlTex = CircuitShaders.controlMask(control).toBoolTexture(2);
        let trader = new WglTextureTrader(input);
        trader.dontDeallocCurrentTexture();
        let ctx = new CircuitEvalContext(
            0,
            index,
            2,
            control,
            controlTex,
            control,
            trader,
            new Map());
        try {
            return assertThat(universalNot(ctx).readVec2Outputs(2));
        } finally {
            controlTex.deallocByDepositingInPool();
        }
    };
    assertAbout(0, Controls.NONE).isEqualTo(new Float32Array([
        3,-4, -1,2,
        7,-8, -5,6
    ]));
    assertAbout(1, Controls.NONE).isEqualTo(new Float32Array([
        5,-6, 7,-8,
        -1,2, -3,4
    ]));
    assertAbout(0, Controls.bit(1, true)).isEqualTo(new Float32Array([
        1,2,  3,4,
        7,-8, -5,6
    ]));

    input.deallocByDepositingInPool();
});
