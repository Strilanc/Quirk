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

import {Suite, assertThat, assertTrue} from "../TestUtil.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Matrix} from "../../src/math/Matrix.js"
import {Serializer} from "../../src/circuit/Serializer.js"
import {seq, Seq} from "../../src/base/Seq.js"

let suite = new Suite("CircuitStats");

const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ...extras,
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
    ['•', Gates.Controls.Control],
    ['◦', Gates.Controls.AntiControl],
    ['⊕', Gates.Controls.XAntiControl],

    ['M', Gates.Special.Measurement],
    ['@', Gates.Displays.BlochSphereDisplay],
    ['!', Gates.PostSelectionGates.PostSelectOn],

    ['-', undefined],
    ['+', undefined],
    ['|', undefined],
    ['/', null]
]), diagram);

suite.testUsingWebGL("empty", () => {
    let stats = CircuitStats.fromCircuitAtTime(CircuitDefinition.EMPTY.withWireCount(1), 0.1);
    assertThat(stats.finalState).isApproximatelyEqualTo(Matrix.col(1, 0));
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 0));
});

suite.testUsingWebGL("smoke", () => {
    let c = circuit(`--X-H---•⊕-
                     --•-H---XX-
                     -H--M--@---`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertTrue(stats.circuitDefinition.colHasControls(2));
    assertThat(stats.qubitDensityMatrix(7, 2)).isEqualTo(Matrix.square(0.5, 0, 0, 0.5));
});

function tryGateSequence(gates, maxHeight) {
    let pad = new Array(maxHeight - 1).fill(undefined);
    let cols = gates.
        filter(e => e !== Gates.Special.Measurement && e !== Gates.ErrorInjection && e.height <= maxHeight).
        map(e => new GateColumn([e, ...pad]));
    let c = new CircuitDefinition(maxHeight, cols);
    let stats = CircuitStats.fromCircuitAtTime(c, 0.1);
    assertThat(stats).isNotEqualTo(undefined);
}

// Try known gates, but in separate tests to avoid blowing the per-test time limit warning.
let knownGateStripes = 32;
for (let knownGateOffset of Seq.range(knownGateStripes)) {
    suite.testUsingWebGL(`try-known-gates-in-sequence-${knownGateOffset+1}-of-${knownGateStripes}`, () => {
        let stripe = seq(Gates.KnownToSerializer).
            skip(knownGateOffset).
            stride(knownGateStripes).
            toArray();
        tryGateSequence(stripe, 5);
    });
}

suite.testUsingWebGL("nested-addition-gate", () => {
    let circuitDef = Serializer.fromJson(
        CircuitDefinition,
        {cols:[[1,"X"],[1,"~f2fa"]],gates:[{id:"~f2fa",circuit:{cols:[["+=A1","inputA1"]]}}]});
    let stats = CircuitStats.fromCircuitAtTime(circuitDef, 0);
    let off = Matrix.square(1, 0, 0, 0);
    let on = Matrix.square(0, 0, 0, 1);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(off);
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(on);
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(off);
});

suite.testUsingWebGL('controlled-displays', () => {
    let c = circuit(`-H-•-@@-
                     ---X-⊕•-`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(5, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.qubitDensityMatrix(6, 0)).isApproximatelyEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.testUsingWebGL('incoherent-amplitude-display', () => {
    let c = circuit(`-H-•-a-
                     ---X---`, ['a', Gates.Displays.AmplitudeDisplayFamily.ofSize(1)]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.customStatsForSlot(5, 0)).isApproximatelyEqualTo({
        quality: 0.5,
        ket: Matrix.row(1, 0),
        phaseLockIndex: 0,
        incoherentKet: Matrix.row(Math.sqrt(0.5), Math.sqrt(0.5))
    });
});

suite.testUsingWebGL('coherent-amplitude-display', () => {
    let c = circuit(`-H-•-a/--
                     ---X-//--
                     -H-------`, ['a', Gates.Displays.AmplitudeDisplayFamily]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.customStatsForSlot(5, 0)).isApproximatelyEqualTo({
        quality: 1,
        ket: Matrix.square(1, 0, 0, 1).times(Math.sqrt(0.5)),
        incoherentKet: Matrix.square(1, 0, 0, 1).times(Math.sqrt(0.5)),
        phaseLockIndex: 0
    });
});

suite.testUsingWebGL('conditional-bloch-display', () => {
    let c = circuit(`-H-@-
                     -H-•-`);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.qubitDensityMatrix(3, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5));
    assertThat(stats.customStatsForSlot(3, 0)).isEqualTo(undefined);
});

suite.testUsingWebGL('probability-display', () => {
    let c = circuit(`-H-•-%-
                     ---X-/-`, ['%', Gates.Displays.ProbabilityDisplayFamily]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isApproximatelyEqualTo(Matrix.square(0.5, 0, 0, 0.5));
    assertThat(stats.customStatsForSlot(5, 0)).isApproximatelyEqualTo(
        Matrix.col(0.5, 0, 0, 0.5));
});

suite.testUsingWebGL('controlled-multi-probability-display', () => {
    let c = circuit(`---◦-
                     -H-%-
                     ---/-`, ['%', Gates.Displays.ProbabilityDisplayFamily]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.customStatsForSlot(3, 1)).isApproximatelyEqualTo(
        Matrix.col(0.5, 0.5, 0, 0));
});

suite.testUsingWebGL('density-display', () => {
    let c = circuit(`-d/-
                     -//-`, ['d', Gates.Displays.DensityMatrixDisplayFamily]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.customStatsForSlot(1, 0)).isApproximatelyEqualTo(
        Matrix.square(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0));
});

suite.testUsingWebGL('shifted-density-display', () => {
    let c = circuit(`----
                     -d/-
                     -//-`, ['d', Gates.Displays.DensityMatrixDisplayFamily]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.customStatsForSlot(1, 1)).isApproximatelyEqualTo(
        Matrix.square(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0));
});

suite.testUsingWebGL('16-qubit-hadamard-transform', () => {
    let stats = CircuitStats.fromCircuitAtTime(circuit(`-H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-
                                                        -H-`), 0);

    // This is a lot of values to check. Don't pay the cost of wrapping in assertThat.
    let buf = stats.finalState.rawBuffer();
    for (let i = 0; i*2 < buf.length; i++) {
        if (buf[i*2 + 1] !== 0) {
            assertThat(buf[i * 2 + 1]).withInfo({i}).isEqualTo(0);
        }
        if (Math.abs(buf[i * 2] * 256.0 - 1.0) > 0.00001) {
            assertThat(buf[i * 2]).withInfo({i}).isApproximatelyEqualTo(1/256);
        }
    }

    // Check densities.
    for (let i = 0; i < 16; i++) {
        assertThat(stats.qubitDensityMatrix(Infinity, i)).
            withInfo({i}).
            isApproximatelyEqualTo(Matrix.square(0.5, 0.5, 0.5, 0.5), 0.000001);
    }

    // And unity.
    assertThat(stats.survivalRate(Infinity)).isApproximatelyEqualTo(1, 0.0001);
});

suite.testUsingWebGL('survival-rates', () => {
    let stats = CircuitStats.fromCircuitAtTime(circuit(`-H-!-------
                                                        ---X-!-----
                                                        -------H-!-
                                                        -----------`), 0);

    assertThat(stats.survivalRate(-1)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(0)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(1)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(2)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(3)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(4)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(5)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(6)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(7)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(8)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(7)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(8)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(9)).isApproximatelyEqualTo(0.25);
    assertThat(stats.survivalRate(10)).isApproximatelyEqualTo(0.25);
    assertThat(stats.survivalRate(Infinity)).isApproximatelyEqualTo(0.25);
});

suite.testUsingWebGL('survival-rates-controlled-postselection', () => {
    let stats = CircuitStats.fromCircuitAtTime(circuit(`---•-H-•-!---•-
                                                        -X-!-X-X-•-X-!-`), 0);
    assertThat(stats.survivalRate(2)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(3)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(4)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(5)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(6)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(7)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(8)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(9)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(10)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(11)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(12)).isApproximatelyEqualTo(1);
    assertThat(stats.survivalRate(13)).isApproximatelyEqualTo(0.5);
    assertThat(stats.survivalRate(14)).isApproximatelyEqualTo(0.5);
});

suite.testUsingWebGL('dynamic-phase-gradient-keeps-qubits-coherent', () => {
    let stats = CircuitStats.fromCircuitAtTime(
        circuit(`-H-P-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-
                 -H-/-`, ['P', Gates.PhaseGradientGates.DynamicPhaseGradientFamily]),
        0.9);

    // Check coherence of each qubit.
    for (let i = 0; i < 16; i++) {
        let [x, y, z] = stats.qubitDensityMatrix(Infinity, i).qubitDensityMatrixToBlochVector();
        let r = x*x + y*y + z*z;
        assertThat(r).withInfo({i, x, y, z}).isApproximatelyEqualTo(1, 0.00001);
    }
});

suite.testUsingWebGL('classical-swap-with-quantum-control-does-not-fire', () => {
    // Swap should be disabled.
    let c = circuit(`-M-X-S-
                     -M---S-
                     ---X-•-`, ['S', Gates.Special.SwapHalf]);
    assertThat(c.gateAtLocIsDisabledReason(5, 0)).isNotEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 1)).isNotEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 2)).isEqualTo(undefined);

    // And swap should not have fired.
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(Matrix.square(0, 0, 0, 1));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(Matrix.square(1, 0, 0, 0));
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.testUsingWebGL('classical-swap-with-classical-control-does-fire', () => {
    // Swap should be disabled.
    let c = circuit(`-M-X-S-
                     -M---S-
                     -M-X-•-`, ['S', Gates.Special.SwapHalf]);
    assertThat(c.gateAtLocIsDisabledReason(5, 0)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 1)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 2)).isEqualTo(undefined);

    // And swap should not have fired.
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(Matrix.square(1, 0, 0, 0));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(Matrix.square(0, 0, 0, 1));
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.testUsingWebGL('classical-bit-rotate-with-quantum-control-does-not-fire', () => {
    // Bit rotation should be disabled.
    let c = circuit(`-M-X-<-
                     -M---/-
                     ---X-•-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    assertThat(c.gateAtLocIsDisabledReason(5, 0)).isNotEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 2)).isEqualTo(undefined);

    // And bit rotation should not fire.
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(Matrix.square(0, 0, 0, 1));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(Matrix.square(1, 0, 0, 0));
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.testUsingWebGL('classical-bit-rotate-with-classical-control-does-fire', () => {
    // Bit rotation should be disabled.
    let c = circuit(`-M-X-<-
                     -M---/-
                     -M-X-•-`, ['<', Gates.CycleBitsGates.CycleBitsFamily]);
    assertThat(c.gateAtLocIsDisabledReason(5, 0)).isEqualTo(undefined);
    assertThat(c.gateAtLocIsDisabledReason(5, 2)).isEqualTo(undefined);

    // And bit rotation should not fire.
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.qubitDensityMatrix(Infinity, 0)).isEqualTo(Matrix.square(1, 0, 0, 0));
    assertThat(stats.qubitDensityMatrix(Infinity, 1)).isEqualTo(Matrix.square(0, 0, 0, 1));
    assertThat(stats.qubitDensityMatrix(Infinity, 2)).isEqualTo(Matrix.square(0, 0, 0, 1));
});

suite.testUsingWebGL("initial_states", () => {
    let circuit = Serializer.fromJson(CircuitDefinition, {
        init: [0, 1, '+', '-', 'i', '-i'],
        cols: [],
    });
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0);
    assertThat(stats.qubitDensityMatrix(9, 0).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([0, 0, -1]);
    assertThat(stats.qubitDensityMatrix(9, 1).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([0, 0, +1]);
    assertThat(stats.qubitDensityMatrix(9, 2).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([-1, 0, 0]);
    assertThat(stats.qubitDensityMatrix(9, 3).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([+1, 0, 0]);
    assertThat(stats.qubitDensityMatrix(9, 4).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([0, +1, 0]);
    assertThat(stats.qubitDensityMatrix(9, 5).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo([0, -1, 0]);
});

suite.testUsingWebGL("distillation", () => {
    let c = circuit(
        `
        -X-X--X-X--X-X--X-X-------X-X--X-X-------X-X------------HTH-0-
        -X-X--X-X--X-X-------X-X--X-X-------X-X-------X-X-------HTH-0-
        -X-X--X-X-------X-X--X-X-------X-X--X-X------------X-X--HTH-0-
        -X-X-------X-X--X-X--X-X-----------------X-X--X-X--X-X--HTH-0-
        -X-X----------------------X-X--X-X--X-X--X-X--X-X--X-X--------
        -#T]--#T]--#T]--#T]--#T]--#T]--#T]--#T]--#T]--#T]--#T]--------
        `,
        [']', Gates.Detectors.XDetectControlClear],
        ['0', Gates.PostSelectionGates.PostSelectOff],
        ['#', Gates.Controls.XControl],
        ['T', Gates.OtherZ.Z4]);
    for (let i = 0; i < 5; i++) {
        let stats = CircuitStats.fromCircuitAtTime(c, 0);
        assertThat(stats.qubitDensityMatrix(Infinity, 4).qubitDensityMatrixToBlochVector()).isApproximatelyEqualTo(
            [0, Math.sqrt(0.5), -Math.sqrt(0.5)]);
        assertThat(stats.survivalRate(Infinity)).isApproximatelyEqualTo(1, 0.001);
    }
});

suite.testUsingWebGL("toReadableJson", () => {
    let c = circuit(
        `
        --%D
        H@/-
        `,
        ['%', Gates.Displays.ProbabilityDisplayFamily],
        ['D', Gates.Detectors.ZDetector]
    );
    let stats = CircuitStats.fromCircuitAtTime(c, 0.5);
    let json = stats.toReadableJson();
    assertThat(json).isApproximatelyEqualTo({
        circuit: Serializer.toJson(c),
        output_amplitudes: [
            {r: Math.sqrt(0.5), i: 0},
            {r: 0, i: 0},
            {r: Math.sqrt(0.5), i: 0},
            {r: 0, i: 0},
        ],
        time_parameter: 0.5,
        chance_of_surviving_to_each_column: [1, 1, 1, 1],
        computed_bloch_vectors_by_column_then_wire: [
            [null, null],
            [null, {x: +1, y: 0, z: 0}],
            [null, null],
            [null, null],
            [{x: 0, y: 0, z: +1}, {x: +1, y: 0, z: 0}],
        ],
        displays: [
            {
                location: {wire: 0, column: 2},
                type: {serialized_id: "Chance2", name: "Probability Display"},
                data: {probabilities: [0.5, 0, 0.5, 0]}
            },
            {
                location: {wire: 0, column: 3},
                type: {serialized_id: "ZDetector", name: "Z Axis Detector"},
                data: false
            }
        ]
    })
});
