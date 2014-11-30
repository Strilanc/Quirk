UnitaryTest = TestCase("UnitaryTest");

UnitaryTest.prototype.testIsEqualTo = function() {
    var m = new Unitary([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]);
    assertTrue(m.isEqualTo(m));
    assertTrue(m.isEqualTo(
        new Unitary([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));

    assertFalse(m.isEqualTo(
        new Unitary([[new Complex(2, 3)]])));
    assertFalse(m.isEqualTo(
        new Unitary([[new Complex(-2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Unitary([[new Complex(2, 3), new Complex(-5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Unitary([[new Complex(2, 3), new Complex(5, 7)], [new Complex(-11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Unitary([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(-17, 19)]])));
};

UnitaryTest.prototype.testGenerate = function() {
    assertEquals("{{0, 10, 20}, {1, 11, 21}, {2, 12, 22}}",
        Unitary.generate(3, function(r, c) { return r + 10* c; }).toString());
};

UnitaryTest.prototype.testFrom = function() {
    var m = Unitary.from([1, new Complex(2, 3), -5.5, 0]);
    assertTrue(m.rows[0][0].isEqualTo(1));
    assertTrue(m.rows[0][1].isEqualTo(new Complex(2, 3)));
    assertTrue(m.rows[1][0].isEqualTo(-5.5));
    assertTrue(m.rows[1][1].isEqualTo(0));
    assertTrue(m.rows.length == 2);

    assertTrue(Unitary.from([1]).rows[0][0].isEqualTo(1));
};

UnitaryTest.prototype.testToString = function() {
    assertEquals("{{2}}", Unitary.from([2]).toString());
    assertEquals("{{1, 0}, {-i, 2-3i}}", Unitary.from([1, 0, new Complex(0, -1), new Complex(2, -3)]).toString());
    assertEquals("{{1, 0}, {0, 1}}", Unitary.from([1, 0, 0, 1]).toString());
    assertEquals("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}", Unitary.identity(3).toString());
};

UnitaryTest.prototype.testAdjoint = function() {
    var v = Unitary.from([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Unitary.from([new Complex(2, -3), new Complex(11, -13),
                          new Complex(5, -7), new Complex(17, -19)]);
    assertTrue(v.adjoint().isEqualTo(a));
};

UnitaryTest.prototype.testScaledBy = function() {
    var v = Unitary.from([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Unitary.from([new Complex(-2, -3), new Complex(-5, -7),
                          new Complex(-11, -13), new Complex(-17, -19)]);
    assertTrue(v.scaledBy(-1).isEqualTo(a));
    assertTrue(v.scaledBy(0).isEqualTo(Unitary.from([0, 0, 0, 0])));
    assertTrue(v.scaledBy(1).isEqualTo(v));
};

UnitaryTest.prototype.testPlus = function() {
    assertTrue(Unitary.from([2, 3, 5, 7]).plus(Unitary.from([11, 13, 17, 19]))
        .isEqualTo(Unitary.from([13, 16, 22, 26])));
};

UnitaryTest.prototype.testMinus = function() {
    assertTrue(Unitary.from([2, 3, 5, 7]).minus(Unitary.from([11, 13, 17, 19]))
        .isEqualTo(Unitary.from([-9, -10, -12, -12])));
};

UnitaryTest.prototype.testTimes = function() {
    assertTrue(Unitary.from([2, 3, 5, 7]).times(Unitary.from([11, 13, 17, 19]))
        .isEqualTo(Unitary.from([73, 83, 174, 198])));

    var x = Unitary.from([new Complex(0.5, -0.5), new Complex(0.5, 0.5),
                          new Complex(0.5, 0.5), new Complex(0.5, -0.5)]);
    assertTrue(x.times(x.adjoint()).isEqualTo(Unitary.identity(2)));
    assertTrue(Unitary.PAULI_X.times(Unitary.PAULI_Y).times(Unitary.PAULI_Z).scaledBy(new Complex(0, -1))
        .isEqualTo(Unitary.identity(2)));
};

var assertUnitaryApproxEqual = function (v1, v2) {
    var t = 0;
    var n = v1.rows.length;
    if (v2.rows.length != n) {
        return false;
    }
    for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
            t += v1.rows[r][c].minus(v2.rows[r][c]).norm2();
        }
    }
    assertTrue(t < 0.0000001);
};

UnitaryTest.prototype.testFromRotation = function() {
    // No turn gives no-op
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, 0]), Unitary.identity(2));

    // Whole turns are no-ops
    assertUnitaryApproxEqual(Unitary.fromRotation([1, 0, 0]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 1, 0]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, 1]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([-1, 0, 0]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, -1, 0]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, -1]), Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0.6, 0.8, 0]), Unitary.identity(2));

    // Half turns along each axis is the corresponding Pauli operation
    assertUnitaryApproxEqual(Unitary.fromRotation([0.5, 0, 0]), Unitary.PAULI_X);
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0.5, 0]), Unitary.PAULI_Y);
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, 0.5]), Unitary.PAULI_Z);
    assertUnitaryApproxEqual(Unitary.fromRotation([-0.5, 0, 0]), Unitary.PAULI_X);
    assertUnitaryApproxEqual(Unitary.fromRotation([0, -0.5, 0]), Unitary.PAULI_Y);
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, -0.5]), Unitary.PAULI_Z);

    // Hadamard
    assertUnitaryApproxEqual(Unitary.fromRotation([Math.sqrt(0.125), 0, Math.sqrt(0.125)]), Unitary.HADAMARD);

    // Opposites are inverses
    assertUnitaryApproxEqual(Unitary.fromRotation([-0.25, 0, 0]).times(Unitary.fromRotation([0.25, 0, 0])),
        Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, -0.25, 0]).times(Unitary.fromRotation([0, 0.25, 0])),
        Unitary.identity(2));
    assertUnitaryApproxEqual(Unitary.fromRotation([0, 0, -0.25]).times(Unitary.fromRotation([0, 0, 0.25])),
        Unitary.identity(2));

    // Doubling rotation is like squaring
    var s1 = Unitary.fromRotation([0.1, 0.15, 0.25]);
    var s2 = Unitary.fromRotation([0.2, 0.3, 0.5]);
    assertUnitaryApproxEqual(s1.times(s1), s2);
};

UnitaryTest.prototype.testTensorProduct = function() {
    assertTrue(Unitary.from([2]).tensorProduct(Unitary.from([3])).isEqualTo(Unitary.from([6])));
    assertTrue(Unitary.PAULI_X.tensorProduct(Unitary.PAULI_Z).isEqualTo(Unitary.from([
        0, 0, 1, 0,
        0, 0, 0, -1,
        1, 0, 0, 0,
        0, -1, 0, 0
    ])));
    assertTrue(Unitary.from([2, 3, 5, 7]).tensorProduct(Unitary.from([11, 13, 17, 19])).isEqualTo(Unitary.from([
        22, 26, 33, 39,
        34, 38, 51, 57,
        55, 65, 77, 91,
        85, 95, 119, 133
    ])));
};

UnitaryTest.prototype.testTensorProduct_Controlled = function() {
    assertTrue(Unitary.CONTROL_SYGIL.tensorProduct(Unitary.from([2, 3, 5, 7])).isEqualTo(Unitary.from([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 2, 3,
        0, 0, 5, 7
    ])));
    assertTrue(Unitary.from([2, 3, 5, 7]).tensorProduct(Unitary.CONTROL_SYGIL).isEqualTo(Unitary.from([
        1, 0, 0, 0,
        0, 2, 0, 3,
        0, 0, 1, 0,
        0, 5, 0, 7
    ])));
};
