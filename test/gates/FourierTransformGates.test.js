import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {controlledPhaseGradient} from "src/gates/FourierTransformGates.js"

import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("FourierTransformGates");

suite.webGlTest('controlledPhaseGradient', () => {
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => controlledPhaseGradient(args, 3, 1),
        Matrix.generateDiagonal(8, i => i < 4 ? 1 : Complex.polar(1, (i-4)*Math.PI/4)));

    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => controlledPhaseGradient(args, 4, -1),
        Matrix.generateDiagonal(16, i => i < 8 ? 1 : Complex.polar(1, -(i-8)*Math.PI/8)));
});
