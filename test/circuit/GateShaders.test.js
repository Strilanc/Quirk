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
        1, 2, 3, 4,  9,10,11,12, 17,18,19,20, 25,26,27,28,
        33,34,35,36, 41,42,43,44, 49,50,51,52, 57,58,59,60,
        5, 6, 7, 8, 13,14,15,16, 21,22,23,24, 29,30,31,32,
        37,38,39,40, 45,46,47,48, 53,54,55,56, 61,62,63,64
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
