import {Suite} from "test/TestUtil.js"
import {assertThatCircuitShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {PHASE_GRADIENT_SHADER} from "src/gates/PhaseGradientGates.js"

import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"
import {ketArgs} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

let suite = new Suite("PhaseGradientGates");

suite.testUsingWebGL('PHASE_GRADIENT_SHADER', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => PHASE_GRADIENT_SHADER.withArgs(...ketArgs(ctx, 3), WglArg.float('factor', Math.PI/8)),
        Matrix.generateDiagonal(8, i => Complex.polar(1, i*Math.PI/8)));

    assertThatCircuitShaderActsLikeMatrix(
        ctx => PHASE_GRADIENT_SHADER.withArgs(...ketArgs(ctx, 4), WglArg.float('factor', -Math.PI/16)),
        Matrix.generateDiagonal(16, i => Complex.polar(1, -i*Math.PI/16)));
});
