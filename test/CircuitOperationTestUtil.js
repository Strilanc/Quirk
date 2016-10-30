import {assertThat} from "test/TestUtil.js"
import {CircuitEvalContext} from "src/circuit/CircuitEvalContext.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Complex} from "src/math/Complex.js"
import {Controls} from "src/circuit/Controls.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Matrix} from "src/math/Matrix.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

// Turn this on to make it easier to debug why a randomized test is failing.
const USE_SIMPLE_VALUES = false;
if (USE_SIMPLE_VALUES) {
    console.warn("Using simplified random values for circuit operation testing.")
}

/**
 * @param {function(!CircuitEvalContext) : !WglConfiguredShader} shaderFunc
 * @param {!Matrix} matrix
 * @param {!int=} repeats
 */
function assertThatCircuitShaderActsLikeMatrix(shaderFunc, matrix, repeats=5) {
    assertThatCircuitUpdateActsLikeMatrix(
        ctx => ctx.applyOperation(shaderFunc),
        matrix,
        repeats);
}

/**
 * @param {function(!CircuitEvalContext) : void} updateAction
 * @param {!Matrix} matrix
 * @param {!int=} repeats
 */
function assertThatCircuitUpdateActsLikeMatrix(updateAction, matrix, repeats=5) {
    for (let i = 0; i < repeats; i++) {
        assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix);
    }
}

/**
 * @param {function(!CircuitEvalContext) : void} updateAction
 * @param {!Matrix} matrix
 */
function assertThatCircuitMutationActsLikeMatrix_single(updateAction, matrix) {
    let qubitSpan = Math.round(Math.log2(matrix.height()));
    let extraWires = Math.floor(Math.random()*5);
    let time = Math.random();
    let qubitIndex = Math.floor(Math.random() * extraWires);
    if (USE_SIMPLE_VALUES) {
        extraWires = 0;
        time = 0;
        qubitIndex = 0;
    }
    let wireCount = qubitSpan + extraWires;
    let controls = Controls.NONE;
    for (let i = 0; i < extraWires; i++) {
        if (Math.random() < 0.5) {
            controls = controls.and(Controls.bit(i + (i < qubitIndex ? 0 : qubitSpan), Math.random() < 0.5));
        }
    }

    let ampCount = 1 << wireCount;
    let inVec = Matrix.generate(1, ampCount, () => USE_SIMPLE_VALUES ?
        (Math.random() < 0.5 ? 1 : 0) :
        new Complex(Math.random()*10 - 5, Math.random()*10 - 5));

    let tex = Shaders.vec2Data(inVec.rawBuffer()).toVec2Texture(wireCount);
    let trader = new WglTextureTrader(tex);
    let controlsTexture = CircuitShaders.controlMask(controls).toBoolTexture(wireCount);
    let ctx = new CircuitEvalContext(
        time,
        qubitIndex,
        wireCount,
        controls,
        controlsTexture,
        trader,
        new Map());
    updateAction(ctx);

    controlsTexture.deallocByDepositingInPool();
    let outData = KetTextureUtil.tradeTextureForVec2Output(trader);
    let outVec = new Matrix(1, ampCount, outData);

    let expectedOutVec = matrix.applyToStateVectorAtQubitWithControls(inVec, qubitIndex, controls);

    assertThat(outVec).withInfo({matrix, inVec, ctx}).isApproximatelyEqualTo(expectedOutVec, 0.005);
}

export {
    assertThatCircuitUpdateActsLikeMatrix,
    assertThatCircuitShaderActsLikeMatrix
}
