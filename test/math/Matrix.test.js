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

import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "../TestUtil.js"
import {Matrix} from "../../src/math/Matrix.js"

import {Complex} from "../../src/math/Complex.js"
import {Controls} from "../../src/circuit/Controls.js"
import {Format} from "../../src/base/Format.js"
import {Seq} from "../../src/base/Seq.js"

let suite = new Suite("Matrix");

suite.test("isEqualTo", () => {
    let m = Matrix.fromRows([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]);
    assertThat(m).isEqualTo(m);
    assertThat(m).isNotEqualTo(null);
    assertThat(m).isNotEqualTo("");

    assertThat(m).isEqualTo(
        Matrix.fromRows([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        Matrix.fromRows([[new Complex(2, 3)]]));
    assertThat(m).isNotEqualTo(
        Matrix.fromRows([[new Complex(-2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        Matrix.fromRows([[new Complex(2, 3), new Complex(-5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        Matrix.fromRows([[new Complex(2, 3), new Complex(5, 7)], [new Complex(-11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        Matrix.fromRows([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(-17, 19)]]));

    let col = Matrix.fromRows([[new Complex(2, 3), new Complex(5, 7)]]);
    let row = Matrix.fromRows([[new Complex(2, 3)], [new Complex(5, 7)]]);
    assertThat(col).isEqualTo(col);
    assertThat(row).isEqualTo(row);
    assertThat(row).isNotEqualTo(col);
});

suite.test("isApproximatelyEqualTo", () => {
    // Size must match
    assertThat(Matrix.row(1, 1)).isNotApproximatelyEqualTo(Matrix.col(1, 1), 0);
    assertThat(Matrix.row(1, 1)).isNotApproximatelyEqualTo(Matrix.square(1, 1, 1, 1), 0);
    assertThat(Matrix.row(1, 1)).isNotApproximatelyEqualTo(Matrix.row(1, 1, 1), 0);
    assertThat(Matrix.row(1, 1)).isApproximatelyEqualTo(Matrix.row(1, 1), 0);

    // Error bound matters
    assertThat(Matrix.solo(1)).isApproximatelyEqualTo(Matrix.solo(1), 0);
    assertThat(Matrix.solo(1)).isApproximatelyEqualTo(Matrix.solo(1), 1/4);
    assertThat(Matrix.solo(1.25)).isApproximatelyEqualTo(Matrix.solo(1), 1/4);
    assertThat(Matrix.solo(0.75)).isApproximatelyEqualTo(Matrix.solo(1), 1/4);
    assertThat(Matrix.solo(1.26)).isNotApproximatelyEqualTo(Matrix.solo(1), 1/4);
    assertThat(Matrix.solo(0.74)).isNotApproximatelyEqualTo(Matrix.solo(1), 1/4);

    // Error bound spreads
    assertThat(Matrix.row(0, 0)).isApproximatelyEqualTo(Matrix.row(0, 0), 1);
    assertThat(Matrix.row(1, 0)).isApproximatelyEqualTo(Matrix.row(0, 0), 1);
    assertThat(Matrix.row(0, 1)).isApproximatelyEqualTo(Matrix.row(0, 0), 1);
    assertThat(Matrix.row(1, 1)).isNotApproximatelyEqualTo(Matrix.row(0, 0), 1);

    assertThat(Matrix.solo(0)).isNotApproximatelyEqualTo(null);
    assertThat(Matrix.solo(0)).isNotApproximatelyEqualTo("");
});

suite.test("toString", () => {
    assertThat(Matrix.solo(2).toString()).
        isEqualTo("{{2}}");
    assertThat(Matrix.square(1, 0, new Complex(0, -1), new Complex(2, -3)).toString()).
        isEqualTo("{{1, 0}, {-i, 2-3i}}");
    assertThat(Matrix.square(1, 0, 0, 1).toString()).
        isEqualTo("{{1, 0}, {0, 1}}");
    assertThat(Matrix.identity(3).toString()).
        isEqualTo("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}");

    assertThat(Matrix.square(0, 1, new Complex(1/3, 1), new Complex(0, 1/3 + 0.0000001)).toString(Format.EXACT)).
        isEqualTo("{{0, 1}, {\u2153+i, 0.3333334333333333i}}");
    assertThat(Matrix.square(0, 1, new Complex(1/3, 1), new Complex(0, 1/3 + 0.0000001)).toString(Format.SIMPLIFIED)).
        isEqualTo("{{0, 1}, {\u2153+i, \u2153i}}");
    assertThat(Matrix.square(0, 1, new Complex(1/3, 1), new Complex(0, 1/3 + 0.0000001)).toString(Format.MINIFIED)).
        isEqualTo("{{0,1},{\u2153+i,0.3333334333333333i}}");
    assertThat(Matrix.square(0, 1, new Complex(1/3, 1), new Complex(0, 1/3 + 0.0000001)).toString(Format.CONSISTENT)).
        isEqualTo("{{+0.00+0.00i, +1.00+0.00i}, {+0.33+1.00i, +0.00+0.33i}}");
});

suite.test("parse", () => {
    assertThat(Matrix.parse("{{1}}")).isEqualTo(
        Matrix.solo(1));
    assertThat(Matrix.parse("{{i}}")).isEqualTo(
        Matrix.solo(Complex.I));
    assertThat(Matrix.parse("{{\u221A2}}")).isEqualTo(
        Matrix.square(Math.sqrt(2)));

    assertThat(Matrix.parse("{{½-½i, 5}, {-i, 0}}")).isEqualTo(
        Matrix.square(new Complex(0.5, -0.5), 5, new Complex(0, -1), 0));
    assertThat(Matrix.parse("{{1, 2, i}}")).isEqualTo(
        Matrix.row(1, 2, Complex.I));
    assertThat(Matrix.parse("{{1}, {2}, {i}}")).isEqualTo(
        Matrix.col(1, 2, Complex.I));
});

suite.test("generate", () => {
    assertThat(Matrix.generate(3, 2, (r, c) => r + 10* c).toString()).
        isEqualTo("{{0, 10, 20}, {1, 11, 21}}");
});

suite.test("generateDiagonal", () => {
    assertThat(Matrix.generateDiagonal(4, e => new Complex(e, 1))).
        isEqualTo(Matrix.square(
            new Complex(0, 1), 0, 0, 0,
            0, new Complex(1, 1), 0, 0,
            0, 0, new Complex(2, 1), 0,
            0, 0, 0, new Complex(3, 1)));
});

suite.test("generateTransition", () => {
    assertThat(Matrix.generateTransition(4, e => (e + 1) & 3)).
        isEqualTo(Matrix.square(
            0, 0, 0, 1,
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0));
});

suite.test("zero", () => {
    assertThat(Matrix.zero(1, 1).toString()).isEqualTo("{{0}}");
    assertThat(Matrix.zero(2, 1).toString()).isEqualTo("{{0, 0}}");
    assertThat(Matrix.zero(1, 2).toString()).isEqualTo("{{0}, {0}}");
    assertThat(Matrix.zero(2, 2).toString()).isEqualTo("{{0, 0}, {0, 0}}");
});

suite.test("getColumn", () => {
    let m = Matrix.square(2, 3, 5, 7);
    assertThat(m.getColumn(0)).isEqualTo([2, 5]);
    assertThat(m.getColumn(1)).isEqualTo([3, 7]);
    assertThat(Matrix.col(1, 2, 3).getColumn(0)).isEqualTo([1, 2, 3]);
});

suite.test("square", () => {
    let m = Matrix.square(1, new Complex(2, 3), -5.5, 0);
    assertThat(m.rows()).isEqualTo([[1, new Complex(2, 3)], [-5.5, 0]]);

    assertThat(Matrix.solo(1).rows()).isEqualTo([[1]]);
});

suite.test("col", () => {
    assertThat(Matrix.col(2, 3, new Complex(0, 5)).toString()).isEqualTo("{{2}, {3}, {5i}}");
});

suite.test("row", () => {
    assertThat(Matrix.row(2, 3, new Complex(0, 5)).toString()).isEqualTo("{{2, 3, 5i}}");
});

suite.test("size", () => {
    assertThat(Matrix.row(1, 1).width()).isEqualTo(2);
    assertThat(Matrix.row(1, 1).height()).isEqualTo(1);

    assertThat(Matrix.row(1, 1, 3).width()).isEqualTo(3);
    assertThat(Matrix.row(1, 1, 3).height()).isEqualTo(1);

    assertThat(Matrix.col(1, 1).width()).isEqualTo(1);
    assertThat(Matrix.col(1, 1).height()).isEqualTo(2);

    assertThat(Matrix.col(1, 1, 3).width()).isEqualTo(1);
    assertThat(Matrix.col(1, 1, 3).height()).isEqualTo(3);
});

suite.test("isUnitary", () => {
    assertFalse(Matrix.row(1, 1).isUnitary(999));
    assertFalse(Matrix.col(1, 1).isUnitary(999));

    assertTrue(Matrix.solo(1).isUnitary(0));
    assertTrue(Matrix.solo(Complex.I).isUnitary(0));
    assertTrue(Matrix.solo(-1).isUnitary(0));
    assertFalse(Matrix.solo(-2).isUnitary(0));
    assertFalse(Matrix.solo(0).isUnitary(0));
    assertTrue(Matrix.solo(-2).isUnitary(999));

    assertTrue(Matrix.square(1, 0, 0, 1).isUnitary(0));
    assertTrue(Matrix.rotation(1).isUnitary(0.001));
    assertTrue(Matrix.PAULI_X.isUnitary(0));
    assertTrue(Matrix.PAULI_Y.isUnitary(0));
    assertTrue(Matrix.PAULI_Z.isUnitary(0));
    assertTrue(Matrix.HADAMARD.isUnitary(0.001));
});

suite.test("isApproximatelyHermitian", () => {
    let i = Complex.I;

    assertFalse(Matrix.row(1, 1).isApproximatelyHermitian(999));
    assertFalse(Matrix.col(1, 1).isApproximatelyHermitian(999));

    assertTrue(Matrix.solo(1).isApproximatelyHermitian(0));
    assertTrue(Matrix.solo(0).isApproximatelyHermitian(0));
    assertTrue(Matrix.solo(-1).isApproximatelyHermitian(0));
    assertTrue(Matrix.solo(-2).isApproximatelyHermitian(0));
    assertFalse(Matrix.solo(i).isApproximatelyHermitian(0));
    assertFalse(Matrix.solo(i).isApproximatelyHermitian(0.5));
    assertTrue(Matrix.solo(i).isApproximatelyHermitian(999));

    assertTrue(Matrix.PAULI_X.isApproximatelyHermitian(0));
    assertTrue(Matrix.PAULI_Y.isApproximatelyHermitian(0));
    assertTrue(Matrix.PAULI_Z.isApproximatelyHermitian(0));
    assertTrue(Matrix.HADAMARD.isApproximatelyHermitian(0.001));

    assertTrue(Matrix.square(1, 0, 0, 1).isApproximatelyHermitian(0));
    assertTrue(Matrix.square(1, 1, 1, 1).isApproximatelyHermitian(0));
    assertFalse(Matrix.square(1, 1, 1.5, 1).isApproximatelyHermitian(0));
    assertTrue(Matrix.square(1, 1, 1.5, 1).isApproximatelyHermitian(0.5));

    assertFalse(Matrix.square(1, i, i, 1).isApproximatelyHermitian(0));
    assertTrue(Matrix.square(1, i, i.neg(), 1).isApproximatelyHermitian(0));
    assertTrue(Matrix.square(1, i.neg(), i, 1).isApproximatelyHermitian(0));
    assertFalse(Matrix.square(1, i, i.times(-1.5), 1).isApproximatelyHermitian(0));
    assertTrue(Matrix.square(1, i, i.times(-1.5), 1).isApproximatelyHermitian(0.5));
});

suite.test("isIdentity", () => {
    let i = Complex.I;

    assertFalse(Matrix.solo(NaN).isIdentity());
    assertFalse(Matrix.solo(-1).isIdentity());
    assertFalse(Matrix.solo(0).isIdentity());
    assertTrue(Matrix.solo(1).isIdentity());
    assertFalse(Matrix.solo(i).isIdentity());
    assertFalse(Matrix.solo(2).isIdentity());

    assertFalse(Matrix.row(1, 0).isIdentity());
    assertFalse(Matrix.row(1, 1).isIdentity());
    assertFalse(Matrix.col(1, 0).isIdentity());
    assertFalse(Matrix.col(1, 1).isIdentity());

    assertFalse(Matrix.PAULI_X.isIdentity());
    assertFalse(Matrix.PAULI_Y.isIdentity());
    assertFalse(Matrix.PAULI_Z.isIdentity());
    assertFalse(Matrix.HADAMARD.isIdentity());

    assertTrue(Matrix.square(1, 0, 0, 1).isIdentity());
    assertFalse(Matrix.square(1, 1, 1, 1).isIdentity());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isIdentity());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isIdentity());
    assertFalse(Matrix.square(1, i, i, 1).isIdentity());
    assertFalse(Matrix.square(1, i, i.neg(), 1).isIdentity());

    assertTrue(Matrix.square(1, 0, 0, 0, 1, 0, 0, 0, 1).isIdentity());
});

suite.test("isScaler", () => {
    let i = Complex.I;

    assertFalse(Matrix.solo(NaN).isScaler());
    assertTrue(Matrix.solo(-1).isScaler());
    assertTrue(Matrix.solo(0).isScaler());
    assertTrue(Matrix.solo(1).isScaler());
    assertTrue(Matrix.solo(i).isScaler());
    assertTrue(Matrix.solo(2).isScaler());

    assertFalse(Matrix.row(1, 0).isScaler());
    assertFalse(Matrix.row(1, 1).isScaler());
    assertFalse(Matrix.col(1, 0).isScaler());
    assertFalse(Matrix.col(1, 1).isScaler());

    assertFalse(Matrix.PAULI_X.isScaler());
    assertFalse(Matrix.PAULI_Y.isScaler());
    assertFalse(Matrix.PAULI_Z.isScaler());
    assertFalse(Matrix.HADAMARD.isScaler());

    assertTrue(Matrix.square(1, 0, 0, 1).isScaler());
    assertTrue(Matrix.square(-1, 0, 0, -1).isScaler());
    assertTrue(Matrix.square(i, 0, 0, i).isScaler());
    assertFalse(Matrix.square(1, 1, 1, 1).isScaler());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isScaler());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isScaler());
    assertFalse(Matrix.square(1, i, i, 1).isScaler());
    assertFalse(Matrix.square(1, i, i.neg(), 1).isScaler());

    assertTrue(Matrix.square(1, 0, 0, 0, 1, 0, 0, 0, 1).isScaler());
    assertTrue(Matrix.square(i, 0, 0, 0, i, 0, 0, 0, i).isScaler());
    assertFalse(Matrix.square(i, 0, 0, 0, 1, 0, 0, 0, i).isScaler());
});

suite.test("isPhasedPermutation", () => {
    let i = Complex.I;

    assertTrue(Matrix.solo(-1).isPhasedPermutation());
    assertTrue(Matrix.solo(0).isPhasedPermutation());
    assertTrue(Matrix.solo(1).isPhasedPermutation());
    assertTrue(Matrix.solo(i).isPhasedPermutation());
    assertTrue(Matrix.solo(2).isPhasedPermutation());

    assertFalse(Matrix.row(1, 0).isPhasedPermutation());
    assertFalse(Matrix.row(1, 1).isPhasedPermutation());
    assertFalse(Matrix.col(1, 0).isPhasedPermutation());
    assertFalse(Matrix.col(1, 1).isPhasedPermutation());

    assertTrue(Matrix.PAULI_X.isPhasedPermutation());
    assertTrue(Matrix.PAULI_Y.isPhasedPermutation());
    assertTrue(Matrix.PAULI_Z.isPhasedPermutation());
    assertFalse(Matrix.HADAMARD.isPhasedPermutation());

    assertTrue(Matrix.square(1, 0, 0, 1).isPhasedPermutation());
    assertFalse(Matrix.square(1, 1, 1, 1).isPhasedPermutation());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isPhasedPermutation());
    assertFalse(Matrix.square(1, 1, 1.5, 1).isPhasedPermutation());
    assertFalse(Matrix.square(1, i, i, 1).isPhasedPermutation());
    assertFalse(Matrix.square(1, i, i.neg(), 1).isPhasedPermutation());

    assertTrue(Matrix.square(1, 0, 0, 0, 1, 0, 0, 0, 1).isPhasedPermutation());
    assertTrue(Matrix.square(1, 0, 0, 0, 0, i, 0, 1, 0).isPhasedPermutation());

    assertFalse(Matrix.square(1, 0.1, 0, 1).isPhasedPermutation(0));
    assertFalse(Matrix.square(1, 0.1, 0, 1).isPhasedPermutation(0.05));
    assertTrue(Matrix.square(1, 0.1, 0, 1).isPhasedPermutation(0.2));

    assertTrue(Matrix.solo(NaN).isPhasedPermutation());
    assertFalse(Matrix.square(NaN, NaN, NaN, NaN).isPhasedPermutation());
    assertTrue(Matrix.square(NaN, 0, 0, NaN).isPhasedPermutation());
});

suite.test("adjoint", () => {
    let v = Matrix.square(new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19));
    let a = Matrix.square(new Complex(2, -3), new Complex(11, -13),
                          new Complex(5, -7), new Complex(17, -19));
    assertThat(v.adjoint()).isEqualTo(a);
    assertThat(Matrix.col(1, 2, Complex.I).adjoint()).isEqualTo(Matrix.row(1, 2, Complex.I.neg()));
});

suite.test("transpose", () => {
    let v = Matrix.square(
        new Complex(2, 3), new Complex(5, 7),
        new Complex(11, 13), new Complex(17, 19));
    let a = Matrix.square(
        new Complex(2, 3), new Complex(11, 13),
        new Complex(5, 7), new Complex(17, 19));
    assertThat(v.transpose()).isEqualTo(a);
    assertThat(Matrix.col(1, 2, Complex.I).transpose()).isEqualTo(Matrix.row(1, 2, Complex.I));
});

suite.test("times_scalar", () => {
    let v = Matrix.square(new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19));
    let a = Matrix.square(new Complex(-2, -3), new Complex(-5, -7),
                          new Complex(-11, -13), new Complex(-17, -19));
    assertThat(v.times(-1)).isEqualTo(a);
    assertThat(v.times(0)).isEqualTo(Matrix.square(0, 0, 0, 0));
    assertThat(v.times(1)).isEqualTo(v);

    assertThat(Matrix.col(2, 3).times(5)).isEqualTo(Matrix.col(10, 15));
    assertThat(Matrix.row(2, 3).times(5)).isEqualTo(Matrix.row(10, 15));
});

suite.test("plus", () => {
    assertThat(Matrix.square(2, 3, 5, 7).plus(Matrix.square(11, 13, 17, 19)))
        .isEqualTo(Matrix.square(13, 16, 22, 26));
});

suite.test("minus", () => {
    assertThat(Matrix.square(2, 3, 5, 7).minus(Matrix.square(11, 13, 17, 19)))
        .isEqualTo(Matrix.square(-9, -10, -12, -12));
});

suite.test("times_matrix", () => {
    assertThat(Matrix.square(2, 3, 5, 7).times(Matrix.square(11, 13, 17, 19)))
        .isEqualTo(Matrix.square(73, 83, 174, 198));

    let x = Matrix.square(new Complex(0.5, -0.5), new Complex(0.5, 0.5),
                          new Complex(0.5, 0.5), new Complex(0.5, -0.5));
    assertThat(x.times(x.adjoint())).isEqualTo(Matrix.identity(2));
    assertThat(Matrix.PAULI_X.times(Matrix.PAULI_Y).times(Matrix.PAULI_Z).times(new Complex(0, -1)))
        .isEqualTo(Matrix.identity(2));
});

suite.test("times_ColRow", () => {
    // When one is a column vector and the other is a row vector...
    let r = Matrix.row(2, 3, 5);
    let c = Matrix.col(11, 13, 17);

    // Inner product
    assertThat(r.times(c).toString()).isEqualTo("{{146}}");

    // Outer product
    assertThat(c.times(r).toString()).isEqualTo("{{22, 33, 55}, {26, 39, 65}, {34, 51, 85}}");

    // Outer product matches tensor product
    assertThat(c.times(r)).isEqualTo(c.tensorProduct(r));

    // Tensor product is order independent (in this case)
    assertThat(r.tensorProduct(c)).isEqualTo(c.tensorProduct(r));
});

suite.test("norm2", () => {
    assertThat(Matrix.solo(1).norm2()).isEqualTo(1);
    assertThat(Matrix.solo(2).norm2()).isEqualTo(4);
    assertThat(Matrix.row(1, 1).norm2()).isEqualTo(2);
    assertThat(Matrix.col(1, 1).norm2()).isEqualTo(2);
    assertThat(Matrix.square(1, 2, 3, 4).norm2()).isEqualTo(30);
});

suite.test("tensorProduct", () => {
    assertThat(Matrix.solo(2).tensorProduct(Matrix.solo(3))).
        isEqualTo(Matrix.solo(6));
    assertThat(Matrix.solo(new Complex(2, 3)).tensorProduct(Matrix.solo(new Complex(5, 7)))).
        isEqualTo(Matrix.solo(new Complex(-11, 29)));
    assertThat(Matrix.solo(2).tensorProduct(Matrix.solo(3))).
        isEqualTo(Matrix.solo(6));
    assertThat(Matrix.PAULI_X.tensorProduct(Matrix.PAULI_Z)).isEqualTo(Matrix.square(
        0, 0, 1, 0,
        0, 0, 0, -1,
        1, 0, 0, 0,
        0, -1, 0, 0
    ));
    assertThat(Matrix.square(2, 3, 5, 7).tensorProduct(Matrix.square(11, 13, 17, 19))).
        isEqualTo(Matrix.square(
            22, 26, 33, 39,
            34, 38, 51, 57,
            55, 65, 77, 91,
            85, 95, 119, 133
        ));
});

suite.test("tensorPower", () => {
    let i = Complex.I;

    assertThat(Matrix.solo(i).tensorPower(0)).isEqualTo(Matrix.solo(1));
    assertThat(Matrix.solo(i).tensorPower(1)).isEqualTo(Matrix.solo(i));
    assertThat(Matrix.solo(i).tensorPower(2)).isEqualTo(Matrix.solo(-1));
    assertThat(Matrix.solo(i).tensorPower(3)).isEqualTo(Matrix.solo(i.neg()));
    assertThat(Matrix.solo(i).tensorPower(4)).isEqualTo(Matrix.solo(1));
    assertThat(Matrix.solo(i).tensorPower(5)).isEqualTo(Matrix.solo(i));
    assertThat(Matrix.solo(i).tensorPower(1 << 30)).isEqualTo(Matrix.solo(1));
    assertThat(Matrix.solo(i).tensorPower(5 + (1 << 30))).isEqualTo(Matrix.solo(i));

    let r = Matrix.row(1, i);
    assertThat(r.tensorPower(0)).isEqualTo(Matrix.solo(1));
    assertThat(r.tensorPower(1)).isEqualTo(Matrix.row(1, i));
    assertThat(r.tensorPower(2)).isEqualTo(Matrix.row(1, i, i, -1));
    assertThat(r.tensorPower(3)).isEqualTo(Matrix.row(1, i, i, -1, i, -1, -1, i.neg()));

    let c = Matrix.col(1, i);
    assertThat(c.tensorPower(0)).isEqualTo(Matrix.solo(1));
    assertThat(c.tensorPower(1)).isEqualTo(Matrix.col(1, i));
    assertThat(c.tensorPower(2)).isEqualTo(Matrix.col(1, i, i, -1));
    assertThat(c.tensorPower(3)).isEqualTo(Matrix.col(1, i, i, -1, i, -1, -1, i.neg()));

    let s = Matrix.square(1, 2, 3, 4);
    assertThat(s.tensorPower(0)).isEqualTo(Matrix.solo(1));
    assertThat(s.tensorPower(1)).isEqualTo(Matrix.square(1, 2, 3, 4));
    assertThat(s.tensorPower(2)).isEqualTo(Matrix.square(
        1, 2, 2, 4,
        3, 4, 6, 8,
        3, 6, 4, 8,
        9, 12,12,16));
});

suite.test("timesQubitOperation", () => {
    let s = Math.sqrt(0.5);

    assertThat(Matrix.col(1, 0, 0, 0).timesQubitOperation(Matrix.HADAMARD, 0, 0, 0)).
        isEqualTo(Matrix.col(s, s, 0, 0));
    assertThat(Matrix.col(0, 1, 0, 0).timesQubitOperation(Matrix.HADAMARD, 0, 0, 0)).
        isEqualTo(Matrix.col(s, -s, 0, 0));
    assertThat(Matrix.col(0, 0, 1, 0).timesQubitOperation(Matrix.HADAMARD, 0, 0, 0)).
        isEqualTo(Matrix.col(0, 0, s, s));
    assertThat(Matrix.col(0, 0, 0, 1).timesQubitOperation(Matrix.HADAMARD, 0, 0, 0)).
        isEqualTo(Matrix.col(0, 0, s, -s));

    assertThat(Matrix.col(1, 0, 0, 0).timesQubitOperation(Matrix.HADAMARD, 1, 0, 0)).
        isEqualTo(Matrix.col(s, 0, s, 0));
    assertThat(Matrix.col(0, 1, 0, 0).timesQubitOperation(Matrix.HADAMARD, 1, 0, 0)).
        isEqualTo(Matrix.col(0, s, 0, s));
    assertThat(Matrix.col(0, 0, 1, 0).timesQubitOperation(Matrix.HADAMARD, 1, 0, 0)).
        isEqualTo(Matrix.col(s, 0, -s, 0));
    assertThat(Matrix.col(0, 0, 0, 1).timesQubitOperation(Matrix.HADAMARD, 1, 0, 0)).
        isEqualTo(Matrix.col(0, s, 0, -s));

    assertThat(Matrix.col(2, 3, 0, 0).timesQubitOperation(Matrix.PAULI_X, 1, 1, 0)).
        isEqualTo(Matrix.col(0, 3, 2, 0));
    assertThat(Matrix.col(2, 3, 0, 0).timesQubitOperation(Matrix.PAULI_X, 1, 1, 1)).
        isEqualTo(Matrix.col(2, 0, 0, 3));
});

suite.test("timesQubitOperation_speed", () => {
    let numQubits = 10;
    let numOps = 100;
    let t0 = performance.now();
    let buf = new Float64Array(2 << numQubits);
    buf[0] = 1;
    let state = new Matrix(1, 1 << numQubits, buf);
    for (let i = 0; i < numOps; i++) {
        state = state.timesQubitOperation(Matrix.HADAMARD, 0, 6, 0);
    }

    let t1 = performance.now();
    assertThat(t1 - t0).isLessThan(100);
});

suite.test("fromPauliRotation", () => {
    // No turn gives no-op
    assertThat(Matrix.fromPauliRotation(0, 0, 0)).isApproximatelyEqualTo(Matrix.identity(2));

    // Whole turns are no-ops
    assertThat(Matrix.fromPauliRotation(1, 0, 0)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, 1, 0)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, 0, 1)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(-1, 0, 0)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, -1, 0)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, 0, -1)).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0.6, 0.8, 0)).isApproximatelyEqualTo(Matrix.identity(2));

    // Half turns along each axis is the corresponding Pauli operation
    assertThat(Matrix.fromPauliRotation(0.5, 0, 0)).isApproximatelyEqualTo(Matrix.PAULI_X);
    assertThat(Matrix.fromPauliRotation(0, 0.5, 0)).isApproximatelyEqualTo(Matrix.PAULI_Y);
    assertThat(Matrix.fromPauliRotation(0, 0, 0.5)).isApproximatelyEqualTo(Matrix.PAULI_Z);
    assertThat(Matrix.fromPauliRotation(-0.5, 0, 0)).isApproximatelyEqualTo(Matrix.PAULI_X);
    assertThat(Matrix.fromPauliRotation(0, -0.5, 0)).isApproximatelyEqualTo(Matrix.PAULI_Y);
    assertThat(Matrix.fromPauliRotation(0, 0, -0.5)).isApproximatelyEqualTo(Matrix.PAULI_Z);

    // Hadamard
    assertThat(Matrix.fromPauliRotation(Math.sqrt(0.125), 0, Math.sqrt(0.125))).
        isApproximatelyEqualTo(Matrix.HADAMARD);

    // Opposites are inverses
    assertThat(Matrix.fromPauliRotation(-0.25, 0, 0).times(Matrix.fromPauliRotation(0.25, 0, 0))).
        isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, -0.25, 0).times(Matrix.fromPauliRotation(0, 0.25, 0))).
        isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(Matrix.fromPauliRotation(0, 0, -0.25).times(Matrix.fromPauliRotation(0, 0, 0.25))).
        isApproximatelyEqualTo(Matrix.identity(2));

    // Doubling rotation is like squaring
    let s1 = Matrix.fromPauliRotation(0.1, 0.15, 0.25);
    let s2 = Matrix.fromPauliRotation(0.2, 0.3, 0.5);
    assertThat(s1.times(s1)).isApproximatelyEqualTo(s2);
});

suite.test("fromWireSwap", () => {
    assertThat(Matrix.fromWireSwap(2, 0, 1).toString()).
        isEqualTo("{{1, 0, 0, 0}, {0, 0, 1, 0}, {0, 1, 0, 0}, {0, 0, 0, 1}}");
    let _ = 0;
    assertThat(Matrix.square(
        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, //____
        _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, //___1
        _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, //__1_
        _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, //__11
        _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, //_1__
        _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, //_1_1
        _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, //_11_
        _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, //_111
        _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, //1___
        _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, //1__1
        _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, //1_1_
        _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, //1_11
        _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, //11__
        _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, //11_1
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, //111_
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1 //1111
    )).isEqualTo(Matrix.fromWireSwap(4, 1, 3));
});

suite.test("identity", () => {
    assertThat(Matrix.identity(1).toString()).
        isEqualTo("{{1}}");
    assertThat(Matrix.identity(2).toString()).
        isEqualTo("{{1, 0}, {0, 1}}");
    assertThat(Matrix.identity(3).toString()).
        isEqualTo("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}");
    assertThat(Matrix.identity(4).toString()).
        isEqualTo("{{1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {0, 0, 0, 1}}");
});

suite.test("rotation", () => {
    let s = Math.sqrt(0.5);
    let t = Math.PI * 2;
    assertThat(Matrix.rotation(0)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.rotation(t / 8)).isApproximatelyEqualTo(Matrix.square(s, -s, s, s));
    assertThat(Matrix.rotation(t * 2 / 8)).isApproximatelyEqualTo(Matrix.square(0, -1, 1, 0));
    assertThat(Matrix.rotation(t * 3 / 8)).isApproximatelyEqualTo(Matrix.square(-s, -s, s, -s));
    assertThat(Matrix.rotation(t * 4 / 8)).isApproximatelyEqualTo(Matrix.square(-1, 0, 0, -1));
    assertThat(Matrix.rotation(t * 5 / 8)).isApproximatelyEqualTo(Matrix.square(-s, s, -s, -s));
    assertThat(Matrix.rotation(t * 6 / 8)).isApproximatelyEqualTo(Matrix.square(0, 1, -1, 0));
    assertThat(Matrix.rotation(t * 7 / 8)).isApproximatelyEqualTo(Matrix.square(s, s, -s, s));
    assertThat(Matrix.rotation(t)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
});

const assertSvdDecompositionWorksFor = m => {
    let {U, S, V} = m.singularValueDecomposition(0.000001, 100);
    assertThat(U.isUnitary(0.00001)).withInfo({m, U, S, V, test: "U isUnitary"}).isEqualTo(true);
    assertThat(V.isUnitary(0.00001)).withInfo({m, U, S, V, test: "V isUnitary"}).isEqualTo(true);
    assertThat(S.isDiagonal(0.00001)).withInfo({m, U, S, V, test: "S diagonal"}).isEqualTo(true);
    assertThat(Seq.range(S.width()).every(i => Math.abs(S.cell(i, i).phase()) < 0.000001)).
        withInfo({m, U, S, V, test: "S is positive"}).isEqualTo(true);
    assertThat(U.times(S).times(V)).withInfo({m, U, S, V}).isApproximatelyEqualTo(m, 0.001);
};

suite.test("singularValueDecomposition", () => {
    assertThat(Matrix.zero(2, 2).singularValueDecomposition()).isEqualTo({
        U: Matrix.identity(2),
        S: Matrix.zero(2, 2),
        V: Matrix.identity(2)
    });

    assertThat(Matrix.identity(2).singularValueDecomposition()).isEqualTo({
        U: Matrix.identity(2),
        S: Matrix.identity(2),
        V: Matrix.identity(2)
    });

    assertSvdDecompositionWorksFor(Matrix.square(1, Complex.I.times(2), 3, 4));
    assertSvdDecompositionWorksFor(Matrix.square(
        new Complex(2, 3), new Complex(5, 7),
        new Complex(11, 13), new Complex(17, 19)));
    assertSvdDecompositionWorksFor(Matrix.square(
        new Complex(2, 3), new Complex(5, 7), new Complex(11, 13),
        new Complex(17, 19), new Complex(23, 29), new Complex(31, 37),
        new Complex(41, 43), new Complex(47, 53), new Complex(59, 61)));
    assertSvdDecompositionWorksFor(Matrix.square(
        new Complex(2, 3), new Complex(5, 7), new Complex(11, 13),
        new Complex(17, 19), new Complex(-23, 29), new Complex(31, 37),
        new Complex(41, -43), new Complex(47, -53), new Complex(59, 61)));

    assertSvdDecompositionWorksFor(Matrix.generateDiagonal(4, k => Complex.polar(1, Math.PI*2/3*k)));
});

suite.test("singularValueDecomposition_randomized", () => {
    for (let k = 1; k < 5; k++) {
        let m = Matrix.generate(k, k, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertSvdDecompositionWorksFor(m);
    }
});

suite.test("closestUnitary", () => {
    let i = Complex.I;
    let ni = i.neg();
    assertThat(Matrix.square(0, 0, 0, 0).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.square(2, 0, 0, 0.0001).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.square(0, 0.5, 0.0001, 0).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square(0, 1, 1, 0));
    assertThat(Matrix.square(1.01, i, -1, ni).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square(1, 0, 0, ni));

    let m = Matrix.square(
        1,  1,  1,  1,
        1,  i, -1, ni,
        1, -1,  1, -1,
        1, ni, -1,  i);
    assertThat(m.closestUnitary(0.001)).isApproximatelyEqualTo(m.times(0.5));

    let m2 = Matrix.generateDiagonal(4, k => Complex.polar(1, Math.PI*2/3*k));
    assertThat(m2.closestUnitary(0.001)).isApproximatelyEqualTo(m2);
});

suite.test("eigenDecomposition", () => {
    let s = Math.sqrt(0.5);
    let z = Math.sqrt(2);
    assertThat(Matrix.identity(2).eigenDecomposition()).isEqualTo([
        {val: 1, vec: Matrix.col(1, 0)},
        {val: 1, vec: Matrix.col(0, 1)}
    ]);
    assertThat(Matrix.PAULI_X.eigenDecomposition()).isApproximatelyEqualTo([
        {val: -1, vec: Matrix.col(s, -s)},
        {val: 1, vec: Matrix.col(s, s)}
    ]);
    assertThat(Matrix.PAULI_Y.eigenDecomposition()).isApproximatelyEqualTo([
        {val: -1, vec: Matrix.col(s, new Complex(0, -s))},
        {val: 1, vec: Matrix.col(s, new Complex(0, s))}
    ]);
    assertThat(Matrix.PAULI_Z.eigenDecomposition()).isEqualTo([
        {val: -1, vec: Matrix.col(0, 1)},
        {val: 1, vec: Matrix.col(1, 0)}
    ]);
    assertThat(Matrix.square(1, 1, 1, -1).eigenDecomposition()).isApproximatelyEqualTo([
        {val: -z, vec: Matrix.col(1 - z, 1).times(-1/Math.sqrt(4-2*z))},
        {val: z, vec: Matrix.col(1 + z, 1).times(1/Math.sqrt(4+2*z))}
    ]);
    assertThat(Matrix.HADAMARD.eigenDecomposition()).isApproximatelyEqualTo([
        {val: -1, vec: Matrix.col(1 - z, 1).times(-1/Math.sqrt(4-2*z))},
        {val: 1, vec: Matrix.col(1 + z, 1).times(1/Math.sqrt(4+2*z))}
    ]);
});

suite.test("liftApply", () => {
    let i = Complex.I;
    let mi = Complex.I.times(-1);
    let s = Math.sqrt(0.5);
    let tExpI = t => (c => c.times(i).times(t).exp());
    let tPow = t => (c => c.raisedTo(t));

    assertThat(Matrix.PAULI_X.liftApply(tExpI(Math.PI))).isApproximatelyEqualTo(Matrix.square(-1, 0, 0, -1));
    assertThat(Matrix.PAULI_X.liftApply(tExpI(Math.PI/2))).isApproximatelyEqualTo(Matrix.square(0, i, i, 0));
    assertThat(Matrix.PAULI_X.liftApply(tExpI(Math.PI/4))).
        isApproximatelyEqualTo(Matrix.square(1, i, i, 1).times(s));

    assertThat(Matrix.PAULI_Y.liftApply(tExpI(Math.PI))).isApproximatelyEqualTo(Matrix.square(-1, 0, 0, -1));
    assertThat(Matrix.PAULI_Y.liftApply(tExpI(Math.PI/2))).isApproximatelyEqualTo(Matrix.square(0, 1, -1, 0));
    assertThat(Matrix.PAULI_Y.liftApply(tExpI(Math.PI/4))).isApproximatelyEqualTo(Matrix.square(s, s, -s, s));

    assertThat(Matrix.PAULI_Z.liftApply(tExpI(Math.PI))).isApproximatelyEqualTo(Matrix.square(-1, 0, 0, -1));
    assertThat(Matrix.PAULI_Z.liftApply(tExpI(Math.PI/2))).isApproximatelyEqualTo(Matrix.square(i, 0, 0, mi));
    assertThat(Matrix.PAULI_Z.liftApply(tExpI(Math.PI/4))).
        isApproximatelyEqualTo(Matrix.square(new Complex(s, s), 0, 0, new Complex(s, -s)));

    assertThat(Matrix.PAULI_X.liftApply(tPow(0.5))).
        isApproximatelyEqualTo(Matrix.square(i, 1, 1, i).times(new Complex(0.5, -0.5)));
    assertThat(Matrix.PAULI_X.liftApply(tPow(-0.5))).
        isApproximatelyEqualTo(Matrix.square(mi, 1, 1, mi).times(new Complex(0.5, 0.5)));

    assertThat(Matrix.PAULI_Y.liftApply(tPow(0.5))).
        isApproximatelyEqualTo(Matrix.square(1, -1, 1, 1).times(new Complex(0.5, 0.5)));
    assertThat(Matrix.PAULI_Y.liftApply(tPow(-0.5))).
        isApproximatelyEqualTo(Matrix.square(1, 1, -1, 1).times(new Complex(0.5, -0.5)));

    assertThat(Matrix.PAULI_Z.liftApply(tPow(0.5))).isApproximatelyEqualTo(Matrix.square(1, 0, 0, i));
    assertThat(Matrix.PAULI_Z.liftApply(tPow(-0.5))).isApproximatelyEqualTo(Matrix.square(1, 0, 0, mi));
});

suite.test("trace", () => {
    assertThat(Matrix.solo(NaN).trace().abs()).isEqualTo(NaN);
    assertThat(Matrix.identity(2).trace()).isEqualTo(2);
    assertThat(Matrix.identity(10).trace()).isEqualTo(10);

    assertThat(Matrix.PAULI_X.trace()).isEqualTo(0);
    assertThat(Matrix.PAULI_Y.trace()).isEqualTo(0);
    assertThat(Matrix.PAULI_Z.trace()).isEqualTo(0);
    assertThat(Matrix.HADAMARD.trace()).isApproximatelyEqualTo(0);
    assertThat(Matrix.square(1, 2, 3, 4).trace()).isEqualTo(5);

    assertThat(Matrix.square(0,1,2,3,4,5,6,7,8).trace()).isEqualTo(12);
});

suite.test("qubitDensityMatrixToBlochVector", () => {
    assertThrows(() => Matrix.solo(1).qubitDensityMatrixToBlochVector());
    assertThrows(() => Matrix.square(1,0,0,0,0,0,0,0,0).qubitDensityMatrixToBlochVector());
    assertThrows(() => Matrix.identity(2).qubitDensityMatrixToBlochVector());
    assertThrows(() => Matrix.square(1, 1, -1, 0).qubitDensityMatrixToBlochVector());
    assertThrows(() => Matrix.square(1, 1, 0, 0).qubitDensityMatrixToBlochVector());
    assertThrows(() => Matrix.square(1, Complex.I, Complex.I, 0).qubitDensityMatrixToBlochVector());

    // Maximally mixed state.
    assertThat(Matrix.identity(2).times(0.5).qubitDensityMatrixToBlochVector()).
        isEqualTo([0, 0, 0]);

    // Pure states as vectors along each axis.
    let f = (...m) => Matrix.col(...m).times(Matrix.col(...m).adjoint());
    let i = Complex.I;
    let mi = i.times(-1);
    assertThat(f(1, 0).qubitDensityMatrixToBlochVector()).isEqualTo([0, 0, -1]);
    assertThat(f(0, 1).qubitDensityMatrixToBlochVector()).isEqualTo([0, 0, 1]);
    assertThat(f(1, 1).times(0.5).qubitDensityMatrixToBlochVector()).isEqualTo([-1, 0, 0]);
    assertThat(f(1, -1).times(0.5).qubitDensityMatrixToBlochVector()).isEqualTo([1, 0, 0]);
    assertThat(f(1, i).times(0.5).qubitDensityMatrixToBlochVector()).isEqualTo([0, -1, 0]);
    assertThat(f(1, mi).times(0.5).qubitDensityMatrixToBlochVector()).isEqualTo([0, 1, 0]);
});

suite.test("determinant", () => {
    assertThrows(() => Matrix.col(1, 2).determinant());
    assertThrows(() => Matrix.row(1, 2).determinant());

    assertThat(Matrix.solo(1).determinant()).isEqualTo(1);
    assertThat(Matrix.solo(2).determinant()).isEqualTo(2);

    assertThat(Matrix.square(1, 2, 3, 4).determinant()).isEqualTo(-2);
    assertThat(Matrix.square(2, 3, 5, 7).determinant()).isEqualTo(-1);

    assertThat(Matrix.square(1, 2, 3, 4, 5, 6, 7, 8, 9).determinant()).isEqualTo(0);
    assertThat(Matrix.square(2, 3, 5, 7, 11, 13, 17, 19, 23).determinant()).isEqualTo(-78);
});

suite.test("fromAngleAxisPhaseRotation", () => {
    let π = Math.PI;
    let i = Complex.I;
    let s = Math.sqrt(0.5);
    let is = Complex.I.times(s);
    let mis = is.neg();
    let mi = Complex.I.times(-1);

    // No-op.
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [1, 0, 0], 0)).isEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [0, 1, 0], 0)).isEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [0, 0, 1], 0)).isEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [s, 0, s], 0)).isEqualTo(Matrix.square(1, 0, 0, 1));

    // Phase.
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [1, 0, 0], π/2)).isEqualTo(Matrix.square(i, 0, 0, i));
    assertThat(Matrix.fromAngleAxisPhaseRotation(0, [1, 0, 0], π)).isEqualTo(Matrix.square(-1, 0, 0, -1));

    // X.
    assertThat(Matrix.fromAngleAxisPhaseRotation(-π/2, [1, 0, 0], 0)).isEqualTo(Matrix.square(s, is, is, s));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π/2, [1, 0, 0], 0)).isEqualTo(Matrix.square(s, mis, mis, s));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π, [1, 0, 0], 0)).isEqualTo(Matrix.square(0, mi, mi, 0));
    assertThat(Matrix.fromAngleAxisPhaseRotation(2*π, [1, 0, 0], 0)).isEqualTo(Matrix.square(-1, 0, 0, -1));

    // Y.
    assertThat(Matrix.fromAngleAxisPhaseRotation(-π/2, [0, 1, 0], 0)).isEqualTo(Matrix.square(s, s, -s, s));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π/2, [0, 1, 0], 0)).isEqualTo(Matrix.square(s, -s, s, s));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π, [0, 1, 0], 0)).isEqualTo(Matrix.square(0, -1, 1, 0));
    assertThat(Matrix.fromAngleAxisPhaseRotation(2*π, [0, 1, 0], 0)).isEqualTo(Matrix.square(-1, 0, 0, -1));

    // Z.
    assertThat(Matrix.fromAngleAxisPhaseRotation(-π/2, [0, 0, 1], 0)).
        isEqualTo(Matrix.square(new Complex(s, s), 0, 0, new Complex(s, -s)));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π/2, [0, 0, 1], 0)).
        isEqualTo(Matrix.square(new Complex(s, -s), 0, 0, new Complex(s, s)));
    assertThat(Matrix.fromAngleAxisPhaseRotation(π, [0, 0, 1], 0)).isEqualTo(Matrix.square(mi, 0, 0, i));
    assertThat(Matrix.fromAngleAxisPhaseRotation(2*π, [0, 0, 1], 0)).isEqualTo(Matrix.square(-1, 0, 0, -1));

    // H.
    assertThat(Matrix.fromAngleAxisPhaseRotation(-π, [s, 0, s], 0)).
        isEqualTo(Matrix.square(is, is, is, is.times(-1)));
    assertThat(Matrix.fromAngleAxisPhaseRotation(-π, [s, 0, s], -π/2)).
        isEqualTo(Matrix.square(s, s, s, -s));
});

suite.test("qubitOperationToAngleAxisRotation", () => {
    assertThrows(() => Matrix.solo(1).qubitOperationToAngleAxisRotation());
    assertThrows(() => Matrix.square(1, 2, 3, 4).qubitOperationToAngleAxisRotation());

    let [w, x, y, z] = [Matrix.identity(2), Matrix.PAULI_X, Matrix.PAULI_Y, Matrix.PAULI_Z];
    let π = Math.PI;
    let i = Complex.I;
    let mi = i.neg();
    let s = Math.sqrt(0.5);

    assertThat(w.qubitOperationToAngleAxisRotation()).isEqualTo({angle: 0, axis: [1, 0, 0], phase: 0});
    assertThat(x.qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [1, 0, 0], phase: π/2});
    assertThat(y.qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 1, 0], phase: π/2});
    assertThat(z.qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 0, 1], phase: π/2});

    assertThat(w.times(i).qubitOperationToAngleAxisRotation()).isEqualTo({angle: 0, axis: [1, 0, 0], phase: π/2});
    assertThat(x.times(i).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [1, 0, 0], phase: π});
    assertThat(y.times(i).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 1, 0], phase: π});
    assertThat(z.times(i).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 0, 1], phase: π});

    assertThat(w.times(mi).qubitOperationToAngleAxisRotation()).isEqualTo({angle: 0, axis: [1, 0, 0], phase: -π/2});
    assertThat(x.times(mi).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [1, 0, 0], phase: 0});
    assertThat(y.times(mi).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 1, 0], phase: 0});
    assertThat(z.times(mi).qubitOperationToAngleAxisRotation()).isEqualTo({angle: π, axis: [0, 0, 1], phase: 0});

    assertThat(Matrix.HADAMARD.qubitOperationToAngleAxisRotation()).
        isEqualTo({angle: π, axis: [s, 0, s], phase: π/2});
    assertThat(Matrix.square(1, i, i, 1).times(s).qubitOperationToAngleAxisRotation()).
        isEqualTo({angle: -π/2, axis: [1, 0, 0], phase: 0});
    assertThat(Matrix.square(s, s, -s, s).qubitOperationToAngleAxisRotation()).
        isEqualTo({angle: -π/2, axis: [0, 1, 0], phase: 0});
    assertThat(Matrix.square(1, 0, 0, i).qubitOperationToAngleAxisRotation()).
        isEqualTo({angle: π/2, axis: [0, 0, 1], phase: π/4});
});

suite.test("qubitOperationToAngleAxisRotation_vs_fromAngleAxisPhaseRotation_randomized", () => {
    //noinspection JSUnusedLocalSymbols
    for (let _ of Seq.range(100)) {
        let phase = Math.random() * Math.PI * 2;
        let angle = Math.random() * Math.PI * 4;
        let a = Math.random() * Math.PI * 2;
        let b = Math.acos(Math.random() * 2 - 1);
        let axis = [
            Math.cos(a)*Math.sin(b),
            Math.sin(a)*Math.sin(b),
            Math.cos(b)
        ];
        let U = Matrix.fromAngleAxisPhaseRotation(angle, axis, phase);
        let {angle: angle2, axis: axis2, phase: phase2} = U.qubitOperationToAngleAxisRotation();
        let U2 = Matrix.fromAngleAxisPhaseRotation(angle2, axis2, phase2);
        assertThat(U2).withInfo({angle, axis, phase}).isApproximatelyEqualTo(U);
    }
});

suite.test("cross3", () => {
    let [x, y, z] = [Matrix.col(1, 0, 0), Matrix.col(0, 1, 0), Matrix.col(0, 0, 1)];
    let zero = Matrix.col(0, 0, 0);

    assertThat(zero.cross3(zero)).isEqualTo(zero);
    assertThat(x.cross3(zero)).isEqualTo(zero);
    assertThat(y.cross3(zero)).isEqualTo(zero);
    assertThat(z.cross3(zero)).isEqualTo(zero);

    assertThat(x.cross3(y)).isEqualTo(z);
    assertThat(y.cross3(z)).isEqualTo(x);
    assertThat(z.cross3(x)).isEqualTo(y);

    assertThat(y.cross3(x)).isEqualTo(z.times(-1));
    assertThat(z.cross3(y)).isEqualTo(x.times(-1));
    assertThat(x.cross3(z)).isEqualTo(y.times(-1));

    assertThat(x.times(2).cross3(y.times(3))).isEqualTo(z.times(6));
    assertThat(x.plus(y).cross3(y)).isEqualTo(z);
});

suite.test("isUpperTriangular", () => {
    assertTrue(Matrix.solo(NaN).isUpperTriangular());
    assertTrue(Matrix.solo(0).isUpperTriangular());
    assertTrue(Matrix.solo(1).isUpperTriangular());
    assertFalse(Matrix.col(1, 2).isUpperTriangular());
    assertTrue(Matrix.row(1, 2).isUpperTriangular());

    assertTrue(Matrix.square(1, 0, 0, 0).isUpperTriangular());
    assertTrue(Matrix.square(0, 1, 0, 0).isUpperTriangular());
    assertFalse(Matrix.square(0, 0, 1, 0).isUpperTriangular());
    assertTrue(Matrix.square(0, 0, 0, 1).isUpperTriangular());

    assertTrue(Matrix.square(1, 2, 0, 4).isUpperTriangular());
    assertTrue(Matrix.square(1, NaN, 0, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 0, 2, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 0, NaN, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 2, 3, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 2, NaN, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 2, Complex.I, 4).isUpperTriangular());
    assertFalse(Matrix.square(1, 2, 3, 4).isUpperTriangular(2.9));
    assertTrue(Matrix.square(1, 2, 3, 4).isUpperTriangular(3.1));

    assertTrue(Matrix.square(
        1, 2, 3,
        0, 5, 6,
        0, 0, 7).isUpperTriangular(0));
    assertFalse(Matrix.square(
        1, 2, 3,
        0, 5, 6,
        0.01, 0, 7).isUpperTriangular(0));
    assertTrue(Matrix.square(
        1, 2, 3,
        0, 5, 6,
        0.01, 0, 7).isUpperTriangular(0.1));
});

suite.test("isLowerTriangular", () => {
    assertTrue(Matrix.solo(NaN).isLowerTriangular());
    assertTrue(Matrix.solo(0).isLowerTriangular());
    assertTrue(Matrix.solo(1).isLowerTriangular());
    assertTrue(Matrix.col(1, 2).isLowerTriangular());
    assertFalse(Matrix.row(1, 2).isLowerTriangular());

    assertTrue(Matrix.square(1, 0, 0, 0).isLowerTriangular());
    assertFalse(Matrix.square(0, 1, 0, 0).isLowerTriangular());
    assertTrue(Matrix.square(0, 0, 1, 0).isLowerTriangular());
    assertTrue(Matrix.square(0, 0, 0, 1).isLowerTriangular());

    assertFalse(Matrix.square(1, 2, 0, 4).isLowerTriangular());
    assertFalse(Matrix.square(1, NaN, 0, 4).isLowerTriangular());
    assertTrue(Matrix.square(1, 0, 2, 4).isLowerTriangular());
    assertTrue(Matrix.square(1, 0, NaN, 4).isLowerTriangular());
    assertFalse(Matrix.square(1, 2, 3, 4).isLowerTriangular());
    assertFalse(Matrix.square(1, 2, NaN, 4).isLowerTriangular());
    assertFalse(Matrix.square(1, 2, Complex.I, 4).isLowerTriangular());
    assertFalse(Matrix.square(1, 3, 2, 4).isLowerTriangular(2.9));
    assertTrue(Matrix.square(1, 3, 2, 4).isLowerTriangular(3.1));

    assertFalse(Matrix.square(
        1, 2, 3,
        0, 5, 6,
        0, 0, 7).isLowerTriangular(0));
    assertTrue(Matrix.square(
        1, 0, 0,
        2, 5, 0,
        3, 6, 7).isLowerTriangular(0));
    assertFalse(Matrix.square(
        1, 0, 0.01,
        2, 5, 0,
        3, 6, 7).isLowerTriangular(0));
    assertTrue(Matrix.square(
        1, 0, 0.01,
        2, 5, 0,
        3, 6, 7).isLowerTriangular(0.1));
});

const assertQrDecompositionWorksFor = m => {
    let {Q, R} = m.qrDecomposition();
    assertThat(Q.isUnitary(0.00001)).withInfo({m, Q, R, test: "isUnitary"}).isEqualTo(true);
    assertThat(R.isUpperTriangular(0.00001)).withInfo({m, Q, R, test: "isUpperTriangular"}).isEqualTo(true);
    assertThat(Q.times(R)).withInfo({m, Q, R}).isApproximatelyEqualTo(m);
};

suite.test("qrDecomposition", () => {
    assertThrows(() => Matrix.col(2, 3).qrDecomposition());
    assertThrows(() => Matrix.row(2, 3).qrDecomposition());

    assertThat(Matrix.solo(0).qrDecomposition()).isEqualTo({Q: Matrix.solo(1), R: Matrix.solo(0)});
    assertThat(Matrix.solo(1).qrDecomposition()).isEqualTo({Q: Matrix.solo(1), R: Matrix.solo(1)});

    assertThat(Matrix.square(2, 3, 0, 5).qrDecomposition()).isEqualTo({
        Q: Matrix.square(1, 0, 0, 1),
        R: Matrix.square(2, 3, 0, 5)
    });
    assertThat(Matrix.square(2, 0, 3, 5).qrDecomposition()).isApproximatelyEqualTo({
        Q: Matrix.square(0.5547, -0.83205, 0.83205, 0.5547),
        R: Matrix.square(3.60555, 4.16025, 0, 2.7735)
    }, 0.0001);
    assertQrDecompositionWorksFor(Matrix.square(0, 0, 1, 0));
    assertQrDecompositionWorksFor(Matrix.square(0, 1, 0, 0));
    assertQrDecompositionWorksFor(Matrix.square(2, 0, 3, 5));
    assertQrDecompositionWorksFor(Matrix.square(-1, Complex.I, Complex.I, 1));
    assertQrDecompositionWorksFor(Matrix.square(2, 3, 5, 7, new Complex(11, 13), 17, 19, 23, 29));
});

suite.test("qrDecomposition_randomized", () => {
    for (let k = 1; k < 6; k++) {
        let m = Matrix.generate(k, k, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertQrDecompositionWorksFor(m);
    }
});

const assertLqDecompositionWorksFor = m => {
    let {L, Q} = m.lqDecomposition();
    assertThat(Q.isUnitary(0.00001)).withInfo({m, L, Q, test: "isUnitary"}).isEqualTo(true);
    assertThat(L.isLowerTriangular(0.00001)).withInfo({m, L, Q, test: "isLowerTriangular"}).isEqualTo(true);
    assertThat(L.times(Q)).withInfo({m, L, Q}).isApproximatelyEqualTo(m);
};

suite.test("lqDecomposition", () => {
    assertThrows(() => Matrix.col(2, 3).lqDecomposition());
    assertThrows(() => Matrix.row(2, 3).lqDecomposition());

    assertThat(Matrix.solo(0).lqDecomposition()).isEqualTo({L: Matrix.solo(0), Q: Matrix.solo(1)});
    assertThat(Matrix.solo(1).lqDecomposition()).isEqualTo({L: Matrix.solo(1), Q: Matrix.solo(1)});

    assertThat(Matrix.square(2, 3, 0, 5).lqDecomposition()).isApproximatelyEqualTo({
        L: Matrix.square(3.60555, 0, 4.16025, 2.7735),
        Q: Matrix.square(0.5547, 0.83205, -0.83205, 0.5547)
    }, 0.0001);
    assertThat(Matrix.square(2, 0, 3, 5).lqDecomposition()).isEqualTo({
        L: Matrix.square(2, 0, 3, 5),
        Q: Matrix.square(1, 0, 0, 1)
    });
    assertLqDecompositionWorksFor(Matrix.square(0, 0, 1, 0));
    assertLqDecompositionWorksFor(Matrix.square(0, 1, 0, 0));
    assertLqDecompositionWorksFor(Matrix.square(2, 0, 3, 5));
    assertLqDecompositionWorksFor(Matrix.square(-1, Complex.I, Complex.I, 1));
    assertLqDecompositionWorksFor(Matrix.square(2, 3, 5, 7, new Complex(11, 13), 17, 19, 23, 29));
});

suite.test("lqDecomposition_randomized", () => {
    for (let k = 1; k < 6; k++) {
        let m = Matrix.generate(k, k, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertLqDecompositionWorksFor(m);
    }
});

suite.test("eigenvalueMagnitudes", () => {
    assertThat(Matrix.HADAMARD.eigenvalueMagnitudes(0.001, 3)).isEqualTo([1, 1]);
    assertThat(Matrix.PAULI_X.eigenvalueMagnitudes(0.001)).isEqualTo([1, 1]);
    assertThat(Matrix.PAULI_Y.eigenvalueMagnitudes(0.001)).isEqualTo([1, 1]);
    assertThat(Matrix.PAULI_Z.eigenvalueMagnitudes(0.001)).isEqualTo([1, 1]);
    assertThat(Matrix.identity(5).eigenvalueMagnitudes(0.001)).isEqualTo([1, 1, 1, 1, 1]);

    assertThat(Matrix.square(1, 1, 1, 1).eigenvalueMagnitudes(0.001)).isApproximatelyEqualTo([2, 0]);
    assertThat(Matrix.square(1, -1, -1, 1).eigenvalueMagnitudes(0.001)).isApproximatelyEqualTo([2, 0]);

    assertThat(Matrix.square(1, 1, 0, 1, 1, 0, 0, 0, 0).eigenvalueMagnitudes(0.001)).isApproximatelyEqualTo([2, 0, 0]);
});

suite.test("isDiagonal", () => {
    assertTrue(Matrix.solo(NaN).isDiagonal());
    assertTrue(Matrix.solo(0).isDiagonal());
    assertTrue(Matrix.solo(1).isDiagonal());
    assertFalse(Matrix.col(0, 0).isDiagonal());
    assertFalse(Matrix.row(0, 0).isDiagonal());

    assertTrue(Matrix.square(1, 0, 0, 0).isDiagonal());
    assertFalse(Matrix.square(0, 1, 0, 0).isDiagonal());
    assertFalse(Matrix.square(0, NaN, 0, 0).isDiagonal());
    assertFalse(Matrix.square(0, 0, 1, 0).isDiagonal());
    assertTrue(Matrix.square(0, 0, 0, 1).isDiagonal());

    assertTrue(Matrix.square(new Complex(2, 3), 0, 0, 0).isDiagonal());
    assertFalse(Matrix.square(0, new Complex(2, 3), 0, 0).isDiagonal());
    assertFalse(Matrix.square(0, 0, new Complex(2, 3), 0).isDiagonal());
    assertTrue(Matrix.square(0, 0, 0, new Complex(2, 3)).isDiagonal());

    assertTrue(Matrix.square(
        -10, 0, 0,
        0, Infinity, 0,
        0, 0, Complex.I).isDiagonal());
    assertFalse(Matrix.square(
        -10, 0.1, 0,
        0, Infinity, 0,
        0, 0, Complex.I).isDiagonal());
    assertTrue(Matrix.square(
        -10, 0.1, 0,
        0, Infinity, 0,
        0, 0, Complex.I).isDiagonal(0.2));
});


suite.test("hasNaN", () => {
    assertTrue(Matrix.solo(NaN).hasNaN());
    assertFalse(Matrix.solo(0).hasNaN());

    assertTrue(Matrix.solo(new Complex(0, NaN)).hasNaN());
    assertTrue(Matrix.square(0, 0, NaN, 0).hasNaN());
    assertFalse(Matrix.square(0, 0, 0, 0).hasNaN());
});

suite.test("expandedForQubitInRegister", () => {
    let _ = 0;
    assertThat(Matrix.square(2, 3, 5, 7).expandedForQubitInRegister(0, 3, Controls.NONE)).isEqualTo(Matrix.square(
        2,3,_,_,_,_,_,_,
        5,7,_,_,_,_,_,_,
        _,_,2,3,_,_,_,_,
        _,_,5,7,_,_,_,_,
        _,_,_,_,2,3,_,_,
        _,_,_,_,5,7,_,_,
        _,_,_,_,_,_,2,3,
        _,_,_,_,_,_,5,7
    ));
    assertThat(Matrix.square(2, 3, 5, 7).expandedForQubitInRegister(1, 3, Controls.NONE)).isEqualTo(Matrix.square(
        2,_,3,_,_,_,_,_,
        _,2,_,3,_,_,_,_,
        5,_,7,_,_,_,_,_,
        _,5,_,7,_,_,_,_,
        _,_,_,_,2,_,3,_,
        _,_,_,_,_,2,_,3,
        _,_,_,_,5,_,7,_,
        _,_,_,_,_,5,_,7
    ));
    assertThat(Matrix.square(2, 3, 5, 7).expandedForQubitInRegister(2, 3, Controls.NONE)).isEqualTo(Matrix.square(
        2,_,_,_,3,_,_,_,
        _,2,_,_,_,3,_,_,
        _,_,2,_,_,_,3,_,
        _,_,_,2,_,_,_,3,
        5,_,_,_,7,_,_,_,
        _,5,_,_,_,7,_,_,
        _,_,5,_,_,_,7,_,
        _,_,_,5,_,_,_,7
    ));
    assertThat(Matrix.square(2, 3, 5, 7).
        expandedForQubitInRegister(0, 3, Controls.bit(1, true))).isEqualTo(Matrix.square(
            1,_,_,_,_,_,_,_,
            _,1,_,_,_,_,_,_,
            _,_,2,3,_,_,_,_,
            _,_,5,7,_,_,_,_,
            _,_,_,_,1,_,_,_,
            _,_,_,_,_,1,_,_,
            _,_,_,_,_,_,2,3,
            _,_,_,_,_,_,5,7
        ));
    assertThat(Matrix.square(2, 3, 5, 7).
        expandedForQubitInRegister(0, 3, Controls.bit(2, false))).isEqualTo(Matrix.square(
            2,3,_,_,_,_,_,_,
            5,7,_,_,_,_,_,_,
            _,_,2,3,_,_,_,_,
            _,_,5,7,_,_,_,_,
            _,_,_,_,1,_,_,_,
            _,_,_,_,_,1,_,_,
            _,_,_,_,_,_,1,_,
            _,_,_,_,_,_,_,1
        ));
});

suite.test("applyToStateVectorAtQubitWithControls", () => {
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 0, Controls.NONE)).isEqualTo(Matrix.col(2, 3, 2, 3, 2, 3, 2, 3));
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 1, Controls.NONE)).isEqualTo(Matrix.col(2, 2, 3, 3, 2, 2, 3, 3));
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 2, Controls.NONE)).isEqualTo(Matrix.col(2, 2, 2, 2, 3, 3, 3, 3));

    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 2, Controls.bit(0, false))).isEqualTo(Matrix.col(2, 1, 2, 1, 3, 1, 3, 1));
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 2, Controls.bit(0, true))).isEqualTo(Matrix.col(1, 2, 1, 2, 1, 3, 1, 3));
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 2, Controls.bit(1, false))).isEqualTo(Matrix.col(2, 2, 1, 1, 3, 3, 1, 1));

    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 0, Controls.bit(2, false))).isEqualTo(Matrix.col(2, 3, 2, 3, 1, 1, 1, 1));
    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 0, Controls.bit(2, true))).isEqualTo(Matrix.col(1, 1, 1, 1, 2, 3, 2, 3));

    assertThat(Matrix.square(2, 0, 0, 3).applyToStateVectorAtQubitWithControls(
        Matrix.col(...new Array(8).fill(1)), 1, Controls.bit(0, false).and(Controls.bit(2, true)))).isEqualTo(
            Matrix.col(1, 1, 1, 1, 2, 1, 3, 1));

    let m = Matrix.square(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(17, 19));
    let v = Matrix.col(new Complex(108, 109), new Complex(112, 113));
    let p = m.times(v);
    assertThat(m.applyToStateVectorAtQubitWithControls(
            Matrix.col(
                new Complex(100, 101),
                new Complex(102, 103),
                new Complex(104, 105),
                new Complex(106, 107),
                new Complex(108, 109),
                new Complex(110, 111),
                new Complex(112, 113),
                new Complex(114, 115)),
            1,
            Controls.bit(0, false).and(Controls.bit(2, true)))).
        isEqualTo(Matrix.col(
            new Complex(100, 101),
            new Complex(102, 103),
            new Complex(104, 105),
            new Complex(106, 107),
            p.cell(0, 0),
            new Complex(110, 111),
            p.cell(0, 1),
            new Complex(114, 115)));
});
