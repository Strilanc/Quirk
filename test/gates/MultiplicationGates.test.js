import {Suite} from "test/TestUtil.js"
import {Gates} from "src/gates/AllGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {modularMultiply, modularUnmultiply} from "src/gates/ModularMultiplicationGates.js"
import {assertThatGateActsLikePermutation, assertThatCircuitOutputsBasisKet} from "test/CircuitOperationTestUtil.js"

let suite = new Suite("MultiplicationGates");

suite.testUsingWebGL('multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAFamily.ofSize(4),
        (x, a) => modularMultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAFamily.ofSize(2),
        (x, a) => modularMultiply(x, a, 1<<2),
        [4]);
});

suite.testUsingWebGL('inverse_multiplication_gate', () => {
    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAInverseFamily.ofSize(4),
        (x, a) => modularUnmultiply(x, a, 1<<4),
        [4]);

    assertThatGateActsLikePermutation(
        Gates.MultiplicationGates.TimesAInverseFamily.ofSize(2),
        (x, a) => modularUnmultiply(x, a, 1<<2),
        [4]);
});

suite.testUsingWebGL('times_big_A', () => {
    let circuit = CircuitDefinition.fromTextDiagram(new Map([
        ['a', Gates.InputGates.SetA.withParam(16385)],
        ['*', Gates.MultiplicationGates.TimesAFamily],
        ['X', Gates.HalfTurns.X],
        ['-', undefined],
        ['/', null],
    ]), `-a-X-*-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         -----/-
         ---X-/-
         -----/-
         -----/-`);
    assertThatCircuitOutputsBasisKet(circuit, 24577);
});
