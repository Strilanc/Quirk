/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assertThat, Suite} from "../TestUtil.js"
import {
    MODULAR_INVERSE_SHADER_CODE,
    POW_MOD_SHADER_CODE,
    modularMultiply,
    modularUnmultiply,
    modularPowerMultiply,
    ModularMultiplicationGates
} from "../../src/gates/ModularMultiplicationGates.js"

import {assertThatGateActsLikePermutation} from "../CircuitOperationTestUtil.js"
import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {CircuitStats} from "../../src/circuit/CircuitStats.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Outputs, makePseudoShaderWithInputsAndOutputAndCode} from "../../src/webgl/ShaderCoders.js"
import {Seq} from "../../src/base/Seq.js"
import {Util} from "../../src/base/Util.js"
import {WglArg} from "../../src/webgl/WglArg.js"

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

suite.testUsingWebGL('MODULAR_INVERSE_SHADER_CODE_big_mul_mod', () => {
    let testShader = makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.float(),
        MODULAR_INVERSE_SHADER_CODE + `
        uniform float modulus;
        float outputFor(float k) {
            return big_mul_mod(k * 15.0, k * 7.0, modulus);
        }`);

    assertThat(testShader(WglArg.float('modulus', 65363)).readVecFloatOutputs(12)).
        isEqualTo(Seq.range(1<<12).
        map(e => e * e * 105.0 % 65363).
        toFloat32Array());
});

suite.testUsingWebGL('POW_MOD_SHADER_CODE', () => {
    let testShader = makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.float(),
        POW_MOD_SHADER_CODE + `
        uniform float base;
        uniform float modulus;
        uniform float factor;
        float outputFor(float k) {
            return pow_mod(base, k * factor, modulus);
        }`);

    let assertMatches = (base, modulus, rangePower, factor=1) => {
        assertThat(testShader(WglArg.float('base', base),
                              WglArg.float('modulus', modulus),
                              WglArg.float('factor', factor)).readVecFloatOutputs(rangePower)).
            isEqualTo(Seq.range(1<<rangePower).
            map(e => modularPowerMultiply(1, base, e * factor, modulus)).
            map(e => e === undefined ? -1 : e).
            toFloat32Array());
    };

    assertMatches(3, 11, 4);
    assertMatches(4, 15, 4);
    assertMatches(7, 16, 4);
    assertMatches(7, 16, 4, -1);
    assertMatches(11, 255, 8);
    assertMatches(14, 65363, 12);
    assertMatches(14, 65363, 12, -1);
});

suite.test("modularPowerMultiply", () => {
    assertThat(modularPowerMultiply(8, 23, 0, 37613)).isEqualTo(8);
    assertThat(modularPowerMultiply(3, 2, 12, 255)).isEqualTo(48);
    assertThat(modularPowerMultiply(1, 3, -12, 251)).isEqualTo(173);
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

suite.testUsingWebGL('TimesBToTheAModRFamily', () => {
    let circuit = new CircuitDefinition(8, [
        new GateColumn([
            undefined,
            Gates.HalfTurns.X,
            Gates.InputGates.SetB.withParam(5),
            Gates.InputGates.SetA.withParam(6),
            Gates.InputGates.SetR.withParam(251),
            undefined,
            undefined,
            undefined,
        ]),
        new GateColumn([
            Gates.ModularMultiplicationGates.TimesBToTheAModRFamily.ofSize(8),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        ]),
    ]);
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0);
    assertThat([...stats.finalState.rawBuffer()].indexOf(1) / 2).isEqualTo(126);
});

suite.testUsingWebGL('TimesInverseBToTheAModRFamily', () => {
    let circuit = new CircuitDefinition(8, [
        new GateColumn([
            Gates.HalfTurns.X,
            Gates.HalfTurns.X,
            Gates.InputGates.SetB.withParam(5),
            Gates.InputGates.SetA.withParam(3),
            Gates.InputGates.SetR.withParam(251),
            undefined,
            undefined,
            undefined,
        ]),
        new GateColumn([
            Gates.ModularMultiplicationGates.TimesInverseBToTheAModRFamily.ofSize(8),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        ]),
    ]);
    let stats = CircuitStats.fromCircuitAtTime(circuit, 0);
    assertThat([...stats.finalState.rawBuffer()].indexOf(1) / 2).isEqualTo(245);
});

suite.testUsingWebGL('TimesBToTheAModRFamily_perm', () => {
    assertThatGateActsLikePermutation(
        Gates.ModularMultiplicationGates.TimesBToTheAModRFamily.ofSize(3),
        (v, a, b, r) => modularPowerMultiply(v, b, a, r),
        [3, 3, 3]);
});

suite.testUsingWebGL('TimesBToTheAModRFamilyInverse_perm', () => {
    assertThatGateActsLikePermutation(
        Gates.ModularMultiplicationGates.TimesInverseBToTheAModRFamily.ofSize(3),
        (v, a, b, r) => modularPowerMultiply(v, b, -a, r),
        [3, 3, 3]);
});
