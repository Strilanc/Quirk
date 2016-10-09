import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"

import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Matrix} from "src/math/Matrix.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"

let suite = new Suite("GateShaders");

suite.webGlTest('cycleAllBits', () => {
    let actual = GateShaders.cycleAllBits(
        Shaders.data(Seq.range(4*16+1).skip(1).toFloat32Array()).toFloatTexture(4, 4),
        -1).readFloatOutputs(4, 4);
    assertThat(actual).isEqualTo(new Float32Array([
        1, 2, 0, 0,  9,10, 0, 0, 17,18, 0, 0, 25,26, 0, 0,
        33,34,0, 0, 41,42, 0, 0, 49,50, 0, 0, 57,58, 0, 0,
        5, 6, 0, 0, 13,14, 0, 0, 21,22, 0, 0, 29,30, 0, 0,
        37,38,0, 0, 45,46, 0, 0, 53,54, 0, 0, 61,62, 0, 0
    ]));
});

suite.webGlTest("matrixOperation", () => {
    let repeats = 3;
    for (let size = 1; size < 5; size++) {
        let d = 1<<size;
        let matrix = Matrix.generate(d, d, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
            args => GateShaders.matrixOperation(args, matrix),
            matrix,
            repeats);
    }
});
