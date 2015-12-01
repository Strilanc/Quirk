import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Complex from "src/math/Complex.js"

import Format from "src/base/Format.js"

let suite = new Suite("Complex");

suite.test("isEqualTo", () => {
    var c = new Complex(5, 7);
    assertThat(c).isEqualTo(c);
    assertThat(c).isNotEqualTo(null);
    assertThat(c).isNotEqualTo("");

    assertThat(new Complex(2, 3)).isEqualTo(new Complex(2, 3));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(3, 3));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(2, 4));
    assertThat(new Complex(2, 3)).isNotEqualTo(new Complex(3, 2));

    assertThat(new Complex(0, 0)).isEqualTo(0);
    assertThat(new Complex(1, 0)).isEqualTo(1);
    assertThat(new Complex(0, 0)).isNotEqualTo(1);
    assertThat(new Complex(0, 1)).isNotEqualTo(1);
    assertThat(new Complex(2.5, 0)).isEqualTo(2.5);
    assertThat(new Complex(0, 2.5)).isNotEqualTo(2.5);
});

suite.test("isApproximatelyEqualTo", () => {
    var c = new Complex(5, 7);
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
    assertThat(new Complex(0, 0).toString()).isEqualTo("0");

    assertThat(new Complex(1, 0).toString()).isEqualTo("1");
    assertThat(new Complex(0, 1).toString()).isEqualTo("i");
    assertThat(new Complex(1, 1).toString()).isEqualTo("1+i");

    assertThat(new Complex(-1, 0).toString()).isEqualTo("-1");
    assertThat(new Complex(0, -1).toString()).isEqualTo("-i");
    assertThat(new Complex(-1, -1).toString()).isEqualTo("-1-i");

    assertThat(new Complex(2, 0).toString()).isEqualTo("2");
    assertThat(new Complex(0, 2).toString()).isEqualTo("2i");
    assertThat(new Complex(2, 2).toString()).isEqualTo("2+2i");

    assertThat(new Complex(2, -3).toString()).isEqualTo("2-3i");
    assertThat(new Complex(Math.sqrt(1/2), -1/3).toString()).isEqualTo("\u221A\u00BD-\u2153i");

    assertThat(new Complex(2, -3).toString(Format.CONSISTENT)).isEqualTo("+2.000-3.000i");
    assertThat(new Complex(2, -3).toString(Format.EXACT)).isEqualTo("2-3i");
    assertThat(new Complex(2, -3).toString(Format.MINIFIED)).isEqualTo("2-3i");
    assertThat(new Complex(2, -3).toString(Format.SIMPLIFIED)).isEqualTo("2-3i");

    assertThat(new Complex(-2, -3).toString(Format.CONSISTENT)).isEqualTo("-2.000-3.000i");
    assertThat(new Complex(-2, -3).toString(Format.EXACT)).isEqualTo("-2-3i");
    assertThat(new Complex(-2, -3).toString(Format.MINIFIED)).isEqualTo("-2-3i");
    assertThat(new Complex(-2, -3).toString(Format.SIMPLIFIED)).isEqualTo("-2-3i");

    assertThat(new Complex(0, -1).toString(Format.CONSISTENT)).isEqualTo("+0.000-1.000i");
    assertThat(new Complex(0, -1).toString(Format.EXACT)).isEqualTo("-i");
    assertThat(new Complex(0, -1).toString(Format.MINIFIED)).isEqualTo("-i");
    assertThat(new Complex(0, -1).toString(Format.SIMPLIFIED)).isEqualTo("-i");

    assertThat(new Complex(1/3, 0).toString(Format.CONSISTENT)).isEqualTo("+0.333+0.000i");
    assertThat(new Complex(1/3, 0).toString(Format.EXACT)).isEqualTo("\u2153");
    assertThat(new Complex(1/3, 0).toString(Format.MINIFIED)).isEqualTo("\u2153");
    assertThat(new Complex(1/3, 0).toString(Format.SIMPLIFIED)).isEqualTo("\u2153");

    assertThat(new Complex(1/3+0.00001, 0).toString(Format.CONSISTENT)).isEqualTo("+0.333+0.000i");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.EXACT)).isEqualTo("0.3333433333333333");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.MINIFIED)).isEqualTo("0.3333433333333333");
    assertThat(new Complex(1/3+0.00001, 0).toString(Format.SIMPLIFIED)).isEqualTo("\u2153");
});

suite.test("parse", () => {
    assertThat(Complex.parse("0")).isEqualTo(new Complex(0, 0));
    assertThat(Complex.parse("1")).isEqualTo(new Complex(1, 0));
    assertThat(Complex.parse("-1")).isEqualTo(new Complex(-1, 0));
    assertThat(Complex.parse("i")).isEqualTo(new Complex(0, 1));
    assertThat(Complex.parse("-i")).isEqualTo(new Complex(0, -1));
    assertThat(Complex.parse("2")).isEqualTo(new Complex(2, 0));
    assertThat(Complex.parse("2i")).isEqualTo(new Complex(0, 2));
    assertThat(Complex.parse("-2i")).isEqualTo(new Complex(0, -2));

    assertThat(Complex.parse("3-2i")).isEqualTo(new Complex(3, -2));
    assertThat(Complex.parse("1-i")).isEqualTo(new Complex(1, -1));
    assertThat(Complex.parse("1+i")).isEqualTo(new Complex(1, 1));
    assertThat(Complex.parse("-5+2i")).isEqualTo(new Complex(-5, 2));
    assertThat(Complex.parse("-5-2i")).isEqualTo(new Complex(-5, -2));

    assertThat(Complex.parse("\u221A2-\u2153i")).isEqualTo(new Complex(Math.sqrt(2), -1/3));
});

suite.test("norm2", () => {
    assertThat(new Complex(0, 0).norm2()).isEqualTo(0);

    assertThat(new Complex(1, 0).norm2()).isEqualTo(1);
    assertThat(new Complex(0, 1).norm2()).isEqualTo(1);

    assertThat(new Complex(1, 1).norm2()).isEqualTo(2);

    assertThat(new Complex(2, 0).norm2()).isEqualTo(4);
    assertThat(new Complex(0, 2).norm2()).isEqualTo(4);
    assertThat(new Complex(-2, 0).norm2()).isEqualTo(4);
    assertThat(new Complex(0, -2).norm2()).isEqualTo(4);

    assertThat(new Complex(2, 3).norm2()).isEqualTo(13);
    assertThat(new Complex(-3, -4).norm2()).isEqualTo(25);
});

suite.test("abs", () => {
    assertThat(new Complex(0, 0).abs()).isEqualTo(0);

    assertThat(new Complex(1, 0).abs()).isEqualTo(1);
    assertThat(new Complex(0, 1).abs()).isEqualTo(1);

    assertThat(new Complex(2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, 2).abs()).isEqualTo(2);
    assertThat(new Complex(-2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, -2).abs()).isEqualTo(2);

    assertThat(new Complex(2, 3).abs()).isApproximatelyEqualTo(Math.sqrt(13));
    assertThat(new Complex(-3, -4).abs()).isEqualTo(5);
});

suite.test("conjugate", () => {
    assertThat(new Complex(0, 0).conjugate()).isEqualTo(new Complex(0, 0));
    assertThat(new Complex(2, 3).conjugate()).isEqualTo(new Complex(2, -3));
});

suite.test("phase", () => {
    assertThat(new Complex(0, 0).phase()).isEqualTo(0);

    assertThat(new Complex(1, 0).phase()).isEqualTo(0);
    assertThat(new Complex(0, 1).phase()).isApproximatelyEqualTo(Math.PI/2);
    assertThat(new Complex(-1, 0).phase()).isApproximatelyEqualTo(Math.PI);
    assertThat(new Complex(0, -1).phase()).isApproximatelyEqualTo(-Math.PI/2);

    assertThat(new Complex(1, 1).phase()).isApproximatelyEqualTo(Math.PI/4);
    assertThat(new Complex(2, 1).phase()).isApproximatelyEqualTo(Math.PI*0.1475836);
});

suite.test("unit", () => {
    assertThat(new Complex(0, 0).unit().isEqualTo(1));

    assertThat(new Complex(0.5, 0).unit().isEqualTo(1));
    assertThat(new Complex(1, 0).unit().isEqualTo(1));
    assertThat(new Complex(2, 0).unit().isEqualTo(1));

    assertThat(new Complex(-0.5, 0).unit().isEqualTo(-1));
    assertThat(new Complex(-1, 0).unit().isEqualTo(-1));
    assertThat(new Complex(-2, 0).unit().isEqualTo(-1));

    assertThat(new Complex(0, 0.5).unit().isEqualTo(Complex.I));
    assertThat(new Complex(0, 1).unit().isEqualTo(Complex.I));
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
    assertThrows(() => new Complex(1, 0).dividedBy(0));
    assertThat(new Complex(2, 3).dividedBy(new Complex(2, 0))).isEqualTo(new Complex(1, 1.5));
    assertThat(new Complex(2, 3).dividedBy(new Complex(0, 2))).isEqualTo(new Complex(1.5, -1));
    assertThat(new Complex(2, -2).dividedBy(new Complex(1, 1))).isEqualTo(new Complex(0, -2));
});

suite.test("sqrts", () => {
    let s = Math.sqrt(0.5);
    assertThat(Complex.ZERO.sqrts()).isEqualTo([0]);
    assertThat(Complex.ONE.sqrts()).isEqualTo([1, -1]);
    assertThat(Complex.I.sqrts()).isApproximatelyEqualTo([new Complex(s, s), new Complex(-s, -s)]);
    assertThat(Complex.ONE.times(-1).sqrts()).isEqualTo([new Complex(0, 1), new Complex(0, -1)]);
    assertThat(new Complex(4, 0).sqrts()).isEqualTo([2, -2]);
    assertThat(new Complex(0, -4).sqrts()).isApproximatelyEqualTo([new Complex(s*2, -s*2), new Complex(-s*2, s*2)]);
});

suite.test("rootsOfQuadratic", () => {
    assertThrows(() => Complex.rootsOfQuadratic(0, 0, 0));

    assertThat(Complex.rootsOfQuadratic(0, 0, 1)).isEqualTo([]);

    assertThat(Complex.rootsOfQuadratic(1, 0, 4)).isEqualTo([new Complex(0, -2), new Complex(0, 2)]);
    assertThat(Complex.rootsOfQuadratic(1, 0, 1)).isEqualTo([new Complex(0, -1), new Complex(0, 1)]);
    assertThat(Complex.rootsOfQuadratic(1, 0, 0)).isEqualTo([0]);
    assertThat(Complex.rootsOfQuadratic(1, 0, -1)).isEqualTo([-1, 1]);
    assertThat(Complex.rootsOfQuadratic(1, 0, -4)).isEqualTo([-2, 2]);

    assertThat(Complex.rootsOfQuadratic(1, 1, 0)).isEqualTo([-1, 0]);
    assertThat(Complex.rootsOfQuadratic(1, 7, 12)).isEqualTo([-4, -3]);
    assertThat(Complex.rootsOfQuadratic(2, 14, 24)).isEqualTo([-4, -3]);

    let s = Math.sqrt(0.5);
    assertThat(Complex.rootsOfQuadratic(1, 0, new Complex(0, -1))).
        isApproximatelyEqualTo([new Complex(-s, -s), new Complex(s, s)]);
});

suite.test("exp", () => {
    assertThat(Complex.ZERO.exp()).isEqualTo(1);
    assertThat(Complex.ONE.exp()).isApproximatelyEqualTo(Math.E);
    assertThat(Complex.I.times(Math.PI).exp()).isApproximatelyEqualTo(-1);
    assertThat(Complex.I.times(2*Math.PI).exp()).isApproximatelyEqualTo(1);
    assertThat(Complex.I.times(Math.PI/2).exp()).isApproximatelyEqualTo(Complex.I);
    assertThat(new Complex(2, 0).exp()).isApproximatelyEqualTo(Math.E*Math.E);
    assertThat(new Complex(2, Math.PI).exp()).isApproximatelyEqualTo(-Math.E*Math.E);
});

suite.test("ln", () => {
    assertThat(Complex.ONE.ln()).isEqualTo(0);
    assertThat(new Complex(Math.E, 0).ln()).isApproximatelyEqualTo(1);
    assertThat(new Complex(-1, 0).ln()).isApproximatelyEqualTo(new Complex(0, Math.PI));
    assertThat(new Complex(0, 1).ln()).isApproximatelyEqualTo(new Complex(0, Math.PI/2));
    assertThat(new Complex(Math.E*Math.E, 0).ln()).isApproximatelyEqualTo(new Complex(2, 0));
    assertThat(new Complex(-Math.E*Math.E, 0).ln()).isApproximatelyEqualTo(new Complex(2, Math.PI));
});

suite.test("raisedTo", () => {
    assertThat(Complex.I.raisedTo(Complex.I)).isApproximatelyEqualTo(Math.exp(-Math.PI/2));
    assertThat(new Complex(1, 1).raisedTo(new Complex(1, 1))).isApproximatelyEqualTo(
        new Complex(0.2739572538301, 0.5837007587586));
    assertThat(new Complex(2, 3).raisedTo(new Complex(5, 7))).isApproximatelyEqualTo(
        new Complex(0.1525582909989, 0.6079153491494));
});
