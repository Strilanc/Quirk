import {Suite} from "test/TestUtil.js"
import {assertThatGateActsLikePermutation, assertThatCircuitOutputsBasisKet} from "test/CircuitOperationTestUtil.js"

import {ModularMultiplyAccumulateGates} from "src/gates/ModularMultiplyAccumulateGates.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("ModularMultiplyAccumulateGates");

suite.testUsingWebGL('plus_AB_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplyAccumulateGates.PlusABModRFamily.ofSize(2),
        (t, a, b, r) => t < r ? (t + a*b) % r : t,
        [2, 2, 2]);
});

suite.testUsingWebGL('minus_AB_mod_R_permutation', () => {
    assertThatGateActsLikePermutation(
        ModularMultiplyAccumulateGates.MinusABModRFamily.ofSize(2),
        (t, a, b, r) => t < r ? Util.properMod(t - a*b, r) : t,
        [2, 2, 2]);
});
