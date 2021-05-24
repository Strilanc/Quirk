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
import {assertThatCircuitUpdateActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {applyControlledPhaseGradient, FourierTransformGates} from "../../src/gates/FourierTransformGates.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {advanceStateWithCircuit} from "../../src/circuit/CircuitComputeUtil.js"

import {Complex} from "../../src/math/Complex.js"
import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("FourierTransformGates");

suite.testUsingWebGL('controlledPhaseGradient', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => applyControlledPhaseGradient(ctx, 3, 1),
        Matrix.generateDiagonal(8, i => i < 4 ? 1 : Complex.polar(1, (i-4)*Math.PI/4)));

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => applyControlledPhaseGradient(ctx, 4, -1),
        Matrix.generateDiagonal(16, i => i < 8 ? 1 : Complex.polar(1, -(i-8)*Math.PI/8)));
});

suite.testUsingWebGL('fourierTransform', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(2, [new GateColumn([
                FourierTransformGates.FourierTransformFamily.ofSize(2), undefined])]),
            false).output,
        Matrix.generate(4, 4, (i, j) => Complex.polar(0.5, i*j*Math.PI/2)));

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(3, [new GateColumn([
                FourierTransformGates.InverseFourierTransformFamily.ofSize(3), undefined, undefined])]),
            false).output,
        Matrix.generate(8, 8, (i, j) => Complex.polar(Math.sqrt(1/8), -i*j*Math.PI/4)));
});
