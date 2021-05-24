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
import {
    assertThatCircuitShaderActsLikeMatrix,
    assertThatGateActsLikePhaser,
} from "../CircuitOperationTestUtil.js"
import {PHASE_GRADIENT_SHADER, PhaseGradientGates} from "../../src/gates/PhaseGradientGates.js"

import {Complex} from "../../src/math/Complex.js"
import {Matrix} from "../../src/math/Matrix.js"
import {ketArgs} from "../../src/circuit/KetShaderUtil.js"
import {WglArg} from "../../src/webgl/WglArg.js"

let suite = new Suite("PhaseGradientGates");

suite.testUsingWebGL('PHASE_GRADIENT_SHADER', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => PHASE_GRADIENT_SHADER.withArgs(...ketArgs(ctx, 3), WglArg.float('factor', Math.PI/8)),
        Matrix.generateDiagonal(8, i => Complex.polar(1, i*Math.PI/8)));

    assertThatCircuitShaderActsLikeMatrix(
        ctx => PHASE_GRADIENT_SHADER.withArgs(...ketArgs(ctx, 4), WglArg.float('factor', -Math.PI/16)),
        Matrix.generateDiagonal(16, i => Complex.polar(1, -i*Math.PI/16)));
});

suite.testUsingWebGL('DynamicPhaseGradientFamily', () => {
    assertThatGateActsLikePhaser(
        PhaseGradientGates.DynamicPhaseGradientFamily.ofSize(3),
        k => 0.3*k,
        0.3);

    assertThatGateActsLikePhaser(
        PhaseGradientGates.DynamicPhaseDegradientFamily.ofSize(2),
        k => -0.1*k,
        0.1);
});
