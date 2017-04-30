import {assertThat, Suite} from "test/TestUtil.js"
import {assertThatGateActsLikePermutation, assertThatCircuitOutputsBasisKet} from "test/CircuitOperationTestUtil.js"

import {ModularAdditionGates} from "src/gates/ModularAdditionGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('plus_A_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? (t + a) % b : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [3, 2]);
});

suite.testUsingWebGL('minus_A_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularAdditionGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [3, 2]);
});

suite.testUsingWebGL('plus_A_mod_R_no_nan', () => {
    let circuit = CircuitDefinition.fromTextDiagram(new Map([
        ['a', InputGates.SetA.withParam(0)],
        ['r', InputGates.SetR.withParam(33)],
        ['p', ModularAdditionGates.PlusAModRFamily],
        ['-', undefined],
        ['/', null],
    ]), `-a-p-
         ---/-
         -r-/-
         ---/-
         ---/-
         ---/-`);
    assertThatCircuitOutputsBasisKet(circuit, 0);
});
