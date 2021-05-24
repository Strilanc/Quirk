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
import {Gates} from "../../src/gates/AllGates.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js";
import {CircuitStats} from "../../src/circuit/CircuitStats.js";
import {Matrix} from "../../src/math/Matrix.js";

let suite = new Suite("Detector");

const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ...extras,
    ['-', undefined],
    ['●', Gates.Controls.Control],
    ['D', Gates.Detectors.ZDetector],
    ['X', Gates.HalfTurns.X],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
]), diagram);

suite.testUsingWebGL("guaranteed-clicks", () => {
    let c = CircuitStats.fromCircuitAtTime(circuit(`
        -X-D-
        ---D-
    `), 0);
    assertThat(c.customStatsForSlot(3, 0)).isEqualTo(true);
    assertThat(c.customStatsForSlot(3, 1)).isEqualTo(false);
});

suite.testUsingWebGL("collapse-clicks", () => {
    let c = CircuitStats.fromCircuitAtTime(circuit(`
        -H-D-
        -H-D-
    `), 0);
    let a = c.customStatsForSlot(3, 0);
    let b = c.customStatsForSlot(3, 1);
    assertThat(c.qubitDensityMatrix(Infinity, 0).cell(0, 0)).isEqualTo(a ? 0 : 1);
    assertThat(c.qubitDensityMatrix(Infinity, 1).cell(0, 0)).isEqualTo(b ? 0 : 1);
});

suite.testUsingWebGL("guaranteed-agreement", () => {
    let c = CircuitStats.fromCircuitAtTime(circuit(`
        -H-●-D-
        ---X-D-
    `), 0);
    let a = c.customStatsForSlot(5, 0);
    let b = c.customStatsForSlot(5, 1);
    assertThat(a).isEqualTo(b);
    // And it collapsed the state.
    assertThat(c.qubitDensityMatrix(Infinity, 0).cell(0, 0)).isEqualTo(a ? 0 : 1);
    assertThat(c.qubitDensityMatrix(Infinity, 1).cell(0, 0)).isEqualTo(b ? 0 : 1);
});

suite.testUsingWebGL("guaranteed-control-clicks", () => {
    let c = CircuitStats.fromCircuitAtTime(circuit(`
        ---●---
        -X-D-D-
        -X---●-
    `), 0);
    assertThat(c.customStatsForSlot(3, 1)).isEqualTo(false);
    assertThat(c.customStatsForSlot(5, 1)).isEqualTo(true);
});

suite.testUsingWebGL("collapsed-control-clicks", () => {
    for (let i = 0; i < 10; i++) {
        let c = CircuitStats.fromCircuitAtTime(circuit(`
        -H-●-
        -H-D-
    `), 0);
        let a = c.customStatsForSlot(3, 1);
        if (a) {
            assertThat(c.finalState).isApproximatelyEqualTo(Matrix.col(0, 0, 0, 1));
        } else {
            let s = Math.sqrt(1 / 3);
            assertThat(c.finalState).isApproximatelyEqualTo(Matrix.col(s, s, s, 0));
        }
    }
});

suite.testUsingWebGL("renormalizes", () => {
    // Doesn't decrease survival probability.
    let c = circuit(
        '-]-D-]-D-]-D-]-',
        [']', Gates.Detectors.XDetector],
        ['0', Gates.PostSelectionGates.PostSelectOff]);
    let stats = CircuitStats.fromCircuitAtTime(c, 0);
    assertThat(stats.survivalRate(Infinity)).isApproximatelyEqualTo(1, 0.001);

    // Renormalization doesn't increase survival probability.
    let c2 = circuit(
        '-]-0-D-]-D-]-D-]-',
        [']', Gates.Detectors.XDetector],
        ['0', Gates.PostSelectionGates.PostSelectOff]);
    let stats2 = CircuitStats.fromCircuitAtTime(c2, 0);
    assertThat(stats2.survivalRate(Infinity)).isApproximatelyEqualTo(0.5, 0.001);
});
