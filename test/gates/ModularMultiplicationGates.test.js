import {assertThat, Suite} from "test/TestUtil.js"
import {
    MODULAR_INVERSE_SHADER_CODE,
    modularMultiply,
    modularUnmultiply,
    ModularMultiplicationGates
} from "src/gates/ModularMultiplicationGates.js"

import {assertThatGateActsLikePermutation} from "test/CircuitOperationTestUtil.js"
import {Outputs, makePseudoShaderWithInputsAndOutputAndCode} from "src/webgl/ShaderCoders.js"
import {Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

let suite = new Suite("ModularMultiplicationGates");

suite.testUsingWebGL('MODULAR_INVERSE_SHADER_CODE', () => {
    let testShader = makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.float(),
        MODULAR_INVERSE_SHADER_CODE + `
        uniform float modulus;
        float outputFor(float k) {
            return modular_multiplicative_inverse(k, modulus);
        }`);


    let assertMatches = (modulus, rangePower) => {
        assertThat(testShader(WglArg.float('modulus', modulus)).readVecFloatOutputs(rangePower)).
        isEqualTo(Seq.range(1<<rangePower).
        map(e => Util.modular_multiplicative_inverse(e, modulus)).
        map(e => e === undefined ? -1 : e).
        toFloat32Array());
    };

    assertMatches(11, 4);
    assertMatches(15, 4);
    assertMatches(16, 4);
    assertMatches(255, 8);
    assertMatches(65363, 12);
});

suite.test("modularMultiply_pow2", () => {
    let checkThat = (...args) => assertThat(modularMultiply(...args));

    checkThat(1, 0, 1<<3).isEqualTo(1);

    checkThat(0, 3, 1<<3).isEqualTo(0);
    checkThat(1, 3, 1<<3).isEqualTo(3);
    checkThat(2, 3, 1<<3).isEqualTo(6);
    checkThat(3, 3, 1<<3).isEqualTo(1);
    checkThat(4, 3, 1<<3).isEqualTo(4);
    checkThat(5, 3, 1<<3).isEqualTo(7);
    checkThat(6, 3, 1<<3).isEqualTo(2);
    checkThat(7, 3, 1<<3).isEqualTo(5);

    checkThat(0, 2, 1<<3).isEqualTo(0);
    checkThat(1, 2, 1<<3).isEqualTo(1);
    checkThat(2, 2, 1<<3).isEqualTo(2);
    checkThat(3, 2, 1<<3).isEqualTo(3);
    checkThat(4, 2, 1<<3).isEqualTo(4);
    checkThat(5, 2, 1<<3).isEqualTo(5);
    checkThat(6, 2, 1<<3).isEqualTo(6);
    checkThat(7, 2, 1<<3).isEqualTo(7);

    checkThat(0, 6, 1<<3).isEqualTo(0);
    checkThat(1, 6, 1<<3).isEqualTo(1);
    checkThat(2, 6, 1<<3).isEqualTo(2);
    checkThat(3, 6, 1<<3).isEqualTo(3);
    checkThat(4, 6, 1<<3).isEqualTo(4);
    checkThat(5, 6, 1<<3).isEqualTo(5);
    checkThat(6, 6, 1<<3).isEqualTo(6);
    checkThat(7, 6, 1<<3).isEqualTo(7);

    checkThat(93, 10011, 1<<16).isEqualTo(0b0011010011001111);
    checkThat(93 *4, 10011, 1<<16).isEqualTo(0b1101001100111100);
    checkThat(93*4, 10011*2, 1<<16).isEqualTo(93*4);
    checkThat(93 * 8, 10011, 1<<16).isEqualTo(0b1010011001111000);
});

suite.test("modularUnmultiply_pow2", () => {
    let checkThat = (...args) => assertThat(modularUnmultiply(...args));

    checkThat(1, 0, 1<<3).isEqualTo(1);

    checkThat(0, 3, 1<<3).isEqualTo(0);
    checkThat(1, 3, 1<<3).isEqualTo(3);
    checkThat(2, 3, 1<<3).isEqualTo(6);
    checkThat(3, 3, 1<<3).isEqualTo(1);
    checkThat(4, 3, 1<<3).isEqualTo(4);
    checkThat(5, 3, 1<<3).isEqualTo(7);
    checkThat(6, 3, 1<<3).isEqualTo(2);
    checkThat(7, 3, 1<<3).isEqualTo(5);

    checkThat(0, 2, 1<<3).isEqualTo(0);
    checkThat(1, 2, 1<<3).isEqualTo(1);
    checkThat(2, 2, 1<<3).isEqualTo(2);
    checkThat(3, 2, 1<<3).isEqualTo(3);
    checkThat(4, 2, 1<<3).isEqualTo(4);
    checkThat(5, 2, 1<<3).isEqualTo(5);
    checkThat(6, 2, 1<<3).isEqualTo(6);
    checkThat(7, 2, 1<<3).isEqualTo(7);

    checkThat(0, 6, 1<<3).isEqualTo(0);
    checkThat(1, 6, 1<<3).isEqualTo(1);
    checkThat(2, 6, 1<<3).isEqualTo(2);
    checkThat(3, 6, 1<<3).isEqualTo(3);
    checkThat(4, 6, 1<<3).isEqualTo(4);
    checkThat(5, 6, 1<<3).isEqualTo(5);
    checkThat(6, 6, 1<<3).isEqualTo(6);
    checkThat(7, 6, 1<<3).isEqualTo(7);

    checkThat(93, 56083, 1<<16).isEqualTo(0b0011010011001111);
});

suite.test("modularMultiply_vs_Unmultiply_fuzz", () => {
    for (let repeat = 0; repeat < 100; repeat++) {
        let mod = Math.floor(Math.random() * (1<<12)) + 1;
        let val = Math.floor(Math.random() * mod);
        let factor = Math.floor(Math.random() * mod);
        let image = modularMultiply(val, factor, mod);
        let actual = modularUnmultiply(image, factor, mod);
        assertThat(actual).withInfo({mod, val, factor, image}).isEqualTo(val);
    }
});

suite.testUsingWebGL('times_a_mod_b_gate', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplicationGates.TimesAModRFamily.ofSize(3),
        modularMultiply,
        [3, 3]);

    assertThatGateActsLikePermutation(
        ModularMultiplicationGates.TimesAModRFamily.ofSize(2),
        modularMultiply,
        [3, 2]);
});

suite.testUsingWebGL('times_a_mod_b_inverse_gate', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplicationGates.TimesAModRInverseFamily.ofSize(3),
        modularUnmultiply,
        [3, 3]);

    assertThatGateActsLikePermutation(
        ModularMultiplicationGates.TimesAModRInverseFamily.ofSize(2),
        modularUnmultiply,
        [3, 2]);
});
