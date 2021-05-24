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

import {Suite} from "../TestUtil.js"
import {ketArgs, ketShader, ketShaderPermute, ketShaderPhase} from "../../src/circuit/KetShaderUtil.js"
import {assertThatCircuitShaderActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {Complex} from "../../src/math/Complex.js"
import {Matrix} from "../../src/math/Matrix.js"
import {WglArg} from "../../src/webgl/WglArg.js"

let suite = new Suite("KetShaderUtil");

suite.testUsingWebGL("ketShader", () => {
    let shader = ketShader(
        'uniform vec2 a, b, c, d;',
        'return cmul(inp(0.0), a+(c-a)*out_id) + cmul(inp(1.0), b+(d-b)*out_id);',
        1);
    assertThatCircuitShaderActsLikeMatrix(
        ctx => shader.withArgs(
            ...ketArgs(ctx),
            WglArg.vec2("a", 2, 3),
            WglArg.vec2("b", 5, 7),
            WglArg.vec2("c", 11, 13),
            WglArg.vec2("d", 17, 19)),
        new Matrix(2, 2, new Float32Array([2, 3, 5, 7, 11, 13, 17, 19])));
});

suite.testUsingWebGL("ketShaderPermute", () => {
    let shader = ketShaderPermute(
        '',
        'return mod(out_id + 1.0, 4.0);',
        2);
    assertThatCircuitShaderActsLikeMatrix(
        ctx => shader.withArgs(...ketArgs(ctx)),
        Matrix.generateTransition(4, i => (i - 1) & 3));
});

suite.testUsingWebGL("ketShaderPhase", () => {
    let shader = ketShaderPhase(
        '',
        'return out_id/10.0;',
        3);
    assertThatCircuitShaderActsLikeMatrix(
        ctx => shader.withArgs(...ketArgs(ctx)),
        Matrix.generateDiagonal(8, i => Complex.polar(1, i/10)));
});
