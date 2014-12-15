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
    assertTrue(QuantumState.classical(0, 0).isEqualTo(new QuantumState(Matrix.col([1]))));

    assertTrue(QuantumState.classical(1, 0).isEqualTo(new QuantumState(Matrix.col([1, 0]))));
    assertTrue(QuantumState.classical(1, 1).isEqualTo(new QuantumState(Matrix.col([0, 1]))));

    assertTrue(QuantumState.classical(2, 0).isEqualTo(new QuantumState(Matrix.col([1, 0, 0, 0]))));
    assertTrue(QuantumState.classical(2, 1).isEqualTo(new QuantumState(Matrix.col([0, 1, 0, 0]))));
    assertTrue(QuantumState.classical(2, 2).isEqualTo(new QuantumState(Matrix.col([0, 0, 1, 0]))));
    assertTrue(QuantumState.classical(2, 3).isEqualTo(new QuantumState(Matrix.col([0, 0, 0, 1]))));
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
