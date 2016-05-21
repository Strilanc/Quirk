import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import { phaseGradient } from "src/gates/PhaseGradientGates.js"

import CircuitShaders from "src/circuit/CircuitShaders.js"
import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Matrix from "src/math/Matrix.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"

let suite = new Suite("PhaseGradientGates");

suite.webGlTest('phaseGradient', () => {
    const π = Math.PI;
    const c = Math.cos;
    const s = Math.sin;
    let input1 = Shaders.data(Seq.repeat([1, 0, 0, 0], 16).flatten().toFloat32Array()).toFloatTexture(4, 4);
    let noControl = CircuitShaders.controlMask(Controls.NONE).toFloatTexture(4, 4);
    let bit3On = CircuitShaders.controlMask(Controls.bit(3, true)).toFloatTexture(4, 4);

    assertThat(phaseGradient(input1, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
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

    assertThat(phaseGradient(input1, noControl, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
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

    assertThat(phaseGradient(input1, noControl, 1, 3, -1).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
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

    assertThat(phaseGradient(input1, bit3On, 0, 3).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
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
    assertThat(phaseGradient(input2, noControl, 0, 4).readFloatOutputs(4, 4)).isApproximatelyEqualTo(
        Seq.range(16).
            map(i => new Complex(i*4, i*4+1).times(Complex.polar(1, Math.PI*i/16))).
            flatMap(c => [c.real, c.imag, 0, 0]).
            toFloat32Array(), 0.01);
});
