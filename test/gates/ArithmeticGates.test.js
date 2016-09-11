import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import { additionShaderFunc, incrementShaderFunc } from "src/gates/ArithmeticGates.js"

import Controls from "src/circuit/Controls.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"

let suite = new Suite("ArithmeticGates");

suite.webGlTest('increment', () => {
    let input = Shaders.data(Seq.range(4*8+1).skip(1).toFloat32Array()).toFloatTexture(4, 2);
    let assertAbout = (index, span, control, amount) => assertThat(incrementShaderFunc(
        input,
        CircuitShaders.controlMask(control).toFloatTexture(4, 2),
        index,
        span,
        amount).readFloatOutputs(4, 2));

    // Full increment.
    assertAbout(0, 3, Controls.NONE, 0).isEqualTo(input.readPixels());
    assertAbout(0, 3, Controls.NONE, -1).isEqualTo(new Float32Array([
        5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,1,2,3,4
    ]));
    assertAbout(0, 3, Controls.NONE, -5).isEqualTo(new Float32Array([
        21,22,23,24,25,26,27,28,29,30,31,32,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20
    ]));
    assertAbout(0, 3, Controls.NONE, 1).isEqualTo(new Float32Array([
        29,30,31,32,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28
    ]));

    // Single-bit increments.
    assertAbout(0, 1, Controls.NONE, 0).isEqualTo(input.readPixels());
    assertAbout(0, 1, Controls.NONE, -1).isEqualTo(new Float32Array([
        5,6,7,8,1,2,3,4,13,14,15,16,9,10,11,12,21,22,23,24,17,18,19,20,29,30,31,32,25,26,27,28
    ]));
    assertAbout(0, 1, Controls.NONE, 1).isEqualTo(new Float32Array([
        5,6,7,8,1,2,3,4,13,14,15,16,9,10,11,12,21,22,23,24,17,18,19,20,29,30,31,32,25,26,27,28
    ]));
    assertAbout(1, 1, Controls.NONE, -1).isEqualTo(new Float32Array([
        9,10,11,12,13,14,15,16,1,2,3,4,5,6,7,8,25,26,27,28,29,30,31,32,17,18,19,20,21,22,23,24
    ]));
    assertAbout(2, 1, Controls.NONE, -1).isEqualTo(new Float32Array([
        17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16
    ]));

    // Two-bit increments.
    assertAbout(0, 2, Controls.NONE, 0).isEqualTo(input.readPixels());
    assertAbout(0, 2, Controls.NONE, -1).isEqualTo(new Float32Array([
        5,6,7,8,9,10,11,12,13,14,15,16,1,2,3,4,21,22,23,24,25,26,27,28,29,30,31,32,17,18,19,20
    ]));
    assertAbout(0, 2, Controls.NONE, 1).isEqualTo(new Float32Array([
        13,14,15,16,1,2,3,4,5,6,7,8,9,10,11,12,29,30,31,32,17,18,19,20,21,22,23,24,25,26,27,28
    ]));
    assertAbout(1, 2, Controls.NONE, -1).isEqualTo(new Float32Array([
        9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,1,2,3,4,5,6,7,8
    ]));
    assertAbout(1, 2, Controls.NONE, 1).isEqualTo(new Float32Array([
        25,26,27,28,29,30,31,32,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24
    ]));

    // Controlled increments.
    assertAbout(0, 1, Controls.bit(2, false), -1).isEqualTo(new Float32Array([
        5,6,7,8,1,2,3,4,13,14,15,16,9,10,11,12,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32
    ]));
    assertAbout(0, 1, Controls.bit(2, true), -1).isEqualTo(new Float32Array([
        1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,21,22,23,24,17,18,19,20,29,30,31,32,25,26,27,28
    ]));
    assertAbout(1, 2, Controls.bit(0, true), 1).isEqualTo(new Float32Array([
        1,2,3,4,29,30,31,32,9,10,11,12,5,6,7,8,17,18,19,20,13,14,15,16,25,26,27,28,21,22,23,24
    ]));
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
