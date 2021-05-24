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

import {Suite, assertThat, assertThrows, assertTrue} from "../TestUtil.js"
import {Complex} from "../../src/math/Complex.js"

import {Format} from "../../src/base/Format.js"

let suite = new Suite("Complex");

suite.test("isEqualTo", () => {
    let c = new Complex(5, 7);
    assertThat(c).isEqualTo(c);
    assertThat(c).isNotEqualTo(null);
    assertThat(c).isNotEqualTo("");

    assertThat(new Complex(2, 3)).isEqualTo(new Complex(2, 3));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(3, 3));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(2, 4));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(3, 2));

    assertThat(Complex.ZERO).isEqualTo(0);
    assertThat(Complex.ONE).isEqualTo(1);
    assertThat(Complex.ZERO).isNotEqualTo(1);
    assertThat(Complex.I).isNotEqualTo(1);
    assertThat(new Complex(2.5, 0)).isEqualTo(2.5);
    assertThat(new Complex(0, 2.5)).isNotEqualTo(2.5);
});

suite.test("polar", () => {
    assertThat(Complex.polar(0, 0)).isEqualTo(0);
    assertThat(Complex.polar(0, 2)).isEqualTo(0);
    assertThat(Complex.polar(0, -5)).isEqualTo(0);

    assertThat(Complex.polar(1, 0)).isEqualTo(1);
    assertThat(Complex.polar(2, 0)).isEqualTo(2);

    assertThat(Complex.polar(1, Math.PI)).isEqualTo(-1);
    assertThat(Complex.polar(1, 3*Math.PI)).isEqualTo(-1);
    assertThat(Complex.polar(1, -Math.PI)).isEqualTo(-1);

    assertThat(Complex.polar(1, Math.PI/2)).isEqualTo(Complex.I);
    assertThat(Complex.polar(1, 3*Math.PI/2)).isEqualTo(Complex.I.times(-1));

    assertThat(Complex.polar(1, Math.PI/4)).isEqualTo(new Complex(Math.sqrt(0.5), Math.sqrt(0.5)));
    assertThat(Complex.polar(Math.sqrt(2), Math.PI/4)).isApproximatelyEqualTo(new Complex(1, 1));
});

suite.test("isApproximatelyEqualTo", () => {
    let c = new Complex(5, 7);
    assertThat(c).isApproximatelyEqualTo(c, 0);
    assertThat(c).isApproximatelyEqualTo(c, 1);
    assertThat(c).isNotApproximatelyEqualTo(new Complex(5, 6), 0.5);
    assertThat(c).isApproximatelyEqualTo(new Complex(5, 6), 1);
    assertThat(c).isApproximatelyEqualTo(new Complex(5, 8), 1);

    assertThat(c).isNotApproximatelyEqualTo(null);
    assertThat(c).isNotApproximatelyEqualTo("");
});

suite.test("from", () => {
    assertThat(Complex.from(1).real).isEqualTo(1);
    assertThat(Complex.from(1).imag).isEqualTo(0);
    assertThat(Complex.from(-1.5).real).isEqualTo(-1.5);
    assertThat(Complex.from(-1.5).imag).isEqualTo(0);
    assertThat(Complex.from(new Complex(2, 3)).real).isEqualTo(2);
    assertThat(Complex.from(new Complex(2, 3)).imag).isEqualTo(3);
});

suite.test("realPartOf", () => {
    assertThat(Complex.realPartOf(1)).isEqualTo(1);
    assertThat(Complex.realPartOf(1.5)).isEqualTo(1.5);
    assertThat(Complex.realPartOf(-2)).isEqualTo(-2);
    assertThat(Complex.realPartOf(new Complex(3, 1))).isEqualTo(3);
    assertThat(Complex.realPartOf(new Complex(5, 0))).isEqualTo(5);
});

suite.test("imagPartOf", () => {
    assertThat(Complex.imagPartOf(1)).isEqualTo(0);
    assertThat(Complex.imagPartOf(1.5)).isEqualTo(0);
    assertThat(Complex.imagPartOf(-2)).isEqualTo(0);
    assertThat(Complex.imagPartOf(new Complex(3, 0))).isEqualTo(0);
    assertThat(Complex.imagPartOf(new Complex(3, 1))).isEqualTo(1);
    assertThat(Complex.imagPartOf(new Complex(5, -2))).isEqualTo(-2);
});

suite.test("toString", () => {
    assertThat(Complex.ZERO.toString()).isEqualTo("0");

    assertThat(Complex.ONE.toString()).isEqualTo("1");
    assertThat(Complex.I.toString()).isEqualTo("i");
    assertThat(new Complex(1, 1).toString()).isEqualTo("1+i");

    assertThat(new Complex(-1, 0).toString()).isEqualTo("-1");
    assertThat(new Complex(0, -1).toString()).isEqualTo("-i");
    assertThat(new Complex(-1, -1).toString()).isEqualTo("-1-i");

    assertThat(new Complex(2, 0).toString()).isEqualTo("2");
    assertThat(new Complex(0, 2).toString()).isEqualTo("2i");
    assertThat(new Complex(2, 2).toString()).isEqualTo("2+2i");

    assertThat(new Complex(2, -3).toString()).isEqualTo("2-3i");
    assertThat(new Complex(Math.sqrt(1/2), -1/3).toString()).isEqualTo("\u221A\u00BD-\u2153i");

    assertThat(new Complex(2, -3).toString(Format.CONSISTENT)).isEqualTo("+2.00-3.00i");
    assertThat(new Complex(2, -3).toString(Format.EXACT)).isEqualTo("2-3i");
    assertThat(new Complex(2, -3).toString(Format.MINIFIED)).isEqualTo("2-3i");
    assertThat(new Complex(2, -3).toString(Format.SIMPLIFIED)).isEqualTo("2-3i");

    assertThat(new Complex(-2, -3).toString(Format.CONSISTENT)).isEqualTo("-2.00-3.00i");
    assertThat(new Complex(-2, -3).toString(Format.EXACT)).isEqualTo("-2-3i");
    assertThat(new Complex(-2, -3).toString(Format.MINIFIED)).isEqualTo("-2-3i");
    assertThat(new Complex(-2, -3).toString(Format.SIMPLIFIED)).isEqualTo("-2-3i");

    assertThat(new Complex(0, -1).toString(Format.CONSISTENT)).isEqualTo("+0.00-1.00i");
    assertThat(new Complex(0, -1).toString(Format.EXACT)).isEqualTo("-i");
    assertThat(new Complex(0, -1).toString(Format.MINIFIED)).isEqualTo("-i");
    assertThat(new Complex(0, -1).toString(Format.SIMPLIFIED)).isEqualTo("-i");

    assertThat(new Complex(1/3, 0).toString(Format.CONSISTENT)).isEqualTo("+0.33+0.00i");
    assertThat(new Complex(1/3, 0).toString(Format.EXACT)).isEqualTo("\u2153");
    assertThat(new Complex(1/3, 0).toString(Format.MINIFIED)).isEqualTo("\u2153");
    assertThat(new Complex(1/3, 0).toString(Format.SIMPLIFIED)).isEqualTo("\u2153");
});

suite.test("toString_perturbed", () => {
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.CONSISTENT)).isEqualTo("+0.33+0.00i");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.EXACT)).isEqualTo("0.3333433333333333");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.MINIFIED)).isEqualTo("0.3333433333333333");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.SIMPLIFIED)).isEqualTo("\u2153");
});

suite.test("parse_raw", () => {
    assertThrows(() => Complex.parse(""));
    assertThrows(() => Complex.parse("abc"));
    assertThrows(() => Complex.parse("1e_plus1"));
    assertThrows(() => Complex.parse("1e_minus1"));

    assertThat(Complex.parse("0")).isEqualTo(Complex.ZERO);
    assertThat(Complex.parse("1")).isEqualTo(Complex.ONE);
    assertThat(Complex.parse("-1")).isEqualTo(new Complex(-1, 0));
    assertThat(Complex.parse("i")).isEqualTo(Complex.I);
    assertThat(Complex.parse("-i")).isEqualTo(new Complex(0, -1));
    assertThat(Complex.parse("2")).isEqualTo(new Complex(2, 0));
    assertThat(Complex.parse("2i")).isEqualTo(new Complex(0, 2));
    assertThat(Complex.parse("-2i")).isEqualTo(new Complex(0, -2));

    assertThat(Complex.parse("3-2i")).isEqualTo(new Complex(3, -2));
    assertThat(Complex.parse("1-i")).isEqualTo(new Complex(1, -1));
    assertThat(Complex.parse("1+i")).isEqualTo(new Complex(1, 1));
    assertThat(Complex.parse("-5+2i")).isEqualTo(new Complex(-5, 2));
    assertThat(Complex.parse("-5-2i")).isEqualTo(new Complex(-5, -2));

    assertThat(Complex.parse("3/2i")).isEqualTo(new Complex(0, 1.5));

    assertThat(Complex.parse("\u221A2-\u2153i")).isEqualTo(new Complex(Math.sqrt(2), -1/3));

    assertThat(Complex.parse("1e-10")).isEqualTo(new Complex(0.0000000001, 0));
    assertThat(Complex.parse("1e+10")).isEqualTo(new Complex(10000000000, 0));
    assertThat(Complex.parse("2.5e-10")).isEqualTo(new Complex(0.00000000025, 0));
    assertThat(Complex.parse("2.5E-10")).isEqualTo(new Complex(0.00000000025, 0));
    assertThat(Complex.parse("2.5e+10")).isEqualTo(new Complex(25000000000, 0));
});

suite.test("parse_expressions", () => {
    assertThat(Complex.parse("1/3")).isEqualTo(1/3);
    assertThat(Complex.parse("2/3/5")).isEqualTo((2/3)/5);
    assertThat(Complex.parse("2/3/5*7/13")).isEqualTo(((((2/3)/5))*7)/13);
    assertThat(Complex.parse("2-3-5")).isEqualTo(-6);
    assertThat(Complex.parse("1/3+2i")).isEqualTo(new Complex(1/3, 2));
    assertThat(Complex.parse("(1/3)+2i")).isEqualTo(new Complex(1/3, 2));
    assertThat(Complex.parse("1/(3+2i)")).isEqualTo(Complex.ONE.dividedBy(new Complex(3, 2)));
    assertThat(Complex.parse("1/sqrt(3+2i)")).isEqualTo(Complex.ONE.dividedBy(new Complex(3, 2).raisedTo(0.5)));

    assertThat(Complex.parse("i^i")).isEqualTo(0.20787957635076193);
    assertThat(Complex.parse("√i")).isEqualTo(new Complex(Math.sqrt(0.5), Math.sqrt(0.5)));
    assertThat(Complex.parse("√4i")).isEqualTo(new Complex(0, 2));
    assertThat(Complex.parse("sqrt4i")).isEqualTo(new Complex(0, 2));
    assertThat(Complex.parse("sqrt√4i")).isEqualTo(new Complex(0, Math.sqrt(2)));
    assertThat(Complex.parse("sqrt√4-i")).isEqualTo(new Complex(Math.sqrt(2), -1));
    assertThat(Complex.parse("----------1")).isEqualTo(1);
    assertThat(Complex.parse("---------1")).isEqualTo(-1);
    assertThat(Complex.parse("---+--+--1")).isEqualTo(-1);
    assertThat(Complex.parse("0---+--+--1")).isEqualTo(-1);

    assertThat(Complex.parse("0---+--+--1*")).isEqualTo(-1);
    assertThat(Complex.parse("2+3^")).isEqualTo(5);
    assertThat(Complex.parse("cos(45) + i sin(45)")).isApproximatelyEqualTo(
        new Complex(Math.sqrt(0.5), Math.sqrt(0.5)));
    assertThat(Complex.parse("cos(45) + i (sin 45)")).isApproximatelyEqualTo(
        new Complex(Math.sqrt(0.5), Math.sqrt(0.5)));
    assertThat(Complex.parse("e^(pi i)")).isApproximatelyEqualTo(-1);
    assertThat(Complex.parse("exp(ln(2))")).isApproximatelyEqualTo(2);
    assertThat(Complex.parse("sin(arcsin(0.5))")).isApproximatelyEqualTo(0.5);
    assertThat(Complex.parse("cos(arccos(0.5))")).isApproximatelyEqualTo(0.5);
    assertThat(Complex.parse("sin(asin(0.5))")).isApproximatelyEqualTo(0.5);
    assertThat(Complex.parse("cos(acos(0.5))")).isApproximatelyEqualTo(0.5);
});

suite.test("norm2", () => {
    assertThat(Complex.ZERO.norm2()).isEqualTo(0);

    assertThat(Complex.ONE.norm2()).isEqualTo(1);
    assertThat(Complex.I.norm2()).isEqualTo(1);

    assertThat(new Complex(1, 1).norm2()).isEqualTo(2);

    assertThat(new Complex(2, 0).norm2()).isEqualTo(4);
    assertThat(new Complex(0, 2).norm2()).isEqualTo(4);
    assertThat(new Complex(-2, 0).norm2()).isEqualTo(4);
    assertThat(new Complex(0, -2).norm2()).isEqualTo(4);

    assertThat(new Complex(2, 3).norm2()).isEqualTo(13);
    assertThat(new Complex(-3, -4).norm2()).isEqualTo(25);
});

suite.test("abs", () => {
    assertThat(Complex.ZERO.abs()).isEqualTo(0);

    assertThat(Complex.ONE.abs()).isEqualTo(1);
    assertThat(Complex.I.abs()).isEqualTo(1);

    assertThat(new Complex(2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, 2).abs()).isEqualTo(2);
    assertThat(new Complex(-2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, -2).abs()).isEqualTo(2);

    assertThat(new Complex(2, 3).abs()).isApproximatelyEqualTo(Math.sqrt(13));
    assertThat(new Complex(-3, -4).abs()).isEqualTo(5);
});

suite.test("conjugate", () => {
    assertThat(Complex.ZERO.conjugate()).isEqualTo(Complex.ZERO);
    assertThat(new Complex(2, 3).conjugate()).isEqualTo(new Complex(2, -3));
});

suite.test("phase", () => {
    assertThat(Complex.ZERO.phase()).isEqualTo(0);

    assertThat(Complex.ONE.phase()).isEqualTo(0);
    assertThat(Complex.I.phase()).isApproximatelyEqualTo(Math.PI/2);
    assertThat(new Complex(-1, 0).phase()).isApproximatelyEqualTo(Math.PI);
    assertThat(new Complex(0, -1).phase()).isApproximatelyEqualTo(-Math.PI/2);

    assertThat(new Complex(1, 1).phase()).isApproximatelyEqualTo(Math.PI/4);
    assertThat(new Complex(2, 1).phase()).isApproximatelyEqualTo(Math.PI*0.1475836);
});

suite.test("unit", () => {
    assertThat(Complex.ZERO.unit().isEqualTo(1));

    assertThat(new Complex(0.5, 0).unit().isEqualTo(1));
    assertThat(Complex.ONE.unit().isEqualTo(1));
    assertThat(new Complex(2, 0).unit().isEqualTo(1));

    assertThat(new Complex(-0.5, 0).unit().isEqualTo(-1));
    assertThat(new Complex(-1, 0).unit().isEqualTo(-1));
    assertThat(new Complex(-2, 0).unit().isEqualTo(-1));

    assertThat(new Complex(0, 0.5).unit().isEqualTo(Complex.I));
    assertThat(Complex.I.unit().isEqualTo(Complex.I));
    assertThat(new Complex(0, 2).unit().isEqualTo(Complex.I));

    assertThat(new Complex(0, -0.5).unit().isEqualTo(Complex.I.times(-1)));
    assertThat(new Complex(0, -1).unit().isEqualTo(Complex.I.times(-1)));
    assertThat(new Complex(0, -2).unit().isEqualTo(Complex.I.times(-1)));

    assertTrue(new Complex(1, 1).unit().minus(new Complex(Math.sqrt(0.5), Math.sqrt(0.5))).norm2() < 0.0000001);
});

suite.test("plus", () => {
    assertThat(new Complex(2, 3).plus(new Complex(5, 7))).isEqualTo(new Complex(7, 10));
    assertThat(new Complex(2, 3).plus(5)).isEqualTo(new Complex(7, 3));
});

suite.test("minus", () => {
    assertThat(new Complex(2, 3).minus(new Complex(5, 7))).isEqualTo(new Complex(-3, -4));
    assertThat(new Complex(2, 3).minus(5)).isEqualTo(new Complex(-3, 3));
});

suite.test("times", () => {
    assertThat(new Complex(2, 3).times(new Complex(5, 7))).isEqualTo(new Complex(-11, 29));
    assertThat(new Complex(2, 3).times(5)).isEqualTo(new Complex(10, 15));
});

suite.test("dividedBy", () => {
    assertThrows(() => Complex.ONE.dividedBy(0));
    assertThat(new Complex(2, 3).dividedBy(new Complex(2, 0))).isEqualTo(new Complex(1, 1.5));
    assertThat(new Complex(2, 3).dividedBy(new Complex(0, 2))).isEqualTo(new Complex(1.5, -1));
    assertThat(new Complex(2, -2).dividedBy(new Complex(1, 1))).isEqualTo(new Complex(0, -2));
});

suite.test("sqrts", () => {
    let s = Math.sqrt(0.5);
    assertThat(Complex.ZERO.sqrts()).isEqualTo([0]);
    assertThat(Complex.ONE.sqrts()).isEqualTo([1, -1]);
    assertThat(Complex.I.sqrts()).isApproximatelyEqualTo([new Complex(s, s), new Complex(-s, -s)]);
    assertThat(Complex.ONE.times(-1).sqrts()).isEqualTo([Complex.I, new Complex(0, -1)]);
    assertThat(new Complex(4, 0).sqrts()).isEqualTo([2, -2]);
    assertThat(new Complex(0, -4).sqrts()).isApproximatelyEqualTo([new Complex(s*2, -s*2), new Complex(-s*2, s*2)]);
});

suite.test("rootsOfQuadratic", () => {
    // Infinitely many solutions.
    assertThrows(() => Complex.rootsOfQuadratic(0, 0, 0));

    // No solutions.
    assertThat(Complex.rootsOfQuadratic(0, 0, 1)).isEqualTo([]);
    assertThat(Complex.rootsOfQuadratic(0, 0, Complex.I)).isEqualTo([]);

    // Single solutions due to degenerate linear case.
    assertThat(Complex.rootsOfQuadratic(0, 1, 1)).isEqualTo([-1]);
    assertThat(Complex.rootsOfQuadratic(0, Complex.I, Complex.I)).isEqualTo([-1]);
    assertThat(Complex.rootsOfQuadratic(0, 2, 3)).isEqualTo([-1.5]);

    // Single solution due to root multiplicity.
    assertThat(Complex.rootsOfQuadratic(1, 0, 0)).isEqualTo([0]);
    assertThat(Complex.rootsOfQuadratic(1, 2, 1)).isEqualTo([-1]);

    // Two mirrored solutions.
    assertThat(Complex.rootsOfQuadratic(1, 0, 4)).isEqualTo([new Complex(0, -2), new Complex(0, 2)]);
    assertThat(Complex.rootsOfQuadratic(1, 0, 1)).isEqualTo([new Complex(0, -1), Complex.I]);
    assertThat(Complex.rootsOfQuadratic(1, 0, -1)).isEqualTo([-1, 1]);
    assertThat(Complex.rootsOfQuadratic(1, 0, -4)).isEqualTo([-2, 2]);

    // Two solutions. General.
    assertThat(Complex.rootsOfQuadratic(1, 1, 0)).isEqualTo([-1, 0]);
    assertThat(Complex.rootsOfQuadratic(1, 7, 12)).isEqualTo([-4, -3]);
    assertThat(Complex.rootsOfQuadratic(2, 14, 24)).isEqualTo([-4, -3]);

    // Complex coefficient.
    let s = Math.sqrt(0.5);
    assertThat(Complex.rootsOfQuadratic(1, 0, new Complex(0, -1))).
        isApproximatelyEqualTo([new Complex(-s, -s), new Complex(s, s)]);
    assertThat(Complex.rootsOfQuadratic(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13))).
        isApproximatelyEqualTo([new Complex(-1.06911, 1.85157), new Complex(-1.31551, -1.77465)], 0.0001);
});

suite.test("rootsOfQuadratic_fuzz", () => {
    for (let i = 0; i < 100; i++) {
        // Random point on surface of unit sphere.
		let theta = 2*Math.PI*Math.random();
		let phi = Math.acos(2*Math.random() - 1);
		let a = Math.cos(theta)*Math.sin(phi);
		let b = Math.sin(theta)*Math.sin(phi);
		let c = Math.cos(phi);

        // Check that returned roots are actually roots.
        // (Note: will not detect missed roots.)
        let roots = Complex.rootsOfQuadratic(a, b, c);
        for (let x of roots) {
            let y = x.times(x).times(a).plus(x.times(b)).plus(c);
            assertThat(y).isApproximatelyEqualTo(0);
        }
    }
});

suite.test("exp", () => {
    let π = Math.PI;
    let i = Complex.I;
    let s = Math.sqrt(0.5);

    assertThat(Complex.ZERO.exp()).isEqualTo(1);
    assertThat(Complex.ONE.exp()).isApproximatelyEqualTo(Math.E);
    assertThat(new Complex(2, 0).exp()).isApproximatelyEqualTo(Math.E*Math.E);
    assertThat(new Complex(2, π).exp()).isApproximatelyEqualTo(-Math.E*Math.E);

    // Unit circle.
    assertThat(i.times(-π).exp()).isEqualTo(-1);
    assertThat(i.times(-π/2).exp()).isEqualTo(i.neg());
    assertThat(i.times(π/4).exp()).isEqualTo(new Complex(s, s));
    assertThat(i.times(π/2).exp()).isEqualTo(i);
    assertThat(i.times(π).exp()).isApproximatelyEqualTo(-1);
    assertThat(i.times(3*π/2).exp()).isEqualTo(i.neg());
    assertThat(i.times(2*π).exp()).isEqualTo(1);
});

suite.test("ln", () => {
    let π = Math.PI;

    assertThat(Complex.ONE.ln()).isEqualTo(0);
    assertThat(new Complex(Math.E, 0).ln()).isApproximatelyEqualTo(1);
    assertThat(new Complex(-1, 0).ln()).isApproximatelyEqualTo(new Complex(0, π));
    assertThat(Complex.I.ln()).isApproximatelyEqualTo(new Complex(0, π/2));
    assertThat(new Complex(Math.E*Math.E, 0).ln()).isApproximatelyEqualTo(new Complex(2, 0));
    assertThat(new Complex(-Math.E*Math.E, 0).ln()).isApproximatelyEqualTo(new Complex(2, π));

    assertThat(Complex.I.ln().isEqualTo(new Complex(0, π/2)));
    assertThat(new Complex(1, 1).ln().isEqualTo(new Complex(Math.log(2), π/4)));
    assertThat(Complex.I.neg().ln().isEqualTo(new Complex(0, -π/2)));
    assertThat(new Complex(-1, -1).ln().isEqualTo(new Complex(Math.log(2), -3*π/4)));
});

suite.test("neg", () => {
    assertThat(new Complex(3, 5).neg()).isEqualTo(new Complex(-3, -5));
});

suite.test("raisedTo", () => {
    let π = Math.PI;
    let i = Complex.I;
    let e = new Complex(Math.E, 0);
    let s = Math.sqrt(0.5);

    // Unit circle axes.
    assertThat(e.raisedTo(i.times(-π/2))).isEqualTo(i.neg());
    assertThat(e.raisedTo(i.times(0))).isEqualTo(1);
    assertThat(e.raisedTo(i.times(π/2))).isEqualTo(i);
    assertThat(e.raisedTo(i.times(π))).isEqualTo(-1);
    assertThat(e.raisedTo(i.times(3*π/2))).isEqualTo(i.neg());
    assertThat(e.raisedTo(i.times(2*π))).isEqualTo(1);

    // Unit circle diagonals.
    assertThat(e.raisedTo(i.times(-π/4))).isEqualTo(new Complex(s, -s));
    assertThat(e.raisedTo(i.times(π/4))).isEqualTo(new Complex(s, s));
    assertThat(e.raisedTo(i.times(3*π/4))).isEqualTo(new Complex(-s, s));
    assertThat(e.raisedTo(i.times(5*π/4))).isEqualTo(new Complex(-s, -s));

    // Zero.
    assertThat(Complex.ZERO.raisedTo(2)).isEqualTo(0);
    assertThat(Complex.ZERO.raisedTo(new Complex(1, 3))).isEqualTo(0);
    assertThat(new Complex(2, 3).raisedTo(0)).isEqualTo(1);

    // Base negative 1.
    assertThat(new Complex(-1, 0).raisedTo(0)).isEqualTo(1);
    assertThat(new Complex(-1, 0).raisedTo(0.5)).isEqualTo(i);
    assertThat(new Complex(-1, 0).raisedTo(-0.5)).isEqualTo(i.neg());
    assertThat(new Complex(-1, 0).raisedTo(1)).isEqualTo(-1);

    // Misc.
    assertThat(i.raisedTo(i)).isApproximatelyEqualTo(Math.exp(-π/2));
    assertThat(new Complex(1, 1).raisedTo(new Complex(1, 1))).isApproximatelyEqualTo(
        new Complex(0.2739572538301, 0.5837007587586));
    assertThat(new Complex(2, 3).raisedTo(new Complex(5, 7))).isApproximatelyEqualTo(
        new Complex(0.1525582909989, 0.6079153491494));
});

suite.test("trig", () => {
    assertThat(Complex.from(0.2).cos()).isApproximatelyEqualTo(Complex.from(Math.cos(0.2)));
    assertThat(Complex.from(0.2).sin()).isApproximatelyEqualTo(Complex.from(Math.sin(0.2)));
    assertThat(Complex.from(0.2).tan()).isApproximatelyEqualTo(Complex.from(Math.tan(0.2)));
});
