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
import {Gates} from "../../src/gates/AllGates.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {modularMultiply, modularUnmultiply} from "../../src/gates/ModularMultiplicationGates.js"
import {assertThatGateActsLikePermutation, assertThatCircuitOutputsBasisKet} from "../CircuitOperationTestUtil.js"

let suite = new Suite("MultiplicationGates");

suite.testUsingWebGL('multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAFamily.ofSize(4),
        (x, a) => modularMultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAFamily.ofSize(2),
        (x, a) => modularMultiply(x, a, 1<<2),
        [4]);
});

suite.testUsingWebGL('inverse_multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAInverseFamily.ofSize(4),
        (x, a) => modularUnmultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAInverseFamily.ofSize(2),
        (x, a) => modularUnmultiply(x, a, 1<<2),
        [4]);
});

suite.testUsingWebGL('times_big_A', () => {
    let circuit = CircuitDefinition.fromTextDiagram(new Map([
        ['a', Gates.InputGates.SetA.withParam(16385)],
        ['*', Gates.MultiplicationGates.TimesAFamily],
        ['X', Gates.HalfTurns.X],
        ['-', undefined],
        ['/', null],
    ]), `-a-X-*-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         ---X-/-
         -----/-
         -----/-`);
    assertThatCircuitOutputsBasisKet(circuit, 24577);
});
