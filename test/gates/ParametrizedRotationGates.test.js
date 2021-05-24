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
import {CircuitStats} from "../../src/circuit/CircuitStats.js"
import {Complex} from "../../src/math/Complex.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Matrix} from "../../src/math/Matrix.js"

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

suite.testUsingWebGL('formulaic_formulas', () => {
    let f = (text, t) => CircuitStats.fromCircuitAtTime(CircuitDefinition.fromTextDiagram(new Map([
        ['H', Gates.HalfTurns.H],
        ['t', Gates.ParametrizedRotationGates.FormulaicRotationZ.withParam(text)],
        ['-', undefined],
    ]), 'Ht'), (t+1)/2).finalState.cell(0, 1).ln().imag / Math.PI;

    assertThat(f('0.5', 0.1)).isApproximatelyEqualTo(0.5);
    assertThat(f('0.5', 0.2)).isApproximatelyEqualTo(0.5);
    assertThat(f('t', 0.1)).isApproximatelyEqualTo(0.1);
    assertThat(f('t', 0.2)).isApproximatelyEqualTo(0.2);
    assertThat(f('t t', 0.1)).isApproximatelyEqualTo(0.1*0.1);
    assertThat(f('cos(pi t)', 1/3)).isApproximatelyEqualTo(0.5);
    assertThat(f('sin(pi t)', 1/3)).isApproximatelyEqualTo(Math.sqrt(3/4));
    assertThat(f('tan(t)', 1/3)).isApproximatelyEqualTo(Math.tan(1/3));

    assertThat(f('-t', 1/3)).isApproximatelyEqualTo(-1/3);
    assertThat(f('t+t', 1/3)).isApproximatelyEqualTo(2/3);
    assertThat(f('t*t', 1/3)).isApproximatelyEqualTo(1/9);
    assertThat(f('t-1', 1/3)).isApproximatelyEqualTo(-2/3);
    assertThat(f('t/2', 1/3)).isApproximatelyEqualTo(1/6);

    assertThat(f('ln(e)', 1/3)).isApproximatelyEqualTo(1);
    assertThat(f('sqrt(t)', 1/3)).isApproximatelyEqualTo(Math.sqrt(1/3));
    assertThat(f('acos(t)', 1/3)).isApproximatelyEqualTo(Math.acos(1/3)-2);
    assertThat(f('asin(t)', 1/3)).isApproximatelyEqualTo(Math.asin(1/3));
    assertThat(f('atan(t)', 1/3)).isApproximatelyEqualTo(Math.atan(1/3));
    assertThat(f('ln(t)', 1/3)).isApproximatelyEqualTo(Math.log(1/3)+2);
    assertThat(f('exp(t)', 1/3)).isApproximatelyEqualTo(Math.exp(1/3)-2);
});

suite.testUsingWebGL('formulaic_matrices', () => {
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationZ.withParam('0.5').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(1, 0, 0, Complex.I));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationZ.withParam('t').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(1, 0, 0, Complex.I));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationZ.withParam('t').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(1, 0, 0, -1));

    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRz.withParam('0.5 pi').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(Complex.polar(1, -Math.PI/4), 0, 0, Complex.polar(1, Math.PI/4)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRz.withParam('t pi').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(Complex.polar(1, -Math.PI/4), 0, 0, Complex.polar(1, Math.PI/4)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRz.withParam('t pi').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(Complex.I.neg(), 0, 0, Complex.I));

    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationX.withParam('0.5').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(
            new Complex(0.5, 0.5), new Complex(0.5, -0.5),
            new Complex(0.5, -0.5), new Complex(0.5, 0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationX.withParam('t').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(
            new Complex(0.5, 0.5), new Complex(0.5, -0.5),
            new Complex(0.5, -0.5), new Complex(0.5, 0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationX.withParam('t').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(0, 1, 1, 0));

    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRx.withParam('0.5 pi').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(
            1, Complex.I.neg(),
            Complex.I.neg(), 1).times(Math.sqrt(0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRx.withParam('t pi').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(
            1, Complex.I.neg(),
            Complex.I.neg(), 1).times(Math.sqrt(0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRx.withParam('t pi').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(0, Complex.I.neg(), Complex.I.neg(), 0));

    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationY.withParam('0.5').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(
            new Complex(0.5, 0.5), new Complex(-0.5, -0.5),
            new Complex(0.5, 0.5), new Complex(0.5, 0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationY.withParam('t').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(
            new Complex(0.5, 0.5), new Complex(-0.5, -0.5),
            new Complex(0.5, 0.5), new Complex(0.5, 0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationY.withParam('t').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(0, Complex.I.neg(), Complex.I, 0));

    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRy.withParam('0.5 pi').knownMatrixAt(0.1)
        ).isApproximatelyEqualTo(Matrix.square(
            1, -1,
            1, 1).times(Math.sqrt(0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRy.withParam('t pi').knownMatrixAt(0.75)
        ).isApproximatelyEqualTo(Matrix.square(
            1, -1,
            1, 1).times(Math.sqrt(0.5)));
    assertThat(Gates.ParametrizedRotationGates.FormulaicRotationRy.withParam('t pi').knownMatrixAt(1)
        ).isApproximatelyEqualTo(Matrix.square(0, -1, 1, 0));
});
