import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {assertThatRandomTestOfCircuitOperationActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {applyControlledPhaseGradient, FourierTransformGates} from "src/gates/FourierTransformGates.js"
import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"

import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("FourierTransformGates");

suite.webGlTest('controlledPhaseGradient', () => {
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => applyControlledPhaseGradient(args, 3, 1),
        Matrix.generateDiagonal(8, i => i < 4 ? 1 : Complex.polar(1, (i-4)*Math.PI/4)));

    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => applyControlledPhaseGradient(args, 4, -1),
        Matrix.generateDiagonal(16, i => i < 8 ? 1 : Complex.polar(1, -(i-8)*Math.PI/8)));
});

suite.webGlTest('fourierTransform', () => {
    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => advanceStateWithCircuit(
            args,
            new CircuitDefinition(2, [new GateColumn([
                FourierTransformGates.FourierTransformFamily.ofSize(2), undefined])]),
            false).output,
        Matrix.generate(4, 4, (i, j) => Complex.polar(0.5, i*j*Math.PI/2)));

    assertThatRandomTestOfCircuitOperationActsLikeMatrix(
        args => advanceStateWithCircuit(
            args,
            new CircuitDefinition(3, [new GateColumn([
                FourierTransformGates.InverseFourierTransformFamily.ofSize(3), undefined, undefined])]),
            false).output,
        Matrix.generate(8, 8, (i, j) => Complex.polar(Math.sqrt(1/8), -i*j*Math.PI/4)));
});
