import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {additionShaderFunc, incrementShaderFunc} from "src/gates/ArithmeticGates.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"

import {Controls} from "src/circuit/Controls.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("ArithmeticGates");

suite.webGlTest('increment', () => {
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => incrementShaderFunc(args, 3, 5),
        Matrix.generateTransition(8, e => (e+5)&7));

    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
            args => incrementShaderFunc(args, 2, -3),
        Matrix.generateTransition(4, e => (e-3)&3));
});

suite.webGlTest('addition', () => {
    let actual = additionShaderFunc(
        Shaders.data(Seq.range(4*16+1).skip(1).toFloat32Array()).toFloatTexture(4, 4),
        CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4),
        0, 2,
        2, 2,
        +1).readFloatOutputs(4, 4);
    assertThat(actual).isEqualTo(new Float32Array([
        1, 2, 3, 4, 53,54,55,56, 41,42,43,44, 29,30,31,32,
        17,18,19,20,  5, 6, 7, 8, 57,58,59,60, 45,46,47,48,
        33,34,35,36, 21,22,23,24,  9,10,11,12, 61,62,63,64,
        49,50,51,52, 37,38,39,40, 25,26,27,28, 13,14,15,16
    ]));
});
