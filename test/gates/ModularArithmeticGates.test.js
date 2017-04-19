import {assertThat, Suite} from "test/TestUtil.js"
import {assertThatGateActsLikePermutation} from "test/CircuitOperationTestUtil.js"

import {ModularArithmeticGates} from "src/gates/ModularArithmeticGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('mod_too_big_disable', () => {
    let circuit = diagram => CircuitDefinition.fromTextDiagram(new Map([
        ['A', InputGates.InputAFamily],
        ['B', InputGates.InputBFamily],
        ['R', InputGates.InputRFamily],
        ['r', InputGates.SetR.withParam(3)],

        ['x', ModularArithmeticGates.IncrementModRFamily],
        ['y', ModularArithmeticGates.DecrementModRFamily],
        ['z', ModularArithmeticGates.PlusAModRFamily],
        ['t', ModularArithmeticGates.MinusAModRFamily],

        ['-', undefined],
        ['/', null],
    ]), diagram);
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    bad(1, 2, `-R-
               -/-
               -x-`);

    bad(1, 0, `-y-
               -R-
               -/-`);

    good(1, 2, `-R-
                -/-
                -y-
                -/-`);

    good(1, 2, `-x-
                -/-
                -/-
                -R-
                -/-`);

    bad(1, 2, `-A-
               -/-
               -z-
               -R-
               -/-`);

    bad(1, 2, `-R-
               -/-
               -t-
               -A-
               -/-`);

    bad(1, 2, `-A-
               ---
               -z-
               -R-
               -/-`);

    good(1, 2, `-A-
                -/-
                -z-
                -R-
                ---`);

    good(1, 2, `-A-
                -/-
                -t-
                -/-
                -R-
                -/-`);

    good(1, 2, `-A-
                r/-
                -t-
                -/-`);
});

suite.testUsingWebGL('increment_mod_R', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.IncrementModRFamily.ofSize(2),
        (t, a) => t < a ? (t + 1) % a : t,
        [2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.IncrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t + 1) % a : t,
        [2]);
});

suite.testUsingWebGL('decrement_mod_R', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.DecrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t - 1 + a) % a : t,
        [3]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.DecrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t - 1 + a) % a : t,
        [2]);
});

suite.testUsingWebGL('plus_A_mod_R', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? (t + a) % b : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? (t + a) % b : t,
        [3, 2]);
});

suite.testUsingWebGL('minus_A_mod_R', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModRFamily.ofSize(3),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModRFamily.ofSize(2),
        (t, a, b) => t < b ? Util.properMod(t - a, b) : t,
        [3, 2]);
});
