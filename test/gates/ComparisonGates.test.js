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
import {ComparisonGates} from "../../src/gates/ComparisonGates.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "../../src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {Matrix} from "../../src/math/Matrix.js"

let suite = new Suite("ComparisonGates");

const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ...extras,
    ['-', undefined],
    ['/', null],
    ['A', Gates.InputGates.InputAFamily],
    ['B', Gates.InputGates.InputBFamily],
    ['•', Gates.Controls.Control],
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
]), diagram);

suite.testUsingWebGL('A_less_than_B', () => {
    let circ = circuit(`-<-
                        ---
                        -A-
                        -/-
                        -B-
                        -/-`, ['<', ComparisonGates.ALessThanB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 2) & 3;
            let b = (i >> 4) & 3;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_larger_B', () => {
    let circ = circuit(`-<-
                        -A-
                        -/-
                        -B-
                        -/-
                        -/-`, ['<', ComparisonGates.ALessThanB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 7;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_smaller_B', () => {
    let circ = circuit(`-<-
                        -A-
                        -/-
                        -/-
                        -B-
                        -/-`, ['<', ComparisonGates.ALessThanB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<6, i => {
            let a = (i >> 1) & 7;
            let b = (i >> 4) & 3;
            let t = (i & 1) ^ (a < b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_less_than_or_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ComparisonGates.ALessThanOrEqualToB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a <= b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_greater_than_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ComparisonGates.AGreaterThanB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a > b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_greater_than_or_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ComparisonGates.AGreaterThanOrEqualToB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a >= b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ComparisonGates.AEqualToB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a === b ? 1 : 0);
            return t | (i & ~1)
        }));
});

suite.testUsingWebGL('A_not_equal_to_B', () => {
    let circ = circuit(`-?-
                        -A-
                        -/-
                        -B-
                        -/-`, ['?', ComparisonGates.ANotEqualToB]);
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, circ, false),
        Matrix.generateTransition(1<<5, i => {
            let a = (i >> 1) & 3;
            let b = (i >> 3) & 3;
            let t = (i & 1) ^ (a !== b ? 1 : 0);
            return t | (i & ~1)
        }));
});
