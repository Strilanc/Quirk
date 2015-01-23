QuantumTextureTest = TestCase("QuantumTextureTest");

QuantumTextureTest.prototype.testMaintainsAmplitudes = skipTestIfWebGlNotAvailable(function() {
    var simpleAmps = [
        new Complex(0, 1),
        new Complex(2, 3),
        new Complex(0.5, -1),
        new Complex(0.125, 532)];
    assertThat(QuantumTexture.fromAmplitudes(simpleAmps).toAmplitudes()).isEqualTo(simpleAmps);

    // The floats have to be coded into bytes to get them out, but should maintain 23 bits (~7 digits) of precision
    var precisionAmps = [new Complex(0.1, -1/3)];
    var roundTripped = QuantumTexture.fromAmplitudes(precisionAmps).toAmplitudes();
    assertThat(roundTripped).isApproximatelyEqualTo(precisionAmps, Math.pow(2, -23));
    assertThat(roundTripped).isApproximatelyEqualTo(precisionAmps, 0.0000001);
});

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

    var z2 = QuantumTexture.fromZeroes(2);
    var s = Math.sqrt(0.5);

    // Column extraction
    var m = Matrix.square([
        new Complex(1/2, 1/3), new Complex(1/5, 1/7),
        new Complex(1/11, 1/13), new Complex(1/17, 1/19)
    ]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 1)
        .withQubitOperationApplied(0, m, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(1/2, 1/3), new Complex(1/11, 1/13)]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 1)
        .withQubitOperationApplied(0, m, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(1/5, 1/7), new Complex(1/17, 1/19)]);

    // Single-qubit Hadamard
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 1)
        .withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([s, s]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 1)
        .withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([s, -s]);

    // Interference
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x0, 1)
        .withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
        .withQubitOperationApplied(0, m, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(s/2 + s/5, s/3 + s/7), new Complex(s/11 + s/17, s/13 + s/19)]);
    assertThat(QuantumTexture.fromClassicalStateInRegisterOfSize(0x1, 1)
        .withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
        .withQubitOperationApplied(0, m, ControlMask.NO_CONTROLS)
        .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(s/2 - s/5, s/3 - s/7), new Complex(s/11 - s/17, s/13 - s/19)]);

    // Results from application to a classical state
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([s, s, 0, 0]);
    assertThat(z2.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([s, 0, s, 0]);
    assertThat(z2.withQubitOperationApplied(0, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS).toAmplitudes())
        .isApproximatelyEqualTo([new Complex(0.5, -0.5), new Complex(0.5, 0.5), 0, 0]);

    // Chained
    assertThat(z2.withQubitOperationApplied(0, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS)
                 .withQubitOperationApplied(1, Gate.UP.matrixAt(0), ControlMask.NO_CONTROLS)
                 .toAmplitudes())
        .isApproximatelyEqualTo([new Complex(0, -0.5), 0.5, 0.5, new Complex(0, 0.5)]);

    // Controls not allowed on the qubit being operated on.
    assertThrows(function() { z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(0, true)); });
    assertThrows(function() { z2.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(1, true)); });

    // Controlled
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(1, false)).toAmplitudes())
        .isApproximatelyEqualTo([Math.sqrt(0.5), Math.sqrt(0.5), 0, 0]);
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(1, true)).toAmplitudes())
        .isApproximatelyEqualTo([1, 0, 0, 0]);
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS)
                .withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(0, true))
                .toAmplitudes())
        .isApproximatelyEqualTo([s, 0.5, 0, 0.5]);

    // Qubits outside of register default to zero w.r.t. controls
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(2, false)).toAmplitudes())
        .isApproximatelyEqualTo([Math.sqrt(0.5), Math.sqrt(0.5), 0, 0]);
    assertThat(z2.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.fromBitIs(2, true)).toAmplitudes())
        .isApproximatelyEqualTo([1, 0, 0, 0]);

    // Multi-controlled
    var h4 = QuantumTexture.fromZeroes(4).
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
