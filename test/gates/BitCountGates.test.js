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
import {BitCountGates} from "../../src/gates/BitCountGates.js"
import {InputGates} from "../../src/gates/InputGates.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "../CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "../../src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {Matrix} from "../../src/math/Matrix.js"
import {Util} from "../../src/base/Util.js"

let suite = new Suite("BitCountGates");

let GATE_SET = new Map([
    ['A', InputGates.InputAFamily],
    ['-', undefined],
    ['/', null],
    ['P', BitCountGates.PlusBitCountAFamily],
    ['M', BitCountGates.MinusBitCountAFamily]
]);

suite.testUsingWebGL('PlusBitCountA', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            CircuitDefinition.fromTextDiagram(GATE_SET,
                `-A-
                 -/-
                 -/-
                 -P-
                 -/-`),
            false),
        Matrix.generateTransition(1<<5, i => {
            let a = i & 7;
            let t = (i >> 3) & 3;
            t += Util.numberOfSetBits(a);
            t &= 3;
            return a | (t << 3);
        }));
});

suite.testUsingWebGL('MinusBitCountA', () => {
    assertThatCircuitUpdateActsLikeMatrix(
            ctx => advanceStateWithCircuit(
            ctx,
            CircuitDefinition.fromTextDiagram(GATE_SET,
                `-A-
                 -/-
                 -/-
                 -M-
                 -/-`),
            false),
        Matrix.generateTransition(1<<5, i => {
            let a = i & 7;
            let t = (i >> 3) & 3;
            t -= Util.numberOfSetBits(a);
            t &= 3;
            return a | (t << 3);
        }));
});
