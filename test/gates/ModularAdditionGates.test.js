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
import {assertThatGateActsLikePermutation, assertThatCircuitOutputsBasisKet} from "../CircuitOperationTestUtil.js"

import {ModularAdditionGates} from "../../src/gates/ModularAdditionGates.js"
import {InputGates} from "../../src/gates/InputGates.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {Util} from "../../src/base/Util.js"

let suite = new Suite("ModularAdditionGates");

suite.testUsingWebGL('plus_A_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? (t + a) % b : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [3, 2]);
});

suite.testUsingWebGL('minus_A_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [3, 2]);
});

suite.testUsingWebGL('plus_A_mod_R_no_nan', () => {
    let circuit = CircuitDefinition.fromTextDiagram(new Map([
        ['a', InputGates.SetA.withParam(0)],
        ['r', InputGates.SetR.withParam(33)],
        ['p', ModularAdditionGates.PlusAModRFamily],
        ['-', undefined],
        ['/', null],
    ]), `-a-p-
         ---/-
         -r-/-
         ---/-
         ---/-
         ---/-`);
    assertThatCircuitOutputsBasisKet(circuit, 0);
});
