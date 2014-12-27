MatrixTest = TestCase("MatrixTest");

MatrixTest.prototype.testIsEqualTo = function() {
    var m = new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]);
    assertThat(m).isEqualTo(m);
    assertThat(m).isNotEqualTo(null);
    assertThat(m).isNotEqualTo("");

    assertThat(m).isEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        new Matrix([[new Complex(2, 3)]]));
    assertThat(m).isNotEqualTo(
        new Matrix([[new Complex(-2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(-5, 7)], [new Complex(11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(-11, 13), new Complex(17, 19)]]));
    assertThat(m).isNotEqualTo(
        new Matrix([[new Complex(2, 3), new Complex(5, 7)], [new Complex(11, 13), new Complex(-17, 19)]]));

    var col = new Matrix([[new Complex(2, 3), new Complex(5, 7)]]);
    var row = new Matrix([[new Complex(2, 3)], [new Complex(5, 7)]]);
    assertThat(col).isEqualTo(col);
    assertThat(row).isEqualTo(row);
    assertThat(row).isNotEqualTo(col);
};

MatrixTest.prototype.testIsApproximatelyEqualTo = function() {
    // Size must match
    assertThat(Matrix.row([1, 1])).isNotApproximatelyEqualTo(Matrix.col([1, 1]), 0);
    assertThat(Matrix.row([1, 1])).isNotApproximatelyEqualTo(Matrix.square([1, 1, 1, 1]), 0);
    assertThat(Matrix.row([1, 1])).isNotApproximatelyEqualTo(Matrix.row([1, 1, 1]), 0);
    assertThat(Matrix.row([1, 1])).isApproximatelyEqualTo(Matrix.row([1, 1]), 0);

    // Error bound matters
    assertThat(Matrix.row([1])).isApproximatelyEqualTo(Matrix.row([1]), 0);
    assertThat(Matrix.row([1])).isApproximatelyEqualTo(Matrix.row([1]), 1/16);
    assertThat(Matrix.row([1.25])).isApproximatelyEqualTo(Matrix.row([1]), 1/16);
    assertThat(Matrix.row([0.75])).isApproximatelyEqualTo(Matrix.row([1]), 1/16);
    assertThat(Matrix.row([1.26])).isNotApproximatelyEqualTo(Matrix.row([1]), 1/16);
    assertThat(Matrix.row([0.74])).isNotApproximatelyEqualTo(Matrix.row([1]), 1/16);

    // Error bound spreads
    assertThat(Matrix.row([0, 0])).isApproximatelyEqualTo(Matrix.row([0, 0]), 1);
    assertThat(Matrix.row([1, 0])).isApproximatelyEqualTo(Matrix.row([0, 0]), 1);
    assertThat(Matrix.row([0, 1])).isApproximatelyEqualTo(Matrix.row([0, 0]), 1);
    assertThat(Matrix.row([1, 1])).isNotApproximatelyEqualTo(Matrix.row([0, 0]), 1);

    assertThat(Matrix.row([0])).isNotApproximatelyEqualTo(null);
    assertThat(Matrix.row([0])).isNotApproximatelyEqualTo("");
};

MatrixTest.prototype.testToString = function() {
    assertThat(Matrix.square([2]).toString()).
        isEqualTo("{{2}}");
    assertThat(Matrix.square([1, 0, new Complex(0, -1), new Complex(2, -3)]).toString()).
        isEqualTo("{{1, 0}, {-i, 2-3i}}");
    assertThat(Matrix.square([1, 0, 0, 1]).toString()).
        isEqualTo("{{1, 0}, {0, 1}}");
    assertThat(Matrix.identity(3).toString()).
        isEqualTo("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}");
};

MatrixTest.prototype.testGenerate = function() {
    assertThat(Matrix.generate(3, 2, function(r, c) { return r + 10* c; }).toString()).
        isEqualTo("{{0, 10, 20}, {1, 11, 21}}");
};

MatrixTest.prototype.testSquare = function() {
    var m = Matrix.square([1, new Complex(2, 3), -5.5, 0]);
    assertThat(m.rows[0][0]).isEqualTo(1);
    assertThat(m.rows[0][1]).isEqualTo(new Complex(2, 3));
    assertThat(m.rows[1][0]).isEqualTo(-5.5);
    assertThat(m.rows[1][1]).isEqualTo(0);
    assertThat(m.rows.length).isEqualTo(2);

    assertThat(Matrix.square([1]).rows[0][0]).isEqualTo(1);
};

MatrixTest.prototype.testCol = function() {
    assertThat(Matrix.col([2, 3, new Complex(0, 5)]).toString()).isEqualTo("{{2}, {3}, {5i}}");
};

MatrixTest.prototype.testRow = function() {
    assertThat(Matrix.row([2, 3, new Complex(0, 5)]).toString()).isEqualTo("{{2, 3, 5i}}");
};

MatrixTest.prototype.testSize = function() {
    assertThat(Matrix.row([1, 1]).width()).isEqualTo(2);
    assertThat(Matrix.row([1, 1]).height()).isEqualTo(1);

    assertThat(Matrix.row([1, 1, 3]).width()).isEqualTo(3);
    assertThat(Matrix.row([1, 1, 3]).height()).isEqualTo(1);

    assertThat(Matrix.col([1, 1]).width()).isEqualTo(1);
    assertThat(Matrix.col([1, 1]).height()).isEqualTo(2);

    assertThat(Matrix.col([1, 1, 3]).width()).isEqualTo(1);
    assertThat(Matrix.col([1, 1, 3]).height()).isEqualTo(3);
};

MatrixTest.prototype.testIsApproximatelyUnitary = function() {
    assertFalse(Matrix.row([1, 1]).isApproximatelyUnitary(999));
    assertFalse(Matrix.col([1, 1]).isApproximatelyUnitary(999));

    assertTrue(Matrix.row([1]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([Complex.I]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([-1]).isApproximatelyUnitary(0));
    assertFalse(Matrix.row([-2]).isApproximatelyUnitary(0));
    assertFalse(Matrix.row([0]).isApproximatelyUnitary(0));
    assertTrue(Matrix.row([-2]).isApproximatelyUnitary(999));

    assertTrue(Matrix.square([1, 0, 0, 1]).isApproximatelyUnitary(0));
    assertTrue(Matrix.rotation(1).isApproximatelyUnitary(0.001));
    assertTrue(Matrix.PAULI_X.isApproximatelyUnitary(0));
    assertTrue(Matrix.PAULI_Y.isApproximatelyUnitary(0));
    assertTrue(Matrix.PAULI_Z.isApproximatelyUnitary(0));
    assertTrue(Matrix.HADAMARD.isApproximatelyUnitary(0.001));
};

MatrixTest.prototype.testAdjoint = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(2, -3), new Complex(11, -13),
                          new Complex(5, -7), new Complex(17, -19)]);
    assertThat(v.adjoint()).isEqualTo(a);
};

MatrixTest.prototype.testScaledBy = function() {
    var v = Matrix.square([new Complex(2, 3), new Complex(5, 7),
                          new Complex(11, 13), new Complex(17, 19)]);
    var a = Matrix.square([new Complex(-2, -3), new Complex(-5, -7),
                          new Complex(-11, -13), new Complex(-17, -19)]);
    assertThat(v.scaledBy(-1)).isEqualTo(a);
    assertThat(v.scaledBy(0)).isEqualTo(Matrix.square([0, 0, 0, 0]));
    assertThat(v.scaledBy(1)).isEqualTo(v);

    assertThat(Matrix.col([2, 3]).scaledBy(5)).isEqualTo(Matrix.col([10, 15]));
    assertThat(Matrix.row([2, 3]).scaledBy(5)).isEqualTo(Matrix.row([10, 15]));
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

MatrixTest.prototype.testTimes_ColRow = function() {
    // When one is a column vector and the other is a row vector...
    var r = Matrix.row([2, 3, 5]);
    var c = Matrix.col([11, 13, 17]);

    // Inner product
    assertThat(r.times(c).toString()).isEqualTo("{{146}}");

    // Outer product
    assertThat(c.times(r).toString()).isEqualTo("{{22, 33, 55}, {26, 39, 65}, {34, 51, 85}}");

    // Outer product matches tensor product
    assertThat(c.times(r)).isEqualTo(c.tensorProduct(r));

    // Tensor product is order independent (in this case)
    assertThat(r.tensorProduct(c)).isEqualTo(c.tensorProduct(r));
};

MatrixTest.prototype.testNorm2 = function() {
    assertThat(Matrix.row([1]).norm2()).isEqualTo(1);
    assertThat(Matrix.row([2]).norm2()).isEqualTo(4);
    assertThat(Matrix.row([1, 1]).norm2()).isEqualTo(2);
    assertThat(Matrix.col([1, 1]).norm2()).isEqualTo(2);
    assertThat(Matrix.square([1, 2, 3, 4]).norm2()).isEqualTo(30);
};

MatrixTest.prototype.testTensorProduct = function() {
    assertThat(Matrix.square([2]).tensorProduct(Matrix.square([3]))).
        isEqualTo(Matrix.square([6]));
    assertThat(Matrix.square([2]).tensorProduct(Matrix.square([3]))).
        isEqualTo(Matrix.square([6]));
    assertThat(Matrix.PAULI_X.tensorProduct(Matrix.PAULI_Z)).isEqualTo(Matrix.square([
        0, 0, 1, 0,
        0, 0, 0, -1,
        1, 0, 0, 0,
        0, -1, 0, 0
    ]));
    assertThat(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.square([11, 13, 17, 19]))).
        isEqualTo(Matrix.square([
            22, 26, 33, 39,
            34, 38, 51, 57,
            55, 65, 77, 91,
            85, 95, 119, 133
        ]));
};

MatrixTest.prototype.testTensorPower = function() {
    assertEquals("{{1}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(0));
    assertEquals("{{1, i}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(1));
    assertEquals("{{1, i, i, -1}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(2));
    assertEquals("{{1, i, i, -1, i, -1, -1, -i}}", Matrix.row([1, new Complex(0, 1)]).tensorPower(3));
};

MatrixTest.prototype.testTensorProduct_Controlled = function() {
    assertThat(Matrix.CONTROL.tensorProduct(Matrix.square([2, 3, 5, 7]))).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 2, 3,
        0, 0, 5, 7
    ]));
    assertThat(Matrix.square([2, 3, 5, 7]).tensorProduct(Matrix.CONTROL)).isEqualTo(Matrix.square([
        1, 0, 0, 0,
        0, 2, 0, 3,
        0, 0, 1, 0,
        0, 5, 0, 7
    ]));
};

MatrixTest.prototype.testFromPauliRotation = function() {
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
    var s1 = Matrix.fromPauliRotation(0.1, 0.15, 0.25);
    var s2 = Matrix.fromPauliRotation(0.2, 0.3, 0.5);
    assertThat(s1.times(s1)).isApproximatelyEqualTo(s2);
};

MatrixTest.prototype.testFromWireSwap = function() {
    assertThat(Matrix.fromWireSwap(2, 0, 1).toString()).
        isEqualTo("{{1, 0, 0, 0}, {0, 0, 1, 0}, {0, 1, 0, 0}, {0, 0, 0, 1}}");
    var _ = 0;
    assertThat(Matrix.square([
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
    ])).isEqualTo(Matrix.fromWireSwap(4, 1, 3));
};

MatrixTest.prototype.testIdentity = function() {
    assertThat(Matrix.identity(1).toString()).
        isEqualTo("{{1}}");
    assertThat(Matrix.identity(2).toString()).
        isEqualTo("{{1, 0}, {0, 1}}");
    assertThat(Matrix.identity(3).toString()).
        isEqualTo("{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}");
    assertThat(Matrix.identity(4).toString()).
        isEqualTo("{{1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {0, 0, 0, 1}}");
};

MatrixTest.prototype.testRotation = function() {
    var s = Math.sqrt(0.5);
    var t = Math.PI * 2;
    assertThat(Matrix.rotation(0)).isApproximatelyEqualTo(Matrix.square([1, 0, 0, 1]));
    assertThat(Matrix.rotation(t / 8)).isApproximatelyEqualTo(Matrix.square([s, -s, s, s]));
    assertThat(Matrix.rotation(t * 2 / 8)).isApproximatelyEqualTo(Matrix.square([0, -1, 1, 0]));
    assertThat(Matrix.rotation(t * 3 / 8)).isApproximatelyEqualTo(Matrix.square([-s, -s, s, -s]));
    assertThat(Matrix.rotation(t * 4 / 8)).isApproximatelyEqualTo(Matrix.square([-1, 0, 0, -1]));
    assertThat(Matrix.rotation(t * 5 / 8)).isApproximatelyEqualTo(Matrix.square([-s, s, -s, -s]));
    assertThat(Matrix.rotation(t * 6 / 8)).isApproximatelyEqualTo(Matrix.square([0, 1, -1, 0]));
    assertThat(Matrix.rotation(t * 7 / 8)).isApproximatelyEqualTo(Matrix.square([s, s, -s, s]));
    assertThat(Matrix.rotation(t)).isApproximatelyEqualTo(Matrix.square([1, 0, 0, 1]));
};

MatrixTest.prototype.testSingularValueDecomposition_2x2 = function() {
    var z = Matrix.square([0, 0, 0, 0]).singularValueDecomposition();
    assertThat(z.u).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(z.s).isApproximatelyEqualTo(Matrix.square([0, 0, 0, 0]));
    assertThat(z.v).isApproximatelyEqualTo(Matrix.identity(2));

    var i = Matrix.identity(2).singularValueDecomposition();
    assertThat(i.u).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(i.s).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(i.v).isApproximatelyEqualTo(Matrix.identity(2));

    var am = Matrix.square([1, Complex.I.times(2), 3, 4]);
    var ad = am.singularValueDecomposition();
    assertThat(ad.u.times(ad.s).times(ad.v)).isApproximatelyEqualTo(am);
    assertThat(ad.s).isApproximatelyEqualTo(Matrix.square([5.30594, 0, 0, 1.35906]));
};

MatrixTest.prototype.testClosestUnitary_2x2 = function() {
    assertThat(Matrix.square([0, 0, 0, 0]).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square([1, 0, 0, 1]));
    assertThat(Matrix.square([2, 0, 0, 0.0001]).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square([1, 0, 0, 1]));
    assertThat(Matrix.square([0, 0.5, 0.0001, 0]).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square([0, 1, 1, 0]));
    assertThat(Matrix.square([1, Complex.I, -1, Complex.I.times(-1)]).closestUnitary()).
        isApproximatelyEqualTo(Matrix.square([1, 0, 0, Complex.I.times(-1)]));
};
