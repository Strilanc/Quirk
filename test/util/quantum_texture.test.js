QuantumTextureTest = TestCase("QuantumTextureTest");

QuantumTextureTest.prototype.testFromZeroes = skipTestIfWebGlNotAvailable(function() {
    assertThrows(function() { QuantumTexture.fromZeroes(-1); });
    assertThat(QuantumTexture.fromZeroes(0).toAmplitudes()).isEqualTo([1]);
    assertThat(QuantumTexture.fromZeroes(1).toAmplitudes()).isEqualTo([1, 0]);
    assertThat(QuantumTexture.fromZeroes(2).toAmplitudes()).isEqualTo([1, 0, 0, 0]);
    assertThat(QuantumTexture.fromZeroes(3).toAmplitudes()).isEqualTo([1, 0, 0, 0, 0, 0, 0, 0]);
    assertThat(QuantumTexture.fromZeroes(9).toAmplitudes())
        .isEqualTo(repeat(Complex.ZERO, 512).withItemReplacedAtBy(0, Complex.ONE));
});

QuantumTextureTest.prototype.testFromClassicalStateInRegisterOfSize = skipTestIfWebGlNotAvailable(function() {
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 0); });
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 1); });
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 4); });

    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 0).toAmplitudes())
        .isEqualTo([1]);
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 0); });

    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 1).toAmplitudes())
        .isEqualTo([1, 0]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 1).toAmplitudes())
        .isEqualTo([0, 1]);
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(0x2, 0); });

    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 2).toAmplitudes())
        .isEqualTo([1, 0, 0, 0]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 2).toAmplitudes())
        .isEqualTo([0, 1, 0, 0]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x2, 2).toAmplitudes())
        .isEqualTo([0, 0, 1, 0]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x3, 2).toAmplitudes())
        .isEqualTo([0, 0, 0, 1]);
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(0x4, 0); });

    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 10).toAmplitudes())
        .isEqualTo(repeat(Complex.ZERO, 1024).withItemReplacedAtBy(0, Complex.ONE));
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(217, 10).toAmplitudes())
        .isEqualTo(repeat(Complex.ZERO, 1024).withItemReplacedAtBy(217, Complex.ONE));
});

QuantumTextureTest.prototype.testWithQubitOperationApplied = skipTestIfWebGlNotAvailable(function() {
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 0); });
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 1); });
    assertThrows(function() { QuantumTexture.fromClassicalStateInRegisterOfSize(-1, 4); });

    var q = QuantumTexture.fromZeroes(2);
    var s = Math.sqrt(0.5);

    // Results from application to a classical state
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([s, s, 0, 0]);
    assertThat(q.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([s, 0, s, 0]);
    assertThat(q.withQubitOperationApplied(0, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([new Complex(0.5, -0.5), new Complex(0.5, 0.5), 0, 0]);

    // Chained
    assertThat(q.withQubitOperationApplied(0, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS)
                .withQubitOperationApplied(1, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS)
                .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(0, -0.5), 0.5, 0.5, new Complex(0, 0.5)]);

    // Controls not allowed on the qubit being operated on.
    assertThrows(function() { q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(0, true)); });
    assertThrows(function() { q.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(1, true)); });

    // Controlled
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(1, false)).toAmplitudes())
        .isApproximatelyEqualTo([Math.sqrt(0.5), Math.sqrt(0.5), 0, 0]);
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(1, true)).toAmplitudes())
        .isApproximatelyEqualTo([1, 0, 0, 0]);
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
                .withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(0, true))
                .toAmplitudes())
        .isApproximatelyEqualTo([s, 0.5, 0, 0.5]);

    // Qubits outside of register default to zero w.r.t. controls
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(2, false)).toAmplitudes())
        .isApproximatelyEqualTo([Math.sqrt(0.5), Math.sqrt(0.5), 0, 0]);
    assertThat(q.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(2, true)).toAmplitudes())
        .isApproximatelyEqualTo([1, 0, 0, 0]);

    // Multi-controlled
    var q4 = QuantumTexture.fromZeroes(4);
    var h4 = q4.
        withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS).
        withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS).
        withQubitOperationApplied(2, Matrix.HADAMARD, ControlMask.NO_CONTROLS).
        withQubitOperationApplied(3, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    var g4 = h4.withQubitOperationApplied(3, Matrix.square([Complex.I, 0, 0, -1]), new ControlMask(0x5, 0x1));
    assertThat(h4.toAmplitudes()).isApproximatelyEqualTo(repeat(0.25, 16));
    assertThat(g4.toAmplitudes()).isApproximatelyEqualTo([
        0.25, new Complex(0, 0.25), 0.25, new Complex(0, 0.25),
        0.25, 0.25, 0.25, 0.25,
        0.25, -0.25, 0.25, -0.25,
        0.25, 0.25, 0.25, 0.25
    ]);
});
