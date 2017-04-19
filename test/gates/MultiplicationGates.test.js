import {Suite} from "test/TestUtil.js"
import {MultiplicationGates} from "src/gates/MultiplicationGates.js"
import {modularMultiply, modularUnmultiply} from "src/gates/ModularMultiplicationGates.js"
import {assertThatGateActsLikePermutation} from "test/CircuitOperationTestUtil.js"

let suite = new Suite("MultiplicationGates");

suite.testUsingWebGL('multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAFamily.ofSize(4),
        (x, a) => modularMultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAFamily.ofSize(2),
        (x, a) => modularMultiply(x, a, 1<<2),
        [4]);
});

suite.testUsingWebGL('inverse_multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAInverseFamily.ofSize(4),
        (x, a) => modularUnmultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        MultiplicationGates.TimesAInverseFamily.ofSize(2),
        (x, a) => modularUnmultiply(x, a, 1<<2),
        [4]);
});
