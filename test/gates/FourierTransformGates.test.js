import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import { controlledPhaseGradient } from "src/gates/FourierTransformGates.js"

import CircuitShaders from "src/circuit/CircuitShaders.js"
import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import Matrix from "src/math/Matrix.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("FourierTransformGates");

suite.webGlTest('controlledPhaseGradient', () => {
    const π = Math.PI;
    const c = Math.cos;
    const s = Math.sin;
    let input1 = Shaders.data(Seq.repeat([1, 0, 0, 0], 16).flatten().toFloat32Array()).toFloatTexture(4, 4);
    let noControl = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4);
    let bit3On = CircuitShaders.controlMask(Controls.bit(3, true)).toFloatTexture(4, 4);

    assertThat(controlledPhaseGradient(input1, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
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

    assertThat(controlledPhaseGradient(input1, noControl, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            c(0), s(0), 0, 0,
            c(2*π/8), s(2*π/8), 0, 0,
            c(4*π/8), s(4*π/8), 0, 0,
            c(6*π/8), s(6*π/8), 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            c(0), s(0), 0, 0,
            c(π/4), s(π/4), 0, 0,
            c(2*π/4), s(2*π/4), 0, 0,
            c(3*π/4), s(3*π/4), 0, 0
        ]), 0.001);

    assertThat(controlledPhaseGradient(input1, noControl, 1, 3, -1).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            c(-0), s(-0), 0, 0,
            c(-0), s(-0), 0, 0,
            c(-π/4), s(-π/4), 0, 0,
            c(-π/4), s(-π/4), 0, 0,
            c(-2*π/4), s(-2*π/4), 0, 0,
            c(-2*π/4), s(-2*π/4), 0, 0,
            c(-3*π/4), s(-3*π/4), 0, 0,
            c(-3*π/4), s(-3*π/4), 0, 0
        ]), 0.001);

    assertThat(controlledPhaseGradient(input1, bit3On, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        new Float32Array([
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            c(0), s(0), 0, 0,
            c(π/4), s(π/4), 0, 0,
            c(2*π/4), s(2*π/4), 0, 0,
            c(3*π/4), s(3*π/4), 0, 0
        ]), 0.001);

    let input2 = Shaders.data(Seq.range(16*4).toFloat32Array()).toFloatTexture(4, 4);
    assertThat(controlledPhaseGradient(input2, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.range(16).
            map(i => new Complex(i*4, i*4+1).times(Complex.polar(1, Math.PI*Math.max(0, (i-8))/8))).
            flatMap(c => [c.real, c.imag, 0, 0]).
            toFloat32Array(), 0.01);
});
