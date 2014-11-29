QuopTest = TestCase("QuopTest");

QuopTest.prototype.testFrom = function() {
    assertTrue(Quop.from([1, new Complex(2, 3), -5.5, 0]).a.isEqualTo(1));
    assertTrue(Quop.from([1, new Complex(2, 3), -5.5, 0]).b.isEqualTo(new Complex(2, 3)));
    assertTrue(Quop.from([1, new Complex(2, 3), -5.5, 0]).c.isEqualTo(-5.5));
    assertTrue(Quop.from([1, new Complex(2, 3), -5.5, 0]).d.isEqualTo(0));
};

QuopTest.prototype.testIsEqualTo = function() {
    var m = new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(17, 19));
    assertTrue(m.isEqualTo(m));
    assertTrue(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(-2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, -3), new Complex(5, 7), new Complex(11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(-5, 7), new Complex(11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, -7), new Complex(11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(-11, 13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(11, -13), new Complex(17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(-17, 19))));
    assertFalse(m.isEqualTo(new Quop(new Complex(2, 3), new Complex(5, 7), new Complex(11, 13), new Complex(17, -19))));
};

QuopTest.prototype.testToString = function() {
    assertEquals("{{1, 0}, {-i, 2-3i}}", Quop.from([1, 0, new Complex(0, -1), new Complex(2, -3)]).toString());
    assertEquals("{{1, 0}, {0, 1}}", Quop.from([1, 0, 0, 1]).toString());
};

QuopTest.prototype.testAdjoint = function() {
    var v = new Quop(new Complex(2, 3), new Complex(5, 7),
                     new Complex(11, 13), new Complex(17, 19));
    var a = new Quop(new Complex(2, -3), new Complex(11, -13),
                     new Complex(5, -7), new Complex(17, -19));
    assertTrue(v.adjoint().isEqualTo(a));
};

QuopTest.prototype.testScaledBy = function() {
    var v = new Quop(new Complex(2, 3), new Complex(5, 7),
                     new Complex(11, 13), new Complex(17, 19));
    var a = new Quop(new Complex(-2, -3), new Complex(-5, -7),
                     new Complex(-11, -13), new Complex(-17, -19));
    assertTrue(v.scaledBy(-1).isEqualTo(a));
    assertTrue(v.scaledBy(0).isEqualTo(Quop.from([0, 0, 0, 0])));
    assertTrue(v.scaledBy(1).isEqualTo(v));
};

QuopTest.prototype.testTimes = function() {
    assertTrue(Quop.from([2, 3, 5, 7]).times(Quop.from([11, 13, 17, 19]))
        .isEqualTo(Quop.from([73, 83, 174, 198])));

    var x = new Quop(new Complex(0.5, -0.5), new Complex(0.5, 0.5),
        new Complex(0.5, 0.5), new Complex(0.5, -0.5));
    assertTrue(x.times(x.adjoint()).isEqualTo(Quop.IDENTITY));
    assertTrue(Quop.PAULI_X.times(Quop.PAULI_Y).times(Quop.PAULI_Z).scaledBy(new Complex(0, -1))
        .isEqualTo(Quop.IDENTITY));
};

QuopTest.prototype.testPlus = function() {
    assertTrue(Quop.from([2, 3, 5, 7]).plus(Quop.from([11, 13, 17, 19]))
        .isEqualTo(Quop.from([13, 16, 22, 26])));
};

QuopTest.prototype.testMinus = function() {
    assertTrue(Quop.from([2, 3, 5, 7]).minus(Quop.from([11, 13, 17, 19]))
        .isEqualTo(Quop.from([-9, -10, -12, -12])));
};

var assertApproxEqual = function (v1, v2) {
    var sum_err = v1.a.minus(v2.a).norm2() +
        v1.b.minus(v2.b).norm2() +
        v1.c.minus(v2.c).norm2() +
        v1.d.minus(v2.d).norm2();
    assertTrue(sum_err < 0.0000001);
};

QuopTest.prototype.testFromRotation = function() {
    // No turn gives no-op
    assertApproxEqual(Quop.fromRotation([0, 0, 0]), Quop.IDENTITY);

    // Whole turns are no-ops
    assertApproxEqual(Quop.fromRotation([1, 0, 0]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, 1, 0]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, 0, 1]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([-1, 0, 0]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, -1, 0]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, 0, -1]), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0.6, 0.8, 0]), Quop.IDENTITY);

    // Half turns along each axis is the corresponding Pauli operation
    assertApproxEqual(Quop.fromRotation([0.5, 0, 0]), Quop.PAULI_X);
    assertApproxEqual(Quop.fromRotation([0, 0.5, 0]), Quop.PAULI_Y);
    assertApproxEqual(Quop.fromRotation([0, 0, 0.5]), Quop.PAULI_Z);
    assertApproxEqual(Quop.fromRotation([-0.5, 0, 0]), Quop.PAULI_X);
    assertApproxEqual(Quop.fromRotation([0, -0.5, 0]), Quop.PAULI_Y);
    assertApproxEqual(Quop.fromRotation([0, 0, -0.5]), Quop.PAULI_Z);

    // Hadamard
    assertApproxEqual(Quop.fromRotation([Math.sqrt(0.125), 0, Math.sqrt(0.125)]), Quop.HADAMARD);

    // Opposites are inverses
    assertApproxEqual(Quop.fromRotation([-0.25, 0, 0]).times(Quop.fromRotation([0.25, 0, 0])), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, -0.25, 0]).times(Quop.fromRotation([0, 0.25, 0])), Quop.IDENTITY);
    assertApproxEqual(Quop.fromRotation([0, 0, -0.25]).times(Quop.fromRotation([0, 0, 0.25])), Quop.IDENTITY);

    // Doubling rotation is like squaring
    var s1 = Quop.fromRotation([0.1, 0.15, 0.25]);
    var s2 = Quop.fromRotation([0.2, 0.3, 0.5]);
    assertApproxEqual(s1.times(s1), s2);
};
