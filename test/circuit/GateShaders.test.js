import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "test/CircuitOperationTestUtil.js"

import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Matrix} from "src/math/Matrix.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"

let suite = new Suite("GateShaders");

suite.webGlTest('cycleAllBits', () => {
    let inp = Shaders.vec2Data(Seq.range(16).flatMap(e => [e*4 + 1, e*4 + 2]).toFloat32Array()).toVec2Texture(4);
    let actual = GateShaders.cycleAllBits(inp, -1).readVec2Outputs(4);
    assertThat(actual).isEqualTo(new Float32Array([
        1, 2,    9,10,  17,18,  25,26,
        33,34,  41,42,  49,50,  57,58,
        5, 6,   13,14,  21,22,  29,30,
        37,38,  45,46,  53,54,  61,62
    ]));
    inp.deallocByDepositingInPool();
});

suite.webGlTest("matrixOperation", () => {
    let repeats = 3;
    for (let size = 1; size < 5; size++) {
        let d = 1<<size;
        let matrix = Matrix.generate(d, d, () => new Complex(Math.random() - 0.5, Math.random() - 0.5));
        assertThatCircuitUpdateActsLikeMatrix(
            ctx => GateShaders.applyMatrixOperation(ctx, matrix),
            matrix,
            repeats);
    }
});
