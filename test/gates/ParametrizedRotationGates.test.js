// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {assertThat, Suite} from "test/TestUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Complex} from "src/math/Complex.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("ParametrizedRotationGates");

let evalTopQubit = diagram => CircuitStats.fromCircuitAtTime(CircuitDefinition.fromTextDiagram(new Map([
    ['1', Gates.HalfTurns.X],
    ['H', Gates.HalfTurns.H],
    ['X', Gates.ParametrizedRotationGates.XToA],
    ['Y', Gates.ParametrizedRotationGates.YToA],
    ['Z', Gates.ParametrizedRotationGates.ZToA],
    ['x', Gates.ParametrizedRotationGates.XToMinusA],
    ['y', Gates.ParametrizedRotationGates.YToMinusA],
    ['z', Gates.ParametrizedRotationGates.ZToMinusA],
    ['A', Gates.InputGates.InputAFamily],
    ['-', undefined],
    ['/', null],
]), diagram), 0).qubitDensityMatrix(Infinity, 0);

function state(...row) {
    let v = Matrix.row(...row);
    return v.adjoint().times(v).times(1/v.norm2());
}

suite.testUsingWebGL('XToA', () => {
    assertThat(evalTopQubit(`--X-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 0));

    assertThat(evalTopQubit(`--XX-
                             --AA-
                             --//-
                             1-//-`)).isApproximatelyEqualTo(state(0, 1));

    assertThat(evalTopQubit(`--X-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.XForward.knownMatrixAt(1/4).getColumn(0)),
                                 0.0001);

    assertThat(evalTopQubit(`1-X-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.XForward.knownMatrixAt(1/4).getColumn(1)),
                                 0.0001);

    assertThat(evalTopQubit(`--X-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.XForward.knownMatrixAt(5/16).getColumn(0)),
                                 0.0001);
});

suite.testUsingWebGL('YToA', () => {
    assertThat(evalTopQubit(`--Y-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 0));

    assertThat(evalTopQubit(`--YY-
                             --AA-
                             --//-
                             1-//-`)).isApproximatelyEqualTo(state(0, 1));

    assertThat(evalTopQubit(`--Y-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.YForward.knownMatrixAt(1/4).getColumn(0)),
                                 0.0001);

    assertThat(evalTopQubit(`--Y-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.YForward.knownMatrixAt(5/16).getColumn(0)),
                                 0.0001);
});

suite.testUsingWebGL('ZToA', () => {
    assertThat(evalTopQubit(`H-Z-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 1));

    assertThat(evalTopQubit(`H-Z-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(state(1, Complex.polar(1, Math.PI/2)), 0.0001);

    assertThat(evalTopQubit(`H-ZZ-
                             --AA-
                             --//-
                             1-//-`)).isApproximatelyEqualTo(state(1, -1), 0.0001);

    assertThat(evalTopQubit(`H-Z-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(state(1, Complex.polar(1, Math.PI*5/8)), 0.0001);
});

suite.testUsingWebGL('XToMinusA', () => {
    assertThat(evalTopQubit(`--x-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 0));

    assertThat(evalTopQubit(`--x-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.XForward.knownMatrixAt(3/4).getColumn(0)),
                                 0.0001);

    assertThat(evalTopQubit(`--x-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.XForward.knownMatrixAt(11/16).getColumn(0)),
                                 0.0001);
});

suite.testUsingWebGL('YToMinusA', () => {
    assertThat(evalTopQubit(`--y-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 0));

    assertThat(evalTopQubit(`--y-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.YForward.knownMatrixAt(3/4).getColumn(0)),
                                 0.0001);

    assertThat(evalTopQubit(`--y-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(
                                 state(...Gates.Powering.YForward.knownMatrixAt(11/16).getColumn(0)),
                                 0.0001);
});

suite.testUsingWebGL('ZToMinusA', () => {
    assertThat(evalTopQubit(`H-z-
                             --A-
                             --/-
                             --/-`)).isApproximatelyEqualTo(state(1, 1));

    assertThat(evalTopQubit(`H-z-
                             --A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(state(1, Complex.polar(1, Math.PI*3/2)), 0.0001);

    assertThat(evalTopQubit(`H-z-
                             1-A-
                             --/-
                             1-/-`)).isApproximatelyEqualTo(state(1, Complex.polar(1, Math.PI*11/8)), 0.0001);
});
