import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {circuitDefinitionToGate, advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"
import {assertThatRandomTestOfCircuitOperationActsLikeMatrix} from "test/CircuitOperationTestUtil.js"

import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {Gate} from "src/circuit/Gate.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Seq} from "src/base/Seq.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"

let suite = new Suite("CircuitComputeUtil");

/**
 * @param {!String} diagram
 * @param {!Array.<*>} extras
 */
const circuit = (diagram, ...extras) => CircuitDefinition.fromTextDiagram(new Map([
    ['X', Gates.HalfTurns.X],
    ['Y', Gates.HalfTurns.Y],
    ['Z', Gates.HalfTurns.Z],
    ['H', Gates.HalfTurns.H],
    ['•', Gates.Controls.Control],
    ['a', Gates.InputGates.InputAFamily.ofSize(1)],
    ['b', Gates.InputGates.InputBFamily.ofSize(1)],
    ['*', Gates.MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(1)],
    ['-', undefined],
    ['/', undefined],
    ...extras
]), diagram);

suite.webGlTest("nestedControls", () => {
    let cnot = circuitDefinitionToGate(circuit(`-•-
                                                -X-`));
    let ccnot_circuit = circuit(`-•-
                                 -?-
                                 -/-`, ['?', cnot]);
    let ccnot_matrix = Matrix.PAULI_X.expandedForQubitInRegister(2, 3, new Controls(3, 3));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, ccnot_circuit, false),
        ccnot_matrix);
});

suite.webGlTest("multiNestedControls", () => {
    let notc = circuitDefinitionToGate(circuit(`-X-
                                                -•-`));
    let i_notcc = circuitDefinitionToGate(circuit(`---
                                                   -?-
                                                   -/-
                                                   -•-`, ['?', notc]));
    let shifted_notccc_circuit = circuit(`---
                                          -?-
                                          -/-
                                          -/-
                                          -/-
                                          -•-`, ['?', i_notcc]);
    let shifted_notccc_matrix = Matrix.PAULI_X.expandedForQubitInRegister(2, 6, new Controls(7<<3, 7<<3));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, shifted_notccc_circuit, false),
        shifted_notccc_matrix);
});

suite.webGlTest("innerAndOuterInputs", () => {
    let plus_a_times = circuitDefinitionToGate(circuit(`-*-
                                                        -a-`));
    let notcc_circuit = circuit(`-?-
                                 -/-
                                 -b-`, ['?', plus_a_times]);
    let notcc_matrix = Matrix.PAULI_X.expandedForQubitInRegister(0, 3, new Controls(6, 6));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, notcc_circuit, false),
        notcc_matrix);
});

suite.webGlTest("doublyNestedInputs", () => {
    let plus_a_times = circuitDefinitionToGate(circuit(`-*-
                                                        -a-`));
    let plus_a_times_b = circuitDefinitionToGate(circuit(`-?-
                                                          -/-
                                                          -b-`, ['?', plus_a_times]));
    let shifted_notcc_circuit = circuit(`---
                                         -?-
                                         -/-
                                         -/-`, ['?', plus_a_times_b]);
    let shifted_notcc_matrix = Matrix.PAULI_X.expandedForQubitInRegister(1, 4, new Controls(12, 12));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, shifted_notcc_circuit, false),
        shifted_notcc_matrix);
});

suite.webGlTest("rawAddition", () => {
    let adder = circuit(`-+-
                         -/-
                         -/-
                         -/-
                         -A-
                         -/-`,
        ['A', Gates.InputGates.InputAFamily.ofSize(2)],
        ['+', Gates.Arithmetic.PlusAFamily.ofSize(4)]);
    let matrix = Matrix.generateTransition(1 << 6, e => {
        let a = e & 15;
        let b = (e >> 4) & 3;
        a += b;
        a &= 15;
        return a | (b << 4);
    });
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        ctx => advanceStateWithCircuit(ctx, adder, false),
        matrix);
});
