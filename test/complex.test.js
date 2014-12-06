ComplexTest = TestCase("ComplexTest");

ComplexTest.prototype.testFrom = function() {
    assertEquals(Complex.from(1).real, 1);
    assertEquals(Complex.from(1).imag, 0);
    assertEquals(Complex.from(-1.5).real, -1.5);
    assertEquals(Complex.from(-1.5).imag, 0);
    assertEquals(Complex.from(new Complex(2, 3)).real, 2);
    assertEquals(Complex.from(new Complex(2, 3)).imag, 3);
};

ComplexTest.prototype.testIsEqualTo = function() {
    var c = new Complex(5, 7);
    assertTrue(c.isEqualTo(c));

    assertTrue(new Complex(2, 3).isEqualTo(new Complex(2, 3)));
    assertFalse(new Complex(2, 3).isEqualTo(new Complex(3, 3)));
    assertFalse(new Complex(2, 3).isEqualTo(new Complex(2, 4)));
    assertFalse(new Complex(2, 3).isEqualTo(new Complex(3, 2)));

    assertTrue(new Complex(0, 0).isEqualTo(0));
    assertTrue(new Complex(2.5, 0).isEqualTo(2.5));
    assertFalse(new Complex(0, 2.5).isEqualTo(2.5));
};

ComplexTest.prototype.testToString = function() {
    assertEquals("0", new Complex(0, 0).toString());

    assertEquals("1", new Complex(1, 0).toString());
    assertEquals("i", new Complex(0, 1).toString());
    assertEquals("1+i", new Complex(1, 1).toString());

    assertEquals("-1", new Complex(-1, 0).toString());
    assertEquals("-i", new Complex(0, -1).toString());
    assertEquals("-1-i", new Complex(-1, -1).toString());

    assertEquals("2", new Complex(2, 0).toString());
    assertEquals("2i", new Complex(0, 2).toString());
    assertEquals("2+2i", new Complex(2, 2).toString());

    assertEquals("2-3i", new Complex(2, -3).toString());
};

ComplexTest.prototype.testNorm2 = function() {
    assertEquals(0, new Complex(0, 0).norm2());

    assertEquals(1, new Complex(1, 0).norm2());
    assertEquals(1, new Complex(0, 1).norm2());

    assertEquals(2, new Complex(1, 1).norm2());

    assertEquals(4, new Complex(2, 0).norm2());
    assertEquals(4, new Complex(0, 2).norm2());
    assertEquals(4, new Complex(-2, 0).norm2());
    assertEquals(4, new Complex(0, -2).norm2());

    assertEquals(13, new Complex(2, 3).norm2());
    assertEquals(25, new Complex(-3, -4).norm2());
};

ComplexTest.prototype.testAbs = function() {
    assertEquals(0, new Complex(0, 0).abs());

    assertEquals(1, new Complex(1, 0).abs());
    assertEquals(1, new Complex(0, 1).abs());

    assertEquals(2, new Complex(2, 0).abs());
    assertEquals(2, new Complex(0, 2).abs());
    assertEquals(2, new Complex(-2, 0).abs());
    assertEquals(2, new Complex(0, -2).abs());

    assertEquals(5, new Complex(-3, -4).abs());
};

ComplexTest.prototype.testPhase = function() {
    assertEquals(0, new Complex(0, 0).phase());

    assertEquals(0, new Complex(1, 0).phase());
    assertEquals(Math.PI/2, new Complex(0, 1).phase());
    assertEquals(Math.PI, new Complex(-1, 0).phase());
    assertEquals(-Math.PI/2, new Complex(0, -1).phase());

    assertEquals(Math.PI/4, new Complex(1, 1).phase());
};

ComplexTest.prototype.testConjugate = function() {
    assertTrue(new Complex(0, 0).conjugate().isEqualTo(new Complex(0, 0)));
    assertTrue(new Complex(2, 3).conjugate().isEqualTo(new Complex(2, -3)));
};

ComplexTest.prototype.testPlus = function() {
    assertTrue(new Complex(2, 3).plus(new Complex(5, 7)).isEqualTo(new Complex(7, 10)));
    assertTrue(new Complex(2, 3).plus(5).isEqualTo(new Complex(7, 3)));
};

ComplexTest.prototype.testMinus = function() {
    assertTrue(new Complex(2, 3).minus(new Complex(5, 7)).isEqualTo(new Complex(-3, -4)));
    assertTrue(new Complex(2, 3).minus(5).isEqualTo(new Complex(-3, 3)));
};

ComplexTest.prototype.testTimes = function() {
    assertTrue(new Complex(2, 3).times(new Complex(5, 7)).isEqualTo(new Complex(-11, 29)));
    assertTrue(new Complex(2, 3).times(5).isEqualTo(new Complex(10, 15)));
};

ComplexTest.prototype.testDividedBy = function() {
    assertTrue(new Complex(2, 3).dividedBy(new Complex(2, 0)).isEqualTo(new Complex(1, 1.5)));
    assertTrue(new Complex(2, 3).dividedBy(new Complex(0, 2)).isEqualTo(new Complex(1.5, -1)));
    assertTrue(new Complex(2, -2).dividedBy(new Complex(1, 1)).isEqualTo(new Complex(0, -2)));
};
