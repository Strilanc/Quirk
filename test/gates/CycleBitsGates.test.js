import {Suite} from "test/TestUtil.js"
import {assertThatCircuitShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {cycleBitsShader} from "src/gates/CycleBitsGates.js"

import {Matrix} from "src/math/Matrix.js"

let suite = new Suite("CycleBitsGates");

suite.testUsingWebGL('cycleBitsShader', () => {
    assertThatCircuitShaderActsLikeMatrix(
        ctx => cycleBitsShader(ctx, 3, 2),
        Matrix.generateTransition(8, i => ((i&1)<<2) | ((i>>1)&3)));
    assertThatCircuitShaderActsLikeMatrix(
        ctx => cycleBitsShader(ctx, 4, -2),
        Matrix.generateTransition(16, i => ((i&3)<<2) | ((i>>2)&3)));
});
