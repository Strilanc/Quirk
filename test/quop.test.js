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
