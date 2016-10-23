import {Suite} from "test/TestUtil.js"
import {MultiplyAccumulateGates} from "src/gates/MultiplyAccumulateGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {assertThatCircuitUpdateActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("MultiplyAccumulateGates");

suite.testUsingWebGL('plus_AB', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(5, [new GateColumn([
                MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(2),
                undefined,
                InputGates.InputAFamily.ofSize(2),
                undefined,
                InputGates.InputBFamily.ofSize(1)])]),
            false).output,
        Matrix.generateTransition(32, i => {
            let a = (i>>2)&3;
            let b = (i>>4)&1;
            let t = i & 3;
            return (a<<2) | (b<<4) | ((t+a*b)&3);
        }));
});

suite.testUsingWebGL('minus_AB', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            new CircuitDefinition(5, [new GateColumn([
                InputGates.InputAFamily.ofSize(2),
                undefined,
                MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(2),
                undefined,
                InputGates.InputBFamily.ofSize(1)])]),
            false).output,
        Matrix.generateTransition(32, i => {
            let a = i&3;
            let b = (i>>4)&1;
            let t = (i>>2)&3;
            return a | (b<<4) | (((t-a*b)&3)<<2);
        }));
});
