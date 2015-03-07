import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglDirector from "src/webgl/WglDirector.js"
import Rect from "src/base/Rect.js"
import Shades from "src/quantum/Shades.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import Matrix from "src/linalg/Matrix.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import PipelineTexture from "src/quantum/PipelineTexture.js"

let suite = new Suite("PipelineTexture");

suite.webGlTest("fromClassicalStateInRegisterOfSize", () => {
    assertThrows(() => PipelineTexture.fromClassicalStateInRegisterOfSize(-1, 2));
    assertThrows(() => PipelineTexture.fromClassicalStateInRegisterOfSize(4, 2));
    assertThrows(() => PipelineTexture.fromClassicalStateInRegisterOfSize(9, 3));

    assertThat(PipelineTexture.fromClassicalStateInRegisterOfSize(0, 4).forceToAmplitudes()).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    assertThat(PipelineTexture.fromClassicalStateInRegisterOfSize(6, 4).forceToAmplitudes()).isEqualTo([
        0, 0, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    assertThat(PipelineTexture.fromClassicalStateInRegisterOfSize(3, 2).forceToAmplitudes()).isEqualTo([
        0, 0,
        0, 1
    ]);
});

suite.webGlTest("fromClassicalStateInRegisterOfSize", () => {
    assertThrows(() => PipelineTexture.fromAmplitudes([]));
    assertThrows(() => PipelineTexture.fromAmplitudes([1, 2, 3]));

    assertThat(PipelineTexture.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]).forceToAmplitudes()).isEqualTo([
        1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(PipelineTexture.fromAmplitudes(Seq.range(16).toArray()).forceToAmplitudes()).isEqualTo(
        Seq.range(16).toArray());
});

suite.webGlTest("withQubitOperationApplied", () => {
    let s = Math.sqrt(0.5);
    let t = PipelineTexture.fromClassicalStateInRegisterOfSize(7, 3);

    t = t.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.forceToAmplitudes()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0, 0, s, -s]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.forceToAmplitudes()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0.5, -0.5, -0.5, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.forceToAmplitudes()).isApproximatelyEqualTo(new Float32Array([
        s/2, -s/2, -s/2, s/2, -s/2, s/2, s/2, -s/2]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(0, true));
    assertThat(t.forceToAmplitudes()).isApproximatelyEqualTo(new Float32Array([
        s/2, 0, -s/2, -0.5, -s/2, 0, s/2, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, new ControlMask(0x3, 0));
    assertThat(t.forceToAmplitudes()).isApproximatelyEqualTo(new Float32Array([
        0, 0, -s/2, -0.5, 0.5, 0, s/2, 0.5]));
});
