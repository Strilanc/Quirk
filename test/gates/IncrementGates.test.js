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
import {offsetShader, IncrementGates} from "../../src/gates/IncrementGates.js"
import {
    assertThatCircuitShaderActsLikePermutation,
    assertThatGateActsLikePermutation,
} from "../CircuitOperationTestUtil.js"

import {ketArgs} from "../../src/circuit/KetShaderUtil.js"
import {WglArg} from "../../src/webgl/WglArg.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('offsetShader', () => {
    assertThatCircuitShaderActsLikePermutation(
        3,
        ctx => offsetShader.withArgs(...ketArgs(ctx, 3), WglArg.float("amount", 5)),
        e => (e+5) & 7);

    assertThatCircuitShaderActsLikePermutation(
        6,
        ctx => offsetShader.withArgs(...ketArgs(ctx, 6), WglArg.float("amount", -31)),
        e => (e-31) & 63);
});

suite.testUsingWebGL('IncrementGate', () => {
    assertThatGateActsLikePermutation(
        IncrementGates.IncrementFamily.ofSize(3),
        e => (e + 1) & 7);

    assertThatGateActsLikePermutation(
        IncrementGates.DecrementFamily.ofSize(4),
        e => (e - 1) & 15);
});
