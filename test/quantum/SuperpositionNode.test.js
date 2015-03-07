import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import Matrix from "src/linalg/Matrix.js"
import SuperpositionNode from "src/quantum/SuperpositionNode.js"

let suite = new Suite("SuperpositionNode");

suite.webGlTest("fromAmplitudes", () => {
    assertThrows(() => SuperpositionNode.fromAmplitudes([]));
    assertThrows(() => SuperpositionNode.fromAmplitudes([1, 2, 3]));

    let t = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(t.readFloats().compute()).isEqualTo(new Float32Array([
        1.5, 0, 0, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]));
    assertThat(t.readAsAmplitudes().compute()).isEqualTo([
        1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(t.readAsProbabilities().compute()).isEqualTo([
        1.5, 1, 0, 0]);

    assertThat(SuperpositionNode.fromAmplitudes(Seq.range(16).toArray()).readAsAmplitudes().compute()).
        isEqualTo(Seq.range(16).toArray());
});

suite.webGlTest("fromClassicalStateInRegisterOfSize", () => {
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(-1, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(4, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(9, 3));

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(0, 4).readAsAmplitudes().compute()).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(6, 4).readAsAmplitudes().compute()).isEqualTo([
        0, 0, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(3, 2).readAsAmplitudes().compute()).isEqualTo([
        0, 0,
        0, 1
    ]);
});

suite.webGlTest("withQubitOperationApplied", () => {
    let s = Math.sqrt(0.5);
    let t = SuperpositionNode.fromClassicalStateInRegisterOfSize(7, 3);

    t = t.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.readAsAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0, 0, s, -s]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.readAsAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0.5, -0.5, -0.5, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.readAsAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, -s/2, -s/2, s/2, -s/2, s/2, s/2, -s/2]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(0, true));
    assertThat(t.readAsAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, 0, -s/2, -0.5, -s/2, 0, s/2, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, new ControlMask(0x3, 0));
    assertThat(t.readAsAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, -s/2, -0.5, 0.5, 0, s/2, 0.5]));
});

suite.webGlTest("probabilities", () => {
    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(7, 3).probabilities().readAsProbabilities().
        compute()).isEqualTo([0, 0, 0, 0, 0, 0, 0, 1]);

    assertThat(SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]).probabilities().
        readAsProbabilities().compute()).isEqualTo([2.25, 5, 0, 1]);
});

suite.webGlTest("controlProbabilityCombinations", () => {
    let s = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(s.controlProbabilityCombinations(0x0).readAsProbabilities().compute()).isEqualTo([
        8.25, 2.25, 7.25, 2.25]);
    assertThat(s.controlProbabilityCombinations(0x1).readAsProbabilities().compute()).isEqualTo([
        8.25, 6, 7.25, 5]);
    assertThat(s.controlProbabilityCombinations(0x2).readAsProbabilities().compute()).isEqualTo([
        8.25, 2.25, 1, 0]);
    assertThat(s.controlProbabilityCombinations(0x3).readAsProbabilities().compute()).isEqualTo([
        8.25, 6, 1, 1]);
});
