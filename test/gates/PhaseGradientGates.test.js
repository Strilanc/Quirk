import {Suite} from "test/TestUtil.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {phaseGradient} from "src/gates/PhaseGradientGates.js"

import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("PhaseGradientGates");

suite.webGlTest('phaseGradient', () => {
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => phaseGradient(args, 3, 1),
        Matrix.generateDiagonal(8, i => Complex.polar(1, i*Math.PI/8)));

    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => phaseGradient(args, 4, -1),
        Matrix.generateDiagonal(16, i => Complex.polar(1, -i*Math.PI/16)));
});
