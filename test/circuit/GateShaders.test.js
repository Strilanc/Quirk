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

suite.webGlTest("qubitOperation_controls", () => {
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

    assertThat(GateShaders.qubitOperation(inp, m, 0, cnt(Controls.bit(3, false))).readFloatOutputs(4, 2)).
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

    assertThat(GateShaders.qubitOperation(inp, m, 0, cnt(Controls.bit(1, false))).readFloatOutputs(4, 2)).
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

    assertThat(GateShaders.qubitOperation(inp, m, 0, cnt(Controls.bit(1, true))).readFloatOutputs(4, 2)).
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

    assertThat(GateShaders.qubitOperation(inp, m, 0, cnt(Controls.bit(2, false))).readFloatOutputs(4, 2)).
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

    assertThat(GateShaders.qubitOperation(inp, m, 1, cnt(Controls.bit(3, false))).readFloatOutputs(4, 2)).
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

    assertThat(GateShaders.qubitOperation(inp, Matrix.zero(2, 2), 0, cnt(Controls.bit(3, false))).
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

suite.webGlTest("qubitOperation_matrix", () => {
    let inp = Shaders.data(new Float32Array([
        1, 2, 0, 0,
        3, 27, 0, 0
    ])).toFloatTexture(2, 1);
    let cnt = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(2, 1);
    assertThat(GateShaders.qubitOperation(inp, Matrix.square(1, 0, 0, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            1, 2, 0, 0,
            0, 0, 0, 0
        ]));
    assertThat(GateShaders.qubitOperation(inp, Matrix.square(0, 1, 0, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            3, 27, 0, 0,
            0, 0, 0, 0
        ]));
    assertThat(GateShaders.qubitOperation(inp, Matrix.square(0, 0, 1, 0), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            0, 0, 0, 0,
            1, 2, 0, 0
        ]));
    assertThat(GateShaders.qubitOperation(inp, Matrix.square(0, 0, 0, 1), 0, cnt).readFloatOutputs(2, 1)).
        isEqualTo(new Float32Array([
            0, 0, 0, 0,
            3, 27, 0, 0
        ]));
});

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

suite.webGlTest('addition', () => {
    let actual = GateShaders.addition(
        Shaders.data(Seq.range(4*16+1).skip(1).toFloat32Array()).toFloatTexture(4, 4),
        CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4),
        0,
        2,
        2,
        1).readFloatOutputs(4, 4);
    assertThat(actual).isEqualTo(new Float32Array([
         1, 2, 3, 4, 53,54,55,56, 41,42,43,44, 29,30,31,32,
        17,18,19,20,  5, 6, 7, 8, 57,58,59,60, 45,46,47,48,
        33,34,35,36, 21,22,23,24,  9,10,11,12, 61,62,63,64,
        49,50,51,52, 37,38,39,40, 25,26,27,28, 13,14,15,16
    ]));
});
suite.webGlTest('fourierTransformStep', () => {
    let _ = 0;
    let w = Math.sqrt(1/8);
    let input0 = Shaders.data(new Float32Array([
        w,_,_,_, w,_,_,_, w,_,_,_, w,_,_,_,
        w,_,_,_, w,_,_,_, w,_,_,_, w,_,_,_,
        _,_,_,_, _,_,_,_, _,_,_,_, _,_,_,_,
        _,_,_,_, _,_,_,_, _,_,_,_, _,_,_,_
    ])).toFloatTexture(4, 4);
    let input1 = Shaders.data(new Float32Array([
        _,_,_,_, _,_,_,_, _,_,_,_, _,_,_,_,
        _,_,_,_, _,_,_,_, _,_,_,_, _,_,_,_,
        w,_,_,_, w,_,_,_, w,_,_,_, w,_,_,_,
        w,_,_,_, w,_,_,_, w,_,_,_, w,_,_,_
    ])).toFloatTexture(4, 4);
    let control = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4);
    assertThat(GateShaders.fourierTransformStep(input0, control, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.repeat([0.25,0,0,0], 16).flatten().toFloat32Array());
    assertThat(GateShaders.fourierTransformStep(input1, control, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.range(16).map(i => Complex.polar(0.25, Math.PI*i/8)).flatMap(c => [c.real, c.imag, 0, 0]).toFloat32Array(),
        0.0001);
});


suite.webGlTest('phaseGradient', () => {
    const π = Math.PI;
    const c = Math.cos;
    const s = Math.sin;
    let input1 = Shaders.data(Seq.repeat([1, 0, 0, 0], 16).flatten().toFloat32Array()).toFloatTexture(4, 4);
    let noControl = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4);
    let bit3On = CircuitShaders.controlMask(Controls.bit(3, true)).toFloatTexture(4, 4);

    assertThat(GateShaders.phaseGradient(input1, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            c(0), s(0), 0, 0,
            c(π/16), s(π/16), 0, 0,
            c(2*π/16), s(2*π/16), 0, 0,
            c(3*π/16), s(3*π/16), 0, 0,
            c(4*π/16), s(4*π/16), 0, 0,
            c(5*π/16), s(5*π/16), 0, 0,
            c(6*π/16), s(6*π/16), 0, 0,
            c(7*π/16), s(7*π/16), 0, 0,
            c(8*π/16), s(8*π/16), 0, 0,
            c(9*π/16), s(9*π/16), 0, 0,
            c(10*π/16), s(10*π/16), 0, 0,
            c(11*π/16), s(11*π/16), 0, 0,
            c(12*π/16), s(12*π/16), 0, 0,
            c(13*π/16), s(13*π/16), 0, 0,
            c(14*π/16), s(14*π/16), 0, 0,
            c(15*π/16), s(15*π/16), 0, 0
        ]), 0.001);

    assertThat(GateShaders.phaseGradient(input1, noControl, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            c(0), s(0), 0, 0,
            c(π/8), s(π/8), 0, 0,
            c(2*π/8), s(2*π/8), 0, 0,
            c(3*π/8), s(3*π/8), 0, 0,
            c(4*π/8), s(4*π/8), 0, 0,
            c(5*π/8), s(5*π/8), 0, 0,
            c(6*π/8), s(6*π/8), 0, 0,
            c(7*π/8), s(7*π/8), 0, 0,
            c(0), s(0), 0, 0,
            c(π/8), s(π/8), 0, 0,
            c(2*π/8), s(2*π/8), 0, 0,
            c(3*π/8), s(3*π/8), 0, 0,
            c(4*π/8), s(4*π/8), 0, 0,
            c(5*π/8), s(5*π/8), 0, 0,
            c(6*π/8), s(6*π/8), 0, 0,
            c(7*π/8), s(7*π/8), 0, 0
        ]), 0.001);

    assertThat(GateShaders.phaseGradient(input1, noControl, 1, 3, -1).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            c(-0), s(-0), 0, 0,
            c(-0), s(-0), 0, 0,
            c(-π/8), s(-π/8), 0, 0,
            c(-π/8), s(-π/8), 0, 0,
            c(-2*π/8), s(-2*π/8), 0, 0,
            c(-2*π/8), s(-2*π/8), 0, 0,
            c(-3*π/8), s(-3*π/8), 0, 0,
            c(-3*π/8), s(-3*π/8), 0, 0,
            c(-4*π/8), s(-4*π/8), 0, 0,
            c(-4*π/8), s(-4*π/8), 0, 0,
            c(-5*π/8), s(-5*π/8), 0, 0,
            c(-5*π/8), s(-5*π/8), 0, 0,
            c(-6*π/8), s(-6*π/8), 0, 0,
            c(-6*π/8), s(-6*π/8), 0, 0,
            c(-7*π/8), s(-7*π/8), 0, 0,
            c(-7*π/8), s(-7*π/8), 0, 0
        ]), 0.001);

    assertThat(GateShaders.phaseGradient(input1, bit3On, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            c(0), s(0), 0, 0,
            c(π/8), s(π/8), 0, 0,
            c(2*π/8), s(2*π/8), 0, 0,
            c(3*π/8), s(3*π/8), 0, 0,
            c(4*π/8), s(4*π/8), 0, 0,
            c(5*π/8), s(5*π/8), 0, 0,
            c(6*π/8), s(6*π/8), 0, 0,
            c(7*π/8), s(7*π/8), 0, 0
        ]), 0.001);

    let input2 = Shaders.data(Seq.range(16*4).toFloat32Array()).toFloatTexture(4, 4);
    assertThat(GateShaders.phaseGradient(input2, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.range(16).
            map(i => new Complex(i*4, i*4+1).times(Complex.polar(1, Math.PI*i/16))).
            flatMap(c => [c.real, c.imag, 0, 0]).
            toFloat32Array(), 0.01);
});
