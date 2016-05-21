import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import { fourierTransformStep } from "src/gates/FourierTransformGates.js"

import CircuitShaders from "src/circuit/CircuitShaders.js"
import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import Matrix from "src/math/Matrix.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("FourierTransformGates");

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
    assertThat(fourierTransformStep(input0, control, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.repeat([0.25,0,0,0], 16).flatten().toFloat32Array());
    assertThat(fourierTransformStep(input1, control, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.range(16).map(i => Complex.polar(0.25, Math.PI*i/8)).flatMap(c => [c.real, c.imag, 0, 0]).toFloat32Array(),
        0.0001);
});
