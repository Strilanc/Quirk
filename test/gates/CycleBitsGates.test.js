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
import {assertThatCircuitShaderActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {cycleBitsShader} from "../../src/gates/CycleBitsGates.js"

import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("CycleBitsGates");

suite.testUsingWebGL('cycleBitsShader', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => cycleBitsShader(ctx, 3, 2),
        Matrix.generateTransition(8, i => ((i&1)<<2) | ((i>>1)&3)));
    assertThatCircuitShaderActsLikeMatrix(
        ctx => cycleBitsShader(ctx, 4, -2),
        Matrix.generateTransition(16, i => ((i&3)<<2) | ((i>>2)&3)));
});
