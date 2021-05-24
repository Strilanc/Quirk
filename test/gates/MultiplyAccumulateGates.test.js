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
import {MultiplyAccumulateGates} from "../../src/gates/MultiplyAccumulateGates.js"
import {InputGates} from "../../src/gates/InputGates.js"
import {assertThatCircuitOutputsBasisKet, assertThatCircuitUpdateActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "../../src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("MultiplyAccumulateGates");

suite.testUsingWebGL('plus_AB', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(5, [new GateColumn([
                MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(2),
                undefined,
                InputGates.InputAFamily.ofSize(2),
                undefined,
                InputGates.InputBFamily.ofSize(1)])]),
            false),
        Matrix.generateTransition(32, i => {
            let a = (i>>2)&3;
            let b = (i>>4)&1;
            let t = i & 3;
            return (a<<2) | (b<<4) | ((t+a*b)&3);
        }));
});

suite.testUsingWebGL('minus_AB', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(5, [new GateColumn([
                InputGates.InputAFamily.ofSize(2),
                undefined,
                MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(2),
                undefined,
                InputGates.InputBFamily.ofSize(1)])]),
            false).output,
        Matrix.generateTransition(32, i => {
            let a = i&3;
            let b = (i>>4)&1;
            let t = (i>>2)&3;
            return a | (b<<4) | (((t-a*b)&3)<<2);
        }));
});

suite.testUsingWebGL('plus_big_AB', () => {
    let circuit = CircuitDefinition.fromTextDiagram(new Map([
        ['a', InputGates.SetA.withParam((1<<14)+1)],
        ['b', InputGates.SetB.withParam((1<<14)+1)],
        ['*', MultiplyAccumulateGates.MultiplyAddInputsFamily],
        ['-', undefined],
        ['/', null],
    ]), `-a-*-
         ---/-
         -b-/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-
         ---/-`);
    assertThatCircuitOutputsBasisKet(circuit, 1 + (2<<14));
});
