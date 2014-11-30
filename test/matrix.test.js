MatrixTest = TestCase("MatrixTest");

MatrixTest.prototype.testIsEqualTo = function() {
    var m = new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]);
    assertTrue(m.isEqualTo(m));
    assertTrue(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));

    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(-2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(-5, 7)], [new Complex(11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(-11, 13), new Complex(17, 19)]])));
    assertFalse(m.isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(-17, 19)]])));

    var col = new Matrix([[new Complex(2, 3), new Complex(5, 7)]]);
    var row = new Matrix([[new Complex(2, 3)], [new Complex(5, 7)]]);
    assertTrue(col.isEqualTo(col));
    assertTrue(row.isEqualTo(row));
    assertFalse(row.isEqualTo(col));
};

MatrixTest.prototype.testGenerate = function() {
    assertEquals("{{0, 10, 20}, {1, 11, 21}}",
        Matrix.generate(3, 2, function(r, c) { return r + 10* c; }).toString());
};

MatrixTest.prototype.testSquare = function() {
    var m = Matrix.square([1, new Complex(2, 3), -5.5, 0]);
    assertTrue(m.rows[0][0].isEqualTo(1));
    assertTrue(m.rows[0][1].isEqualTo(new Complex(2, 3)));
    assertTrue(m.rows[1][0].isEqualTo(-5.5));
    assertTrue(m.rows[1][1].isEqualTo(0));
    assertTrue(m.rows.length == 2);

    assertTrue(Matrix.square([1]).rows[0][0].isEqualTo(1));
};

MatrixTest.prototype.testRow = function() {
    assertEquals("{{2, 3, 5i}}", Matrix.row([2, 3, new Complex(0, 5)]).toString());
};

MatrixTest.prototype.testCol = function() {
    assertEquals("{{2}, {3}, {5i}}", Matrix.col([2, 3, new Complex(0, 5)]).toString());
};

MatrixTest.prototype.testToString = function() {
    assertEquals("{{2}}", Matrix.square([2]).toString());
    assertEquals("{{1, 0}, {-i, 2-3i}}", Matrix.square([1, 0, new Complex(0, -1), new Complex(2, -3)]).toString());
    assertEquals("{{1, 0}, {0, 1}}", Matrix.square([1, 0, 0, 1]).toString());
    assertEquals("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}", Matrix.identity(3).toString());
};

MatrixTest.prototype.testAdjoint = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(2, -3), new Complex(11, -13),
                          new Complex(5, -7), new Complex(17, -19)]);
    assertTrue(v.adjoint().isEqualTo(a));
};

MatrixTest.prototype.testScaledBy = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(-2, -3), new Complex(-5, -7),
                          new Complex(-11, -13), new Complex(-17, -19)]);
    assertTrue(v.scaledBy(-1).isEqualTo(a));
    assertTrue(v.scaledBy(0).isEqualTo(Matrix.square([0, 0, 0, 0])));
    assertTrue(v.scaledBy(1).isEqualTo(v));

    assertTrue(Matrix.col([2, 3]).scaledBy(5).isEqualTo(Matrix.col([10, 15])))
    assertTrue(Matrix.row([2, 3]).scaledBy(5).isEqualTo(Matrix.row([10, 15])))
};

MatrixTest.prototype.testPlus = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).plus(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([13, 16, 22, 26])));
};

MatrixTest.prototype.testMinus = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).minus(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([-9, -10, -12, -12])));
};

MatrixTest.prototype.testTimes = function() {
    assertTrue(Matrix.square([2, 3, 5, 7]).times(Matrix.square([11, 13, 17, 19]))
        .isEqualTo(Matrix.square([73, 83, 174, 198])));

    var x = Matrix.square([new Complex(0.5, -0.5), new Complex(0.5, 0.5),
                          new Complex(0.5, 0.5), new Complex(0.5, -0.5)]);
    assertTrue(x.times(x.adjoint()).isEqualTo(Matrix.identity(2)));
    assertTrue(Matrix.PAULI_X.times(Matrix.PAULI_Y).times(Matrix.PAULI_Z).scaledBy(new Complex(0, -1))
        .isEqualTo(Matrix.identity(2)));
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

MatrixTest.prototype.testFromRotation = function() {
    // No turn gives no-op
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, 0), Matrix.identity(2));

    // Whole turns are no-ops
    assertUnitaryApproxEqual(Matrix.fromRotation(1, 0, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 1, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, 1), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(-1, 0, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, -1, 0), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, -1), Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0.6, 0.8, 0), Matrix.identity(2));

    // Half turns along each axis is the corresponding Pauli operation
    assertUnitaryApproxEqual(Matrix.fromRotation(0.5, 0, 0), Matrix.PAULI_X);
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0.5, 0), Matrix.PAULI_Y);
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, 0.5), Matrix.PAULI_Z);
    assertUnitaryApproxEqual(Matrix.fromRotation(-0.5, 0, 0), Matrix.PAULI_X);
    assertUnitaryApproxEqual(Matrix.fromRotation(0, -0.5, 0), Matrix.PAULI_Y);
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, -0.5), Matrix.PAULI_Z);

    // Hadamard
    assertUnitaryApproxEqual(Matrix.fromRotation(Math.sqrt(0.125), 0, Math.sqrt(0.125)), Matrix.HADAMARD);

    // Opposites are inverses
    assertUnitaryApproxEqual(Matrix.fromRotation(-0.25, 0, 0).times(Matrix.fromRotation(0.25, 0, 0)),
        Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, -0.25, 0).times(Matrix.fromRotation(0, 0.25, 0)),
        Matrix.identity(2));
    assertUnitaryApproxEqual(Matrix.fromRotation(0, 0, -0.25).times(Matrix.fromRotation(0, 0, 0.25)),
        Matrix.identity(2));

    // Doubling rotation is like squaring
    var s1 = Matrix.fromRotation([0.1, 0.15, 0.25]);
    var s2 = Matrix.fromRotation([0.2, 0.3, 0.5]);
    assertUnitaryApproxEqual(s1.times(s1), s2);
};

MatrixTest.prototype.testTensorProduct = function() {
    assertTrue(Matrix.square([2]).tensorProduct(Matrix.square([3])).isEqualTo(Matrix.square([6])));
    assertTrue(Matrix.square([2]).tensorProduct(Matrix.square([3])).isEqualTo(Matrix.square([6])));
    assertTrue(Matrix.PAULI_X.tensorProduct(Matrix.PAULI_Z).isEqualTo(Matrix.square([
        0, 0, 1, 0,
        0, 0, 0, -1,
        1, 0, 0, 0,
        0, -1, 0, 0
    ])));
    assertTrue(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.square([11, 13, 17, 19])).isEqualTo(Matrix.square([
        22, 26, 33, 39,
        34, 38, 51, 57,
        55, 65, 77, 91,
        85, 95, 119, 133
    ])));
};

MatrixTest.prototype.testColRowProducts = function() {
    // When one is a column vector and the other is a row vector...
    var r = Matrix.row([2, 3, 5]);
    var c = Matrix.col([11, 13, 17]);

    // Inner product
    assertEquals("{{146}}", r.times(c).toString());

    // Outer product
    assertEquals("{{22, 33, 55}, {26, 39, 65}, {34, 51, 85}}", c.times(r).toString());

    // Outer product matches tensor product
    assertTrue(c.times(r).isEqualTo(c.tensorProduct(r)));

    // Tensor product is order independent (in this case)
    assertTrue(r.tensorProduct(c).isEqualTo(c.tensorProduct(r)));
};

MatrixTest.prototype.testTensorProduct_Controlled = function() {
    assertTrue(Matrix.CONTROL_SYGIL.tensorProduct(Matrix.square([2, 3, 5, 7])).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 2, 3,
        0, 0, 5, 7
    ])));
    assertTrue(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.CONTROL_SYGIL).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 2, 0, 3,
        0, 0, 1, 0,
        0, 5, 0, 7
    ])));
};
