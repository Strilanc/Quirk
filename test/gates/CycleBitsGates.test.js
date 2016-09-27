import {Suite, assertThat} from "test/TestUtil.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {cycleBits} from "src/gates/CycleBitsGates.js"

import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Controls} from "src/circuit/Controls.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"

let suite = new Suite("CycleBitsGates");

suite.webGlTest('cycleBits', () => {
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => cycleBits(args, 3, 2),
        Matrix.generateTransition(8, i => ((i&1)<<2) | ((i>>1)&3)));
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => cycleBits(args, 4, -2),
        Matrix.generateTransition(16, i => ((i&3)<<2) | ((i>>2)&3)));
});
