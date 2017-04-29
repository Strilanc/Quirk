import {assertThat, Suite} from "test/TestUtil.js"
import {assertThatGateActsLikePermutation} from "test/CircuitOperationTestUtil.js"

import {ModularIncrementGates} from "src/gates/ModularIncrementGates.js"
import {ModularAdditionGates} from "src/gates/ModularAdditionGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('mod_too_big_disable', () => {
    let circuit = diagram => CircuitDefinition.fromTextDiagram(new Map([
        ['A', InputGates.InputAFamily],
        ['B', InputGates.InputBFamily],
        ['R', InputGates.InputRFamily],
        ['r', InputGates.SetR.withParam(3)],

        ['x', ModularIncrementGates.IncrementModRFamily],
        ['y', ModularIncrementGates.DecrementModRFamily],
        ['z', ModularAdditionGates.PlusAModRFamily],
        ['t', ModularAdditionGates.MinusAModRFamily],

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
        ModularIncrementGates.IncrementModRFamily.ofSize(2),
        (t, a) => t < a ? (t + 1) % a : t,
        [2]);

    assertThatGateActsLikePermutation(
        ModularIncrementGates.IncrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t + 1) % a : t,
        [2]);
});

suite.testUsingWebGL('decrement_mod_R', () => {
    assertThatGateActsLikePermutation(
        ModularIncrementGates.DecrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t - 1 + a) % a : t,
        [3]);

    assertThatGateActsLikePermutation(
        ModularIncrementGates.DecrementModRFamily.ofSize(3),
        (t, a) => t < a ? (t - 1 + a) % a : t,
        [2]);
});
