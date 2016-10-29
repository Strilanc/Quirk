import {Suite} from "test/TestUtil.js"
import {BitCountGates} from "src/gates/BitCountGates.js"
import {InputGates} from "src/gates/InputGates.js"
import {
    assertThatCircuitShaderActsLikeMatrix,
    assertThatCircuitUpdateActsLikeMatrix
} from "test/CircuitOperationTestUtil.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Matrix} from "src/math/Matrix.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("ArithmeticGates");

let GATE_SET = new Map([
    ['A', InputGates.InputAFamily],
    ['-', undefined],
    ['/', null],
    ['P', BitCountGates.PlusBitCountAFamily],
    ['M', BitCountGates.MinusBitCountAFamily]
]);

suite.testUsingWebGL('PlusBitCountA', () => {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => advanceStateWithCircuit(
            ctx,
            CircuitDefinition.fromTextDiagram(GATE_SET,
                `-A-
                 -/-
                 -/-
                 -P-
                 -/-`),
            false).output,
        Matrix.generateTransition(1<<5, i => {
            let a = i & 7;
            let t = (i >> 3) & 3;
            t += Util.numberOfSetBits(a);
            t &= 3;
            return a | (t << 3);
        }));
});

suite.testUsingWebGL('MinusBitCountA', () => {
    assertThatCircuitUpdateActsLikeMatrix(
            ctx => advanceStateWithCircuit(
            ctx,
            CircuitDefinition.fromTextDiagram(GATE_SET,
                `-A-
                 -/-
                 -/-
                 -M-
                 -/-`),
            false).output,
        Matrix.generateTransition(1<<5, i => {
            let a = i & 7;
            let t = (i >> 3) & 3;
            t -= Util.numberOfSetBits(a);
            t &= 3;
            return a | (t << 3);
        }));
});
