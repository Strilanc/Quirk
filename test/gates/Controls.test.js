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

import {assertThat, Suite} from "../TestUtil.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js";
import {Gate} from "../../src/circuit/Gate.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Gates} from "../../src/gates/AllGates.js"

import {Complex} from "../../src/math/Complex.js"
import {Matrix} from "../../src/math/Matrix.js"
import {Util} from "../../src/base/Util.js"
import {advanceStateWithCircuit} from "../../src/circuit/CircuitComputeUtil.js";
import {
    assertThatCircuitUpdateActsLikeMatrix,
} from "../CircuitOperationTestUtil.js";

let suite = new Suite("Gates.Controls");

function assertControlOverlapState(control, expectedOverlap, state) {
    let [a, b] = state;
    let u = Matrix.square(a, Complex.from(b).conjugate().neg(),
                          b, Complex.from(a).conjugate());
    u = u.times(1/Math.sqrt(u.determinant().abs()));
    assertThat(u.isUnitary(0.00001)).withInfo({state, u}).isEqualTo(true);

    let circuit = new CircuitDefinition(2, [
        new GateColumn([Gate.fromKnownMatrix('****', u, '', ''), undefined]),
        new GateColumn([control, Gates.HalfTurns.X]),
    ]);
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0);
    let overlap = stats.controlledWireProbabilityJustAfter(1, Infinity);
    assertThat(overlap).isApproximatelyEqualTo(expectedOverlap)
}

suite.testUsingWebGL('control', () => {
    let i = Complex.I;
    let c = Gates.Controls.Control;
    assertControlOverlapState(c, 0, [1, 0]);
    assertControlOverlapState(c, 1, [0, 1]);
    assertControlOverlapState(c, 0.5, [1, 1]);
    assertControlOverlapState(c, 0.5, [-1, 1]);
    assertControlOverlapState(c, 0.5, [1, i]);
    assertControlOverlapState(c, 0.5, [-1, i]);
});

suite.testUsingWebGL('anti-control', () => {
    let i = Complex.I;
    let c = Gates.Controls.AntiControl;
    assertControlOverlapState(c, 1, [1, 0]);
    assertControlOverlapState(c, 0, [0, 1]);
    assertControlOverlapState(c, 0.5, [1, 1]);
    assertControlOverlapState(c, 0.5, [-1, 1]);
    assertControlOverlapState(c, 0.5, [1, i]);
    assertControlOverlapState(c, 0.5, [-1, i]);
});

suite.testUsingWebGL('X-anti-control', () => {
    let i = Complex.I;
    let c = Gates.Controls.XAntiControl;
    assertControlOverlapState(c, 0.5, [1, 0]);
    assertControlOverlapState(c, 0.5, [0, 1]);
    assertControlOverlapState(c, 1, [1, 1]);
    assertControlOverlapState(c, 0, [-1, 1]);
    assertControlOverlapState(c, 0.5, [1, i]);
    assertControlOverlapState(c, 0.5, [-1, i]);
});

suite.testUsingWebGL('X-control', () => {
    let i = Complex.I;
    let c = Gates.Controls.XControl;
    assertControlOverlapState(c, 0.5, [1, 0]);
    assertControlOverlapState(c, 0.5, [0, 1]);
    assertControlOverlapState(c, 0, [1, 1]);
    assertControlOverlapState(c, 1, [-1, 1]);
    assertControlOverlapState(c, 0.5, [1, i]);
    assertControlOverlapState(c, 0.5, [-1, i]);
});

suite.testUsingWebGL('Y-anti-control', () => {
    let i = Complex.I;
    let c = Gates.Controls.YAntiControl;
    assertControlOverlapState(c, 0.5, [1, 0]);
    assertControlOverlapState(c, 0.5, [0, 1]);
    assertControlOverlapState(c, 0.5, [1, 1]);
    assertControlOverlapState(c, 0.5, [-1, 1]);
    assertControlOverlapState(c, 1, [1, i]);
    assertControlOverlapState(c, 0, [-1, i]);
});

suite.testUsingWebGL('Y-control', () => {
    let i = Complex.I;
    let c = Gates.Controls.YControl;
    assertControlOverlapState(c, 0.5, [1, 0]);
    assertControlOverlapState(c, 0.5, [0, 1]);
    assertControlOverlapState(c, 0.5, [1, 1]);
    assertControlOverlapState(c, 0.5, [-1, 1]);
    assertControlOverlapState(c, 0, [1, i]);
    assertControlOverlapState(c, 1, [-1, i]);
});

suite.testUsingWebGL('Z-parity', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(2, [new GateColumn([
                Gates.Controls.ZParityControl,
                Gates.HalfTurns.Z
            ])]),
            false),
        Matrix.generateDiagonal(1 << 2, i => i === 3 ? -1 : 1));

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [new GateColumn([
                Gates.Controls.ZParityControl,
                undefined,
                Gates.Controls.ZParityControl,
                Gates.HalfTurns.Z])
            ]),
            false),
        Matrix.generateDiagonal(1 << 4, i => Util.popcnt(i & 5) % 2 === 1 && ((i & 8) !== 0) ? -1 : 1));
});

suite.testUsingWebGL('X-parity', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [
                new GateColumn([
                    Gates.HalfTurns.H,
                    Gates.HalfTurns.H,
                    Gates.HalfTurns.H,
                    undefined,
                ]),
                new GateColumn([
                    Gates.Controls.XParityControl,
                    Gates.Controls.XParityControl,
                    Gates.Controls.XParityControl,
                    Gates.HalfTurns.Z
                ]),
                new GateColumn([
                    Gates.HalfTurns.H,
                    Gates.HalfTurns.H,
                    Gates.HalfTurns.H,
                    undefined,
                ]),
            ]),
            false),
        Matrix.generateDiagonal(1 << 4, i => Util.popcnt(i & 7) % 2 === 1 && ((i & 8) !== 0) ? -1 : 1));
});

suite.testUsingWebGL('X-parity', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [
                new GateColumn([
                    Gates.QuarterTurns.SqrtXBackward,
                    Gates.QuarterTurns.SqrtXBackward,
                    Gates.QuarterTurns.SqrtXBackward,
                    undefined,
                ]),
                new GateColumn([
                    Gates.Controls.YParityControl,
                    Gates.Controls.YParityControl,
                    Gates.Controls.YParityControl,
                    Gates.HalfTurns.Z,
                ]),
                new GateColumn([
                    Gates.QuarterTurns.SqrtXForward,
                    Gates.QuarterTurns.SqrtXForward,
                    Gates.QuarterTurns.SqrtXForward,
                    undefined,
                ]),
            ]),
            false),
        Matrix.generateDiagonal(1 << 4, i => Util.popcnt(i & 7) % 2 === 1 && ((i & 8) !== 0) ? -1 : 1));
});

suite.test('xyParityControlsDisabledByMeasurement', () => {
    let c = CircuitDefinition.fromTextDiagram(
        new Map([
            ['M', Gates.Special.Measurement],
            ['H', Gates.HalfTurns.H],
            ['x', Gates.Controls.XParityControl],
            ['y', Gates.Controls.YParityControl],
            ['z', Gates.Controls.ZParityControl],
            ['-', undefined],
        ]),
        `-x-M-x-
         -y-M-y-
         -z-M-z-
         -H---H-`);
    assertThat(c.gateAtLocIsDisabledReason(1, 0)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(1, 1)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(1, 2)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 0)).isNotEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 1)).isNotEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 2)).isEqualTo(undefined);
});
