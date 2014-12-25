QuantumStateTest = TestCase("QuantumStateTest");

QuantumStateTest.prototype.testIsEqualTo = function() {
    var s = new QuantumState(Matrix.col([1, 0]));
    assertTrue(s.isEqualTo(s));
    assertFalse(s.isEqualTo(""));
    assertFalse(s.isEqualTo(null));

    assertTrue(s.columnVector.isEqualTo(Matrix.col([1, 0])));
    assertTrue(s.isEqualTo(new QuantumState(Matrix.col([1, 0]))));
    assertFalse(s.isEqualTo(new QuantumState(Matrix.col([-1, 0]))));
};

QuantumStateTest.prototype.testBit = function() {
    assertTrue(QuantumState.bit(false).isEqualTo(QuantumState.SINGLE_ZERO));
    assertTrue(QuantumState.bit(true).isEqualTo(QuantumState.SINGLE_ONE));
};

QuantumStateTest.prototype.testZero = function() {
    assertTrue(QuantumState.zero(0).isEqualTo(new QuantumState(Matrix.col([1]))));
    assertTrue(QuantumState.zero(1).isEqualTo(new QuantumState(Matrix.col([1, 0]))));
    assertTrue(QuantumState.zero(2).isEqualTo(new QuantumState(Matrix.col([1, 0, 0, 0]))));
};

QuantumStateTest.prototype.testClassical = function() {
    assertThat(QuantumState.classical(0, 0)).isEqualTo(new QuantumState(Matrix.col([1])));

    assertThat(QuantumState.classical(1, 0)).isEqualTo(new QuantumState(Matrix.col([1, 0])));
    assertThat(QuantumState.classical(1, 1)).isEqualTo(new QuantumState(Matrix.col([0, 1])));

    assertThat(QuantumState.classical(2, 0)).isEqualTo(new QuantumState(Matrix.col([1, 0, 0, 0])));
    assertThat(QuantumState.classical(2, 1)).isEqualTo(new QuantumState(Matrix.col([0, 1, 0, 0])));
    assertThat(QuantumState.classical(2, 2)).isEqualTo(new QuantumState(Matrix.col([0, 0, 1, 0])));
    assertThat(QuantumState.classical(2, 3)).isEqualTo(new QuantumState(Matrix.col([0, 0, 0, 1])));
};

QuantumStateTest.prototype.testProbability = function() {
    assertEquals(1, QuantumState.zero(10).probability(0x0, 0x0));
    assertEquals(1, QuantumState.zero(10).probability(0x0, 0x1));
    assertEquals(0, QuantumState.zero(10).probability(0x1, 0x1));

    var s = Math.sqrt(0.5);
    assertTrue(Math.abs(1 - new QuantumState(Matrix.col([s, s])).probability(0x0, 0x0)) < 0.0000001);
    assertTrue(Math.abs(0.5 - new QuantumState(Matrix.col([s, s])).probability(0x0, 0x1)) < 0.0000001);
    assertTrue(Math.abs(0.5 - new QuantumState(Matrix.col([s, s])).probability(0x1, 0x1)) < 0.0000001);
};

QuantumStateTest.prototype.testConditionalProbability = function() {
    assertEquals(1, QuantumState.zero(10).conditionalProbability(0x0, 0x0, 0x0));
    assertEquals(1, QuantumState.zero(10).conditionalProbability(0x0, 0x1, 0x0));

    assertEquals(1, QuantumState.zero(10).conditionalProbability(0x0, 0x0, 0x1));
    assertEquals(null, QuantumState.zero(10).conditionalProbability(0x1, 0x0, 0x1));

    assertEquals(0, QuantumState.zero(10).conditionalProbability(0x1, 0x1, 0x0));
    assertEquals(null, QuantumState.zero(10).conditionalProbability(0x1, 0x1, 0x1));

    var s = Math.sqrt(0.5);
    assertEquals(1, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x0, 0x0, 0x0));
    assertEquals(0.5, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x0, 0x1, 0x0));

    assertEquals(1, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x0, 0x0, 0x1));
    assertEquals(1, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x1, 0x0, 0x1));

    assertEquals(0.5, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x1, 0x1, 0x0));
    assertEquals(1, new QuantumState(Matrix.col([s, s])).conditionalProbability(0x1, 0x1, 0x1));
};

QuantumStateTest.prototype.testUniform = function() {
    assertThat(QuantumState.uniform(0)).isEqualTo(new QuantumState(Matrix.col([1])));
    assertThat(QuantumState.uniform(1)).isEqualTo(new QuantumState(Matrix.col([Math.sqrt(0.5), Math.sqrt(0.5)])));
    assertThat(QuantumState.uniform(2)).isEqualTo(new QuantumState(Matrix.col([0.5, 0.5, 0.5, 0.5])));
    assertThat(QuantumState.uniform(3)).isEqualTo(new QuantumState(Matrix.col(repeat(Math.sqrt(0.5)/2, 8))));
};

QuantumStateTest.prototype.testTransformedBy = function() {
    var m = Matrix.square([
        new Complex(0.5, -0.5), new Complex(0.5, 0.5),
        new Complex(0.5, 0.5), new Complex(0.5, -0.5)]);
    assertThat(QuantumState.SINGLE_ZERO.transformedBy(m)).
        isEqualTo(new QuantumState(Matrix.col([new Complex(0.5, -0.5), new Complex(0.5, 0.5)])));
    assertThat(QuantumState.SINGLE_ZERO.transformedBy(m).transformedBy(m)).
        isEqualTo(QuantumState.SINGLE_ONE);
};

QuantumStateTest.prototype.testCountStates = function() {
    assertThat(QuantumState.zero(0).countStates()).isEqualTo(1);
    assertThat(QuantumState.zero(1).countStates()).isEqualTo(2);
    assertThat(QuantumState.zero(2).countStates()).isEqualTo(4);
    assertThat(QuantumState.zero(3).countStates()).isEqualTo(8);
    assertThat(QuantumState.zero(4).countStates()).isEqualTo(16);
    assertThat(QuantumState.zero(5).countStates()).isEqualTo(32);
};

QuantumStateTest.prototype.testCountQubits = function() {
    assertThat(QuantumState.zero(0).countQubits()).isEqualTo(0);
    assertThat(QuantumState.zero(1).countQubits()).isEqualTo(1);
    assertThat(QuantumState.zero(2).countQubits()).isEqualTo(2);
    assertThat(QuantumState.zero(3).countQubits()).isEqualTo(3);
    assertThat(QuantumState.zero(4).countQubits()).isEqualTo(4);
    assertThat(QuantumState.zero(5).countQubits()).isEqualTo(5);
};

QuantumStateTest.prototype.testConcat = function() {
    assertThat(QuantumState.SINGLE_ZERO.concat(QuantumState.SINGLE_ZERO)).isEqualTo(QuantumState.classical(2, 0));
    assertThat(QuantumState.SINGLE_ONE.concat(QuantumState.SINGLE_ZERO)).isEqualTo(QuantumState.classical(2, 1));
    assertThat(QuantumState.SINGLE_ZERO.concat(QuantumState.SINGLE_ONE)).isEqualTo(QuantumState.classical(2, 2));
    assertThat(QuantumState.SINGLE_ONE.concat(QuantumState.SINGLE_ONE)).isEqualTo(QuantumState.classical(2, 3));

    var h = QuantumState.uniform;
    assertThat(h(0).concat(h(0))).isApproximatelyEqualTo(h(0));
    assertThat(h(1).concat(h(1))).isApproximatelyEqualTo(h(2));
    assertThat(h(1).concat(h(2))).isApproximatelyEqualTo(h(3));
    assertThat(h(1).concat(h(3))).isApproximatelyEqualTo(h(4));
    assertThat(h(5).concat(h(3))).isApproximatelyEqualTo(h(8));
    assertThat(h(5).concat(h(5))).isApproximatelyEqualTo(h(10));
};

QuantumStateTest.prototype.testCoefficient = function() {
    assertThat(QuantumState.SINGLE_ZERO.coefficient(0)).isEqualTo(1);
    assertThat(QuantumState.SINGLE_ZERO.coefficient(1)).isEqualTo(0);
    assertThat(QuantumState.SINGLE_ONE.coefficient(0)).isEqualTo(0);
    assertThat(QuantumState.SINGLE_ONE.coefficient(1)).isEqualTo(1);
};

QuantumStateTest.prototype.testTryFactorAroundMask = function() {
    assertThat(QuantumState.SINGLE_ONE.concat(QuantumState.SINGLE_ZERO).tryFactorAroundMask(1)).isEqualTo({
        inside: QuantumState.SINGLE_ONE,
        outside: QuantumState.SINGLE_ZERO
    });

    var h = QuantumState.uniform;
    assertThat(QuantumState.SINGLE_ONE.concat(h(3)).tryFactorAroundMask(1)).isEqualTo({
        inside: QuantumState.SINGLE_ONE,
        outside: h(3)
    });
    assertThat(QuantumState.SINGLE_ONE.concat(h(3)).tryFactorAroundMask(2)).isEqualTo({
        inside: h(1),
        outside: QuantumState.SINGLE_ONE.concat(h(2))
    });

    assertThat(QuantumState.SINGLE_ZERO.transformedBy(Gate.UP.matrix).concat(h(3)).tryFactorAroundMask(6)).isEqualTo({
        inside: h(2),
        outside: QuantumState.SINGLE_ZERO.transformedBy(Gate.UP.matrix).concat(h(1))
    });
};

QuantumStateTest.prototype.testContiguousFactorization = function() {
    var h = QuantumState.uniform;
    var z = QuantumState.zero;

    assertThat(z(0).contiguousFactorization()).isEqualTo([]);
    assertThat(z(1).contiguousFactorization()).isEqualTo([z(1)]);
    assertThat(z(4).contiguousFactorization()).isEqualTo(repeat(z(1), 4));
    assertThat(h(4).contiguousFactorization()).isApproximatelyEqualTo(repeat(h(1), 4));

    var f = h(2).concat(z(2));
    assertThat(f.contiguousFactorization()).isApproximatelyEqualTo([h(1), h(1), z(1), z(1)]);

    var I = Matrix.identity(2);
    var cnot2 = [Matrix.CONTROL, I, Matrix.PAULI_X, I].reverse().reduce(arg2(Matrix.prototype.tensorProduct));
    var cnot1 = [I, Matrix.CONTROL, I, Matrix.PAULI_X].reverse().reduce(arg2(Matrix.prototype.tensorProduct));
    assertThat(f.transformedBy(cnot2).contiguousFactorization()).isApproximatelyEqualTo([
        new QuantumState(Matrix.col([0.5, 0, 0.5, 0, 0, 0.5, 0, 0.5])),
        z(1)]);
    assertThat(f.transformedBy(cnot1).contiguousFactorization()).isApproximatelyEqualTo([
        h(1),
        new QuantumState(Matrix.col([Math.sqrt(0.5), 0, 0, 0, 0, Math.sqrt(0.5), 0, 0]))]);
};
