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
import {assertThatCircuitOutputsBasisKet} from "../CircuitOperationTestUtil.js"

import {PivotFlipGates} from "../../src/gates/PivotFlipGates.js"
import {Gates} from "../../src/gates/AllGates.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"

let suite = new Suite("PivotFlipGates");

suite.testUsingWebGL('pivot_flip', () => {
    let circ = diagram => CircuitDefinition.fromTextDiagram(new Map([
        ['5', Gates.InputGates.SetA.withParam(5)],
        ['X', Gates.HalfTurns.X],
        ['F', PivotFlipGates.FlipUnderA],
        ['-', undefined],
        ['/', null],
    ]), diagram);

    assertThatCircuitOutputsBasisKet(circ(`-5-F-
                                           ---/-
                                           ---/-
                                           ---/-`), 4);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -----/-
                                           -----/-`), 3);

    assertThatCircuitOutputsBasisKet(circ(`---5-F-
                                           -X---/-
                                           -----/-
                                           -----/-`), 2);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -X---/-
                                           -----/-
                                           -----/-`), 1);

    assertThatCircuitOutputsBasisKet(circ(`---5-F-
                                           -----/-
                                           -X---/-
                                           -----/-`), 0);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -X---/-
                                           -----/-`), 5);

    assertThatCircuitOutputsBasisKet(circ(`-X-5-F-
                                           -----/-
                                           -X---/-
                                           -X---/-`), 13);
});
