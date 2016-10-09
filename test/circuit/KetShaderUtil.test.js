import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {ketArgs, ketShader, ketShaderPermute, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix} from "test/CircuitOperationTestUtil.js"
import {Complex} from "src/math/Complex.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"

let suite = new Suite("KetShaderUtil");

suite.webGlTest("ketShader", () => {
    let shader = ketShader(
        'uniform vec2 a, b, c, d;',
        'return cmul(inp(0.0), a+(c-a)*out_id) + cmul(inp(1.0), b+(d-b)*out_id);',
        1);
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => shader.withArgs(
            ...ketArgs(args),
            WglArg.vec2("a", 2, 3),
            WglArg.vec2("b", 5, 7),
            WglArg.vec2("c", 11, 13),
            WglArg.vec2("d", 17, 19)),
        new Matrix(2, 2, new Float32Array([2, 3, 5, 7, 11, 13, 17, 19])));
});

suite.webGlTest("ketShaderPermute", () => {
    let shader = ketShaderPermute(
        '',
        'return mod(out_id + 1.0, 4.0);',
        2);
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => shader.withArgs(...ketArgs(args)),
        Matrix.generateTransition(4, i => (i - 1) & 3));
});

suite.webGlTest("ketShaderPhase", () => {
    let shader = ketShaderPhase(
        '',
        'return vec2(cos(out_id/10.0), sin(out_id/10.0));',
        3);
    assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(
        args => shader.withArgs(...ketArgs(args)),
        Matrix.generateDiagonal(8, i => Complex.polar(1, i/10)));
});
