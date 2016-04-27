import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import GateShaders from "src/circuit/GateShaders.js"

import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import Matrix from "src/math/Matrix.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("GateShaders");

suite.webGlTest('universalNot', () => {
    let _ = 0;
    let input = Shaders.data(new Float32Array([
        1,2,_,_, 3,4,_,_,
        5,6,_,_, 7,8,_,_
    ])).toFloatTexture(2, 2);
    let assertAbout = (index, control) => assertThat(GateShaders.universalNot(
        input,
        CircuitShaders.controlMask(control).toFloatTexture(2, 2),
        index).readFloatOutputs(2, 2));
    assertAbout(0, Controls.NONE).isEqualTo(new Float32Array([
        3,-4,_,_, -1,2,_,_,
        7,-8,_,_, -5,6,_,_
    ]));
    assertAbout(1, Controls.NONE).isEqualTo(new Float32Array([
        5,-6,_,_, 7,-8,_,_,
        -1,2,_,_, -3,4,_,_
    ]));
    assertAbout(0, Controls.bit(1, true)).isEqualTo(new Float32Array([
        1,2,_,_, 3,4,_,_,
        7,-8,_,_, -5,6,_,_
    ]));
});

suite.webGlTest('increment', () => {
    let input = Shaders.data(Seq.range(4*8+1).skip(1).toFloat32Array()).toFloatTexture(4, 2);
    let assertAbout = (index, span, control, amount) => assertThat(GateShaders.increment(
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
