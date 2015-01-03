ComplexTest = TestCase("ComplexTest");

ComplexTest.prototype.testIsEqualTo = function() {
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
};

ComplexTest.prototype.testIsApproximatelyEqualTo = function() {
    var c = new Complex(5, 7);
    assertThat(c).isApproximatelyEqualTo(c, 0);
    assertThat(c).isApproximatelyEqualTo(c, 1);
    assertThat(c).isNotApproximatelyEqualTo(new Complex(5, 6), 0.5);
    assertThat(c).isApproximatelyEqualTo(new Complex(5, 6), 1);
    assertThat(c).isApproximatelyEqualTo(new Complex(5, 8), 1);

    assertThat(c).isNotApproximatelyEqualTo(null);
    assertThat(c).isNotApproximatelyEqualTo("");
};

ComplexTest.prototype.testFrom = function() {
    assertThat(Complex.from(1).real).isEqualTo(1);
    assertThat(Complex.from(1).imag).isEqualTo(0);
    assertThat(Complex.from(-1.5).real).isEqualTo(-1.5);
    assertThat(Complex.from(-1.5).imag).isEqualTo(0);
    assertThat(Complex.from(new Complex(2, 3)).real).isEqualTo(2);
    assertThat(Complex.from(new Complex(2, 3)).imag).isEqualTo(3);
};

ComplexTest.prototype.testRealPartOf = function() {
    assertThat(Complex.realPartOf(1)).isEqualTo(1);
    assertThat(Complex.realPartOf(1.5)).isEqualTo(1.5);
    assertThat(Complex.realPartOf(-2)).isEqualTo(-2);
    assertThat(Complex.realPartOf(new Complex(3, 1))).isEqualTo(3);
    assertThat(Complex.realPartOf(new Complex(5, 0))).isEqualTo(5);
};

ComplexTest.prototype.testImagPartOf = function() {
    assertThat(Complex.imagPartOf(1)).isEqualTo(0);
    assertThat(Complex.imagPartOf(1.5)).isEqualTo(0);
    assertThat(Complex.imagPartOf(-2)).isEqualTo(0);
    assertThat(Complex.imagPartOf(new Complex(3, 0))).isEqualTo(0);
    assertThat(Complex.imagPartOf(new Complex(3, 1))).isEqualTo(1);
    assertThat(Complex.imagPartOf(new Complex(5, -2))).isEqualTo(-2);
};

ComplexTest.prototype.testToString = function() {
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
    assertThat(new Complex(Math.sqrt(1/2), -1/3).toString()).isEqualTo("√½-⅓i");
};

ComplexTest.prototype.testParse = function() {
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

    assertThat(Complex.parse("√2-⅓i")).isEqualTo(new Complex(Math.sqrt(2), -1/3));
};

ComplexTest.prototype.testNorm2 = function() {
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
};

ComplexTest.prototype.testAbs = function() {
    assertThat(new Complex(0, 0).abs()).isEqualTo(0);

    assertThat(new Complex(1, 0).abs()).isEqualTo(1);
    assertThat(new Complex(0, 1).abs()).isEqualTo(1);

    assertThat(new Complex(2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, 2).abs()).isEqualTo(2);
    assertThat(new Complex(-2, 0).abs()).isEqualTo(2);
    assertThat(new Complex(0, -2).abs()).isEqualTo(2);

    assertThat(new Complex(2, 3).abs()).isApproximatelyEqualTo(Math.sqrt(13));
    assertThat(new Complex(-3, -4).abs()).isEqualTo(5);
};

ComplexTest.prototype.testConjugate = function() {
    assertThat(new Complex(0, 0).conjugate()).isEqualTo(new Complex(0, 0));
    assertThat(new Complex(2, 3).conjugate()).isEqualTo(new Complex(2, -3));
};

ComplexTest.prototype.testPhase = function() {
    assertThat(new Complex(0, 0).phase()).isEqualTo(0);

    assertThat(new Complex(1, 0).phase()).isEqualTo(0);
    assertThat(new Complex(0, 1).phase()).isApproximatelyEqualTo(Math.PI/2);
    assertThat(new Complex(-1, 0).phase()).isApproximatelyEqualTo(Math.PI);
    assertThat(new Complex(0, -1).phase()).isApproximatelyEqualTo(-Math.PI/2);

    assertThat(new Complex(1, 1).phase()).isApproximatelyEqualTo(Math.PI/4);
    assertThat(new Complex(2, 1).phase()).isApproximatelyEqualTo(Math.PI*0.1475836);
};

ComplexTest.prototype.testUnit = function() {
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
};

ComplexTest.prototype.testPlus = function() {
    assertThat(new Complex(2, 3).plus(new Complex(5, 7))).isEqualTo(new Complex(7, 10));
    assertThat(new Complex(2, 3).plus(5)).isEqualTo(new Complex(7, 3));
};

ComplexTest.prototype.testMinus = function() {
    assertThat(new Complex(2, 3).minus(new Complex(5, 7))).isEqualTo(new Complex(-3, -4));
    assertThat(new Complex(2, 3).minus(5)).isEqualTo(new Complex(-3, 3));
};

ComplexTest.prototype.testTimes = function() {
    assertThat(new Complex(2, 3).times(new Complex(5, 7))).isEqualTo(new Complex(-11, 29));
    assertThat(new Complex(2, 3).times(5)).isEqualTo(new Complex(10, 15));
};

ComplexTest.prototype.testDividedBy = function() {
    assertThat(new Complex(2, 3).dividedBy(new Complex(2, 0))).isEqualTo(new Complex(1, 1.5));
    assertThat(new Complex(2, 3).dividedBy(new Complex(0, 2))).isEqualTo(new Complex(1.5, -1));
    assertThat(new Complex(2, -2).dividedBy(new Complex(1, 1))).isEqualTo(new Complex(0, -2));
};
