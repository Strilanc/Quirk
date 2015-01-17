GateTest = TestCase("GateTest");

GateTest.prototype.testIsEqualTo = function() {
    var g1 = new Gate("A", Matrix.identity(2), "Alpha", "Desc", Gate.DEFAULT_SYMBOL_DRAWER);
    var g2 = new Gate("A", Matrix.identity(2), "Alpha", "Desc", Gate.DEFAULT_SYMBOL_DRAWER);
    var h1 = new Gate("B", Matrix.identity(2), "Alpha", "Desc", Gate.DEFAULT_SYMBOL_DRAWER);
    var h2 = new Gate("A", Matrix.PAULI_X, "Alpha", "Desc", Gate.DEFAULT_SYMBOL_DRAWER);
    var h3 = new Gate("A", Matrix.identity(2), "Beta", "Desc", Gate.DEFAULT_SYMBOL_DRAWER);
    var h4 = new Gate("A", Matrix.identity(2), "Alpha", "Different", Gate.DEFAULT_SYMBOL_DRAWER);
    var h5 = new Gate("A", Matrix.identity(2), "Alpha", "Desc", Gate.MATRIX_SYMBOL_DRAWER);

    assertThat(g1).isEqualTo(g1);
    assertThat(g1).isEqualTo(g2);
    assertThat(g1).isNotEqualTo(h1);
    assertThat(g1).isNotEqualTo(h2);
    assertThat(g1).isNotEqualTo(h3);
    assertThat(g1).isNotEqualTo(h4);
    assertThat(g1).isNotEqualTo(h5);
};

GateTest.prototype.testFromPhaseRotation = function() {
    var g = Gate.fromPhaseRotation(0.25, "Quart");
    assertThat(g.matrixAt(0)).isEqualTo(Matrix.square([1, 0, 0, Complex.I]));
    assertThat(g.symbol).isEqualTo("Quart");
    assertThat(g.name).isEqualTo("90° Phase Gate");
};

GateTest.prototype.testFromPauliRotation = function() {
    assertThat(Gate.fromPauliRotation(0.5, 0, 0).matrix).isEqualTo(Gate.X.matrix);
    assertThat(Gate.fromPauliRotation(0, 0.5, 0).matrix).isEqualTo(Gate.Y.matrix);
    assertThat(Gate.fromPauliRotation(0, 0, 0.5).matrix).isEqualTo(Gate.Z.matrix);

    var g = Gate.fromPauliRotation(1/3, 0, 0, "Third");
    assertThat(g.matrixAt(0).times(g.matrixAt(0)).times(g.matrixAt(0))).isApproximatelyEqualTo(Matrix.identity(2));
    assertThat(g.symbol).isEqualTo("Third");
};

GateTest.prototype.testFromCustom = function() {
    assertThat(Gate.fromCustom(Matrix.identity(2)).matrixAt(0)).isEqualTo(Matrix.identity(2));
};

GateTest.prototype.testMakeFuzzGate = function() {
    assertTrue(Gate.makeFuzzGate().matrixAt(0).isApproximatelyUnitary(0.00000001));
};

GateTest.prototype.testFromTargetedRotation = function() {
    var g = Gate.fromTargetedRotation(0.4, "4/10", "2/5");
    assertThat(QuantumState.SINGLE_ZERO.transformedBy(g.matrixAt(0)).probability(1, 1)).isApproximatelyEqualTo(0.4);
    assertThat(g.symbol).isEqualTo("∠2/5");
    assertThat(g.name).isEqualTo("4/10 Target Rotation Gate");
};

GateTest.prototype.testToJson = function() {
    assertThat(Gate.X.toJson()).isEqualTo({
        symbol: "X",
        matrix: "{{0, 1}, {1, 0}}"
    });
    assertThat(new Gate("A", Matrix.identity(2), "Alpha", "Desc").toJson()).isEqualTo({
        symbol: "A",
        matrix: "{{1, 0}, {0, 1}}"
    });
};

GateTest.prototype.testFromJson = function() {
    // checks against existing gate set
    assertThat(Gate.fromJson(Gate.X.toJson())).isEqualTo(Gate.X);
    assertThat(Gate.fromJson(Gate.Y.toJson())).isEqualTo(Gate.Y);

    // if matrix differs, doesn't use existing gate
    assertThat(Gate.fromJson({
        symbol: "X",
        matrix: "{{0, 1}, {i, 0}}"
    })).isNotEqualTo(Gate.X);
    assertThat(Gate.fromJson({
        symbol: "X",
        matrix: "{{0, 1}, {i, 0}}"
    }).matrixAt(0)).isEqualTo(Matrix.square([0, 1, Complex.I, 0]));

    // round trip keeps certain details
    var a = new Gate("A", Matrix.identity(2), "Alpha", "Desc");
    var a2 = Gate.fromJson(a.toJson());
    assertThat(a2.symbol).isEqualTo(a.symbol);
    assertThat(a2.matrixAt(0)).isEqualTo(a.matrixAt(0));
    assertThat(Gate.fromJson(a2.toJson())).isEqualTo(a2);
};
