import {Suite} from "test/TestUtil.js"
import {XorGates} from "src/gates/XorGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("ArithmeticGates");

suite.testUsingWebGL('xor_a', () => {
    let matrix = Matrix.generateTransition(1 << 6, i => {
        let a = (i >> 3) & 3;
        let dst = i & 3;
        let left = i & ~3;
        return (a ^ dst) + left;
    });

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(6, [new GateColumn([
                XorGates.XorAFamily.ofSize(2),
                undefined,
                undefined,
                InputGates.InputAFamily.ofSize(2),
                undefined,
                undefined])]),
            false),
        matrix);

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(6, [new GateColumn([
                XorGates.XorAFamily.ofSize(3),
                undefined,
                undefined,
                InputGates.InputAFamily.ofSize(2),
                undefined,
                undefined])]),
            false),
        matrix);

    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(6, [new GateColumn([
                XorGates.XorAFamily.ofSize(2),
                undefined,
                undefined,
                InputGates.InputAFamily.ofSize(3),
                undefined,
                undefined])]),
            false),
        matrix);
});
