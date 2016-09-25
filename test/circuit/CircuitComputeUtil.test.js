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

suite.test("nestedControls", () => {
    let cnot = circuitDefinitionToGate(circuit(`-•-
                                                -X-`));
    let ccnot_circuit = circuit(`-•-
                                 -?-
                                 -/-`, ['?', cnot]);
    let ccnot_matrix = Matrix.PAULI_X.expandedForQubitInRegister(2, 3, new Controls(3, 3));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => advanceStateWithCircuit(args, ccnot_circuit, false).output,
        ccnot_matrix);
});

suite.test("innerAndOuterInputs", () => {
    let plus_a_times = circuitDefinitionToGate(circuit(`-*-
                                                        -a-`));
    let notcc_circuit = circuit(`-?-
                                 -/-
                                 -b-`, ['?', plus_a_times]);
    let notcc_matrix = Matrix.PAULI_X.expandedForQubitInRegister(0, 3, new Controls(6, 6));
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => advanceStateWithCircuit(args, notcc_circuit, false).output,
        notcc_matrix);
});
