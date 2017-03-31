import {assertThat, Suite} from "test/TestUtil.js"
import {
    MODULAR_INVERSE_SHADER_CODE,
    reversible2sComplementMultiply,
    reversible2sComplementUnmultiply,
    MultiplicationGates
} from "src/gates/MultiplicationGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {
    assertThatCircuitShaderActsLikeMatrix,
    assertThatCircuitUpdateActsLikeMatrix,
    assertThatGateActsLikePermutation
} from "test/CircuitOperationTestUtil.js"
import {
    Inputs,
    Outputs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "src/webgl/ShaderCoders.js"
import {WglArg} from "src/webgl/WglArg.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("MultiplicationGates");

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

suite.test("reversible2sComplementMultiply", () => {
    let checkThat = (...args) => assertThat(reversible2sComplementMultiply(...args));

    checkThat(1, 0, 3).isEqualTo(1);

    checkThat(0, 3, 3).isEqualTo(0);
    checkThat(1, 3, 3).isEqualTo(3);
    checkThat(2, 3, 3).isEqualTo(6);
    checkThat(3, 3, 3).isEqualTo(1);
    checkThat(4, 3, 3).isEqualTo(4);
    checkThat(5, 3, 3).isEqualTo(7);
    checkThat(6, 3, 3).isEqualTo(2);
    checkThat(7, 3, 3).isEqualTo(5);

    checkThat(0, 2, 3).isEqualTo(0);
    checkThat(1, 2, 3).isEqualTo(2);
    checkThat(2, 2, 3).isEqualTo(4);
    checkThat(3, 2, 3).isEqualTo(6);
    checkThat(4, 2, 3).isEqualTo(1);
    checkThat(5, 2, 3).isEqualTo(3);
    checkThat(6, 2, 3).isEqualTo(5);
    checkThat(7, 2, 3).isEqualTo(7);

    checkThat(0, 6, 3).isEqualTo(0);
    checkThat(1, 6, 3).isEqualTo(6);
    checkThat(2, 6, 3).isEqualTo(5);
    checkThat(3, 6, 3).isEqualTo(2);
    checkThat(4, 6, 3).isEqualTo(1);
    checkThat(5, 6, 3).isEqualTo(7);
    checkThat(6, 6, 3).isEqualTo(4);
    checkThat(7, 6, 3).isEqualTo(3);

    checkThat(93, 10011, 16).isEqualTo(0b0011010011001111);
    checkThat(93 *4, 10011, 16).isEqualTo(0b1101001100111100);
    checkThat(93*4, 10011*2, 16).isEqualTo(0b1010011001111001);
    checkThat(93 * 8, 10011, 16).isEqualTo(0b1010011001111000);
});

suite.test("reversible2sComplementUnmultiply", () => {
    let checkThat = (...args) => assertThat(reversible2sComplementUnmultiply(...args));

    checkThat(1, 0, 3).isEqualTo(1);

    checkThat(0, 3, 3).isEqualTo(0);
    checkThat(1, 3, 3).isEqualTo(3);
    checkThat(2, 3, 3).isEqualTo(6);
    checkThat(3, 3, 3).isEqualTo(1);
    checkThat(4, 3, 3).isEqualTo(4);
    checkThat(5, 3, 3).isEqualTo(7);
    checkThat(6, 3, 3).isEqualTo(2);
    checkThat(7, 3, 3).isEqualTo(5);

    checkThat(0, 2, 3).isEqualTo(0);
    checkThat(1, 2, 3).isEqualTo(4);
    checkThat(2, 2, 3).isEqualTo(1);
    checkThat(3, 2, 3).isEqualTo(5);
    checkThat(4, 2, 3).isEqualTo(2);
    checkThat(5, 2, 3).isEqualTo(6);
    checkThat(6, 2, 3).isEqualTo(3);
    checkThat(7, 2, 3).isEqualTo(7);

    checkThat(0, 6, 3).isEqualTo(0);
    checkThat(1, 6, 3).isEqualTo(4);
    checkThat(2, 6, 3).isEqualTo(3);
    checkThat(3, 6, 3).isEqualTo(7);
    checkThat(4, 6, 3).isEqualTo(6);
    checkThat(5, 6, 3).isEqualTo(2);
    checkThat(6, 6, 3).isEqualTo(1);
    checkThat(7, 6, 3).isEqualTo(5);

    checkThat(93, 56083, 16).isEqualTo(0b0011010011001111);
});

suite.test("reversible2sComplementMultiply_vs_Unmultiply", () => {
    for (let repeat = 0; repeat < 10; repeat++) {
        let p = Math.floor(Math.random() * 8) + 8;
        let v = Math.floor(Math.random() * (1<<p));
        let f = Math.floor(Math.random() * (1<<p));
        let r = reversible2sComplementMultiply(v, f, p);
        let s = reversible2sComplementUnmultiply(r, f, p);
        assertThat(s).isEqualTo(v);
    }
});

suite.testUsingWebGL('multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAFamily.ofSize(4),
        (x, a) => reversible2sComplementMultiply(x, a, 4),
        [4]);

    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAFamily.ofSize(2),
        (x, a) => reversible2sComplementMultiply(x, a, 2),
        [4]);
});

suite.testUsingWebGL('inverse_multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAInverseFamily.ofSize(4),
        (x, a) => reversible2sComplementUnmultiply(x, a, 4),
        [4]);

    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAInverseFamily.ofSize(2),
        (x, a) => reversible2sComplementUnmultiply(x, a, 2),
        [4]);
});
