import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/linalg/Complex.js"
import Matrix from "src/linalg/Matrix.js"
import SuperpositionNode from "src/quantum/SuperpositionNode.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import Rect from "src/base/Rect.js"

let suite = new Suite("SuperpositionNode");

suite.webGlTest("fromAmplitudes", () => {
    assertThrows(() => SuperpositionNode.fromAmplitudes([]));
    assertThrows(() => SuperpositionNode.fromAmplitudes([1, 2, 3]));

    let t = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(t.read().raw().compute()).isEqualTo(new Float32Array([
        1.5, 0, 0, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]));
    assertThat(t.read().asAmplitudes().compute()).isEqualTo([
        1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(t.read().asProbabilities().compute()).isEqualTo([
        1.5, 1, 0, 0]);

    assertThat(SuperpositionNode.fromAmplitudes(Seq.range(16).toArray()).read().asProbabilities().compute()).
        isEqualTo(Seq.range(16).toArray());
});

suite.webGlTest("fromClassicalStateInRegisterOfSize", () => {
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(-1, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(4, 2));
    assertThrows(() => SuperpositionNode.fromClassicalStateInRegisterOfSize(9, 3));

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(0, 4).read().asAmplitudes().compute()).
        isEqualTo([
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(6, 4).read().asAmplitudes().compute()).
        isEqualTo([
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);

    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(3, 2).read().asAmplitudes().compute()).
        isEqualTo([
            0, 0,
            0, 1
        ]);
});

suite.webGlTest("withQubitOperationApplied", () => {
    let s = Math.sqrt(0.5);
    let t = SuperpositionNode.fromClassicalStateInRegisterOfSize(7, 3);

    t = t.withQubitOperationApplied(0, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.read().asAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0, 0, s, -s]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.read().asAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, 0, 0, 0.5, -0.5, -0.5, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, ControlMask.NO_CONTROLS);
    assertThat(t.read().asAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, -s/2, -s/2, s/2, -s/2, s/2, s/2, -s/2]));

    t = t.withQubitOperationApplied(1, Matrix.HADAMARD, ControlMask.fromBitIs(0, true));
    assertThat(t.read().asAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        s/2, 0, -s/2, -0.5, -s/2, 0, s/2, 0.5]));

    t = t.withQubitOperationApplied(2, Matrix.HADAMARD, new ControlMask(0x3, 0));
    assertThat(t.read().asAmplitudes().compute()).isApproximatelyEqualTo(new Float32Array([
        0, 0, -s/2, -0.5, 0.5, 0, s/2, 0.5]));
});

suite.webGlTest("probabilities", () => {
    assertThat(SuperpositionNode.fromClassicalStateInRegisterOfSize(7, 3).probabilities().read().asProbabilities().
        compute()).isEqualTo([0, 0, 0, 0, 0, 0, 0, 1]);

    assertThat(SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]).probabilities().
        read().asProbabilities().compute()).isEqualTo([2.25, 5, 0, 1]);
});

suite.webGlTest("controlProbabilityCombinations", () => {
    let s = SuperpositionNode.fromAmplitudes([1.5, new Complex(1, -2), 0, Complex.I]);
    assertThat(s.controlProbabilityCombinations(0x0).read().asProbabilities().compute()).isEqualTo([
        8.25, 2.25, 7.25, 2.25]);
    assertThat(s.controlProbabilityCombinations(0x1).read().asProbabilities().compute()).isEqualTo([
        8.25, 6, 7.25, 5]);
    assertThat(s.controlProbabilityCombinations(0x2).read().asProbabilities().compute()).isEqualTo([
        8.25, 2.25, 1, 0]);
    assertThat(s.controlProbabilityCombinations(0x3).read().asProbabilities().compute()).isEqualTo([
        8.25, 6, 1, 1]);
});

suite.webGlTest("packRects", () => {
    assertThat(SuperpositionNode.packRects(new Map())).isEqualTo({
        width: 1,
        height: 1,
        placeMap: new Map()});

    assertThat(SuperpositionNode.packRects(new Map([["a", {width: 8, height: 4}]]))).isEqualTo({
        width: 8,
        height: 4,
        placeMap: new Map([
            ["a", new Rect(0, 0, 8, 4)]
        ])
    });

    assertThat(SuperpositionNode.packRects(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 8,
        height: 8,
        placeMap: new Map([
            ["a", new Rect(0, 0, 8, 4)],
            ["b", new Rect(0, 4, 8, 4)]
        ])
    });

    assertThat(SuperpositionNode.packRects(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 4}],
        ["c", {width: 8, height: 4}],
        ["d", {width: 8, height: 4}],
        ["e", {width: 8, height: 4}],
        ["f", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 16,
        placeMap: new Map([
            ["a", new Rect(0, 0, 8, 4)],
            ["b", new Rect(0, 4, 8, 4)],
            ["c", new Rect(8, 0, 8, 4)],
            ["d", new Rect(8, 4, 8, 4)],
            ["e", new Rect(0, 8, 8, 4)],
            ["f", new Rect(8, 8, 8, 4)]
        ])
    });

    assertThat(SuperpositionNode.packRects(new Map([
        ["a", {width: 8, height: 4}],
        ["b", {width: 8, height: 8}],
        ["c", {width: 8, height: 4}],
        ["d", {width: 8, height: 4}],
        ["e", {width: 8, height: 4}],
        ["f", {width: 8, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 16,
        placeMap: new Map([
            ["a", new Rect(0, 0, 8, 4)],
            ["b", new Rect(0, 4, 8, 8)],
            ["c", new Rect(8, 0, 8, 4)],
            ["d", new Rect(8, 4, 8, 4)],
            ["e", new Rect(8, 8, 8, 4)],
            ["f", new Rect(0, 12, 8, 4)]
        ])
    });

    assertThat(SuperpositionNode.packRects(new Map([
        ["a", {width: 4, height: 4}],
        ["b", {width: 8, height: 8}],
        ["c", {width: 4, height: 4}]
    ]))).isEqualTo({
        width: 16,
        height: 16,
        placeMap: new Map([
            ["a", new Rect(0, 0, 4, 4)],
            ["b", new Rect(4, 0, 8, 8)],
            ["c", new Rect(0, 8, 4, 4)]
        ])
    });
});

suite.webGlTest("mergedReadFloats", () => {
    //noinspection JSCheckFunctionSignatures
    let textureNodes = Seq.range(8).map(i => SuperpositionNode.fromClassicalStateInRegisterOfSize(i, 3)).toArray();
    let readNodes = SuperpositionNode.mergedReadFloats(textureNodes).values();
    //noinspection JSUnresolvedFunction
    let amplitudeNodes = new Seq(readNodes).map(e => e.asAmplitudes()).toArray();
    let amplitudeArrays = PipelineNode.computePipeline(amplitudeNodes);
    assertThat(amplitudeArrays).isEqualTo([
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1]
    ]);
});
