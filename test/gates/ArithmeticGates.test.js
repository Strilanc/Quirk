import {Suite} from "test/TestUtil.js"
import {incrementShaderFunc, ArithmeticGates} from "src/gates/ArithmeticGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {
    assertThatCircuitShaderActsLikeMatrix,
    assertThatCircuitUpdateActsLikeMatrix,
    assertThatGateActsLikePermutation
} from "test/CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('increment', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => incrementShaderFunc(ctx, 3, 5),
        Matrix.generateTransition(8, e => (e+5)&7));

    assertThatCircuitShaderActsLikeMatrix(
        ctx => incrementShaderFunc(ctx, 2, -3),
        Matrix.generateTransition(4, e => (e-3)&3));
});

suite.testUsingWebGL('plus_A', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [new GateColumn([
                ArithmeticGates.PlusAFamily.ofSize(2), undefined, InputGates.InputAFamily.ofSize(2), undefined])]),
            false),
        Matrix.generateTransition(16, i => {
            let a = (i >> 2) & 3;
            let t = i & 3;
            return (a<<2) | (t+a)&3;
        }));
});

suite.testUsingWebGL('minus_A', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(4, [new GateColumn([
                InputGates.InputAFamily.ofSize(2), undefined, ArithmeticGates.MinusAFamily.ofSize(2), undefined])]),
            false),
        Matrix.generateTransition(16, i => {
            let a = i & 3;
            let t = (i >> 2) & 3;
            return a | (((t-a)&3)<<2);
        }));
});

suite.testUsingWebGL('plus_minus_A_like_permutation', () => {
    assertThatGateActsLikePermutation(
        ArithmeticGates.PlusAFamily.ofSize(3),
        (a, t) => (t + a) & 7,
        [2]);

    assertThatGateActsLikePermutation(
        ArithmeticGates.MinusAFamily.ofSize(3),
        (a, t) => (t - a) & 7,
        [4]);
});
