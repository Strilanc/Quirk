import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import GateShaders from "src/circuit/GateShaders.js"
import { assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix } from "test/CircuitOperationTestUtil.js"

import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import Matrix from "src/math/Matrix.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("GateShaders");

suite.webGlTest("matrixOperation_controls", () => {
    let cnt = e => CircuitShaders.controlMask(e).toFloatTexture(4, 2);
    let m = Matrix.square(1, Complex.I.neg(), Complex.I, -1);
    let inp = Shaders.data(new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ])).toFloatTexture(4, 2);

    assertThat(GateShaders.matrixOperation(inp, m, 0, cnt(Controls.bit(3, false))).readFloatOutputs(4, 2)).
        isEqualTo(new Float32Array([
            7, -1, 0, 0,
            -7, -3, 0, 0,
            15, -1, 0, 0,
            -15, -3, 0, 0,
            9, -2, 0, 0,
            -8, -5, 0, 0,
            30, -4, 0, 0,
            -30, -8, 0, 0
        ]));

    assertThat(GateShaders.matrixOperation(inp, m, 0, cnt(Controls.bit(1, false))).readFloatOutputs(4, 2)).
        isEqualTo(new Float32Array([
            7, -1, 0, 0,
            -7, -3, 0, 0,
            6, 7, 0, 0,
            8, 9, 0, 0,
            9, -2, 0, 0,
            -8, -5, 0, 0,
            11, 13, 0, 0,
            17, 19, 0, 0
        ]));

    assertThat(GateShaders.matrixOperation(inp, m, 0, cnt(Controls.bit(1, true))).readFloatOutputs(4, 2)).
        isEqualTo(new Float32Array([
            2, 3, 0, 0,
            4, 5, 0, 0,
            15, -1, 0, 0,
            -15, -3, 0, 0,
            2, 3, 0, 0,
            5, 7, 0, 0,
            30, -4, 0, 0,
            -30, -8, 0, 0
        ]));

    assertThat(GateShaders.matrixOperation(inp, m, 0, cnt(Controls.bit(2, false))).readFloatOutputs(4, 2)).
        isEqualTo(new Float32Array([
            7, -1, 0, 0,
            -7, -3, 0, 0,
            15, -1, 0, 0,
            -15, -3, 0, 0,
            2, 3, 0, 0,
            5, 7, 0, 0,
            11, 13, 0, 0,
            17, 19, 0, 0
        ]));

    assertThat(GateShaders.matrixOperation(inp, m, 1, cnt(Controls.bit(3, false))).readFloatOutputs(4, 2)).
        isEqualTo(new Float32Array([
            9, -3, 0, 0,
            13, -3, 0, 0,
            -9, -5, 0, 0,
            -13, -5, 0, 0,
            15, -8, 0, 0,
            24, -10, 0, 0,
            -14, -11, 0, 0,
            -24, -14, 0, 0
        ]));

    assertThat(GateShaders.matrixOperation(inp, Matrix.zero(2, 2), 0, cnt(Controls.bit(3, false))).
        readFloatOutputs(4, 2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("matrixOperation_matrix", () => {
    let inp = Shaders.data(new Float32Array([
        1, 2, 0, 0,
        3, 27, 0, 0
    ])).toFloatTexture(2, 1);
    let cnt = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(2, 1);
    assertThat(GateShaders.matrixOperation(inp, Matrix.square(1, 0, 0, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            1, 2, 0, 0,
            0, 0, 0, 0
        ]));
    assertThat(GateShaders.matrixOperation(inp, Matrix.square(0, 1, 0, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            3, 27, 0, 0,
            0, 0, 0, 0
        ]));
    assertThat(GateShaders.matrixOperation(inp, Matrix.square(0, 0, 1, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            0, 0, 0, 0,
            1, 2, 0, 0
        ]));
    assertThat(GateShaders.matrixOperation(inp, Matrix.square(0, 0, 0, 1), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            0, 0, 0, 0,
            3, 27, 0, 0
        ]));
});

suite.webGlTest('cycleAllBits', () => {
    let actual = GateShaders.cycleAllBits(
        Shaders.data(Seq.range(4*16+1).skip(1).toFloat32Array()).toFloatTexture(4, 4),
        -1).readFloatOutputs(4, 4);
    assertThat(actual).isEqualTo(new Float32Array([
        1, 2, 3, 4,  9,10,11,12, 17,18,19,20, 25,26,27,28,
        33,34,35,36, 41,42,43,44, 49,50,51,52, 57,58,59,60,
        5, 6, 7, 8, 13,14,15,16, 21,22,23,24, 29,30,31,32,
        37,38,39,40, 45,46,47,48, 53,54,55,56, 61,62,63,64
    ]));
});

suite.webGlTest("matrixOperation_sampleShaderAgainstMatrix", () => {
    let repeats = 3;
    for (let size = 1; size < 5; size++) {
        let d = 1<<size;
        let matrix = Matrix.generate(d, d, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
            args => GateShaders.matrixOperation(args.stateTexture, matrix, args.row, args.controlsTexture),
            matrix,
            repeats);
    }
});
