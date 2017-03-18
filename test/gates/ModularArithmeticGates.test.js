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

        ['x', ModularArithmeticGates.IncrementModAFamily],
        ['y', ModularArithmeticGates.DecrementModAFamily],
        ['z', ModularArithmeticGates.PlusAModBFamily],
        ['t', ModularArithmeticGates.MinusAModBFamily],

        ['-', undefined],
        ['/', null],
    ]), diagram);
    let bad = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isNotEqualTo(undefined);
    let good = (col, row, diagram) =>
        assertThat(circuit(diagram).gateAtLocIsDisabledReason(col, row)).isEqualTo(undefined);

    bad(1, 2, `-A-
               -/-
               -x-`);

    bad(1, 0, `-y-
               -A-
               -/-`);

    good(1, 2, `-A-
                -/-
                -y-
                -/-`);

    good(1, 2, `-x-
                -/-
                -/-
                -A-
                -/-`);

    bad(1, 2, `-A-
               -/-
               -z-
               -B-
               -/-`);

    bad(1, 2, `-B-
               -/-
               -t-
               -A-
               -/-`);

    bad(1, 2, `-A-
               ---
               -z-
               -B-
               -/-`);

    good(1, 2, `-A-
                -/-
                -z-
                -B-
                ---`);

    good(1, 2, `-A-
                -/-
                -t-
                -/-
                -B-
                -/-`);
});

suite.testUsingWebGL('increment_mod_A', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.IncrementModAFamily.ofSize(2),
        (a, t) => t < a ? (t + 1) % a : t,
        [2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.IncrementModAFamily.ofSize(3),
        (a, t) => t < a ? (t + 1) % a : t,
        [2]);
});

suite.testUsingWebGL('decrement_mod_A', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.DecrementModAFamily.ofSize(3),
        (a, t) => t < a ? (t - 1 + a) % a : t,
        [3]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.DecrementModAFamily.ofSize(3),
        (a, t) => t < a ? (t - 1 + a) % a : t,
        [2]);
});

suite.testUsingWebGL('plus_A_mod_B', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModBFamily.ofSize(2),
        (a, b, t) => t < b ? (t + a) % b : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModBFamily.ofSize(3),
        (a, b, t) => t < b ? (t + a) % b : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.PlusAModBFamily.ofSize(2),
        (a, b, t) => t < b ? (t + a) % b : t,
        [3, 2]);
});

suite.testUsingWebGL('minus_A_mod_B', () => {
    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModBFamily.ofSize(2),
        (a, b, t) => t < b ? Util.properMod(t - a, b) : t,
        [2, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModBFamily.ofSize(3),
        (a, b, t) => t < b ? Util.properMod(t - a, b) : t,
        [1, 2]);

    assertThatGateActsLikePermutation(
        ModularArithmeticGates.MinusAModBFamily.ofSize(2),
        (a, b, t) => t < b ? Util.properMod(t - a, b) : t,
        [3, 2]);
});
