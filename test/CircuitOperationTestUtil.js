import { assertThat } from "test/TestUtil.js"
import CircuitEvalArgs from "src/circuit/CircuitEvalArgs.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import Complex from "src/math/Complex.js"
import Controls from "src/circuit/Controls.js"
import Shaders from "src/webgl/Shaders.js"
import Matrix from "src/math/Matrix.js"
import WglTexture from "src/webgl/WglTexture.js"

function assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix(shaderFunc, matrix, repeats=1) {
    for (let i = 0; i < repeats; i++) {
        assertThatRandomTestOfCircuitOperationActsLikeMatrix(args => {
            let r = new WglTexture(args.stateTexture.width, args.stateTexture.height);
            shaderFunc(args).renderTo(r);
            return r;
        }, matrix);
    }
}

/**
 * @param {function(!CircuitEvalArgs) : !WglTexture} operation
 * @param {!Matrix} matrix
 */
function assertThatRandomTestOfCircuitOperationActsLikeMatrix(operation, matrix) {
    Math.random = () => 0;
    let qubitSpan = Math.round(Math.log2(matrix.height()));
    let extraWires = Math.floor(Math.random()*5);
    let time = Math.random();
    let qubitIndex = Math.floor(Math.random() * extraWires);
    let wireCount = qubitSpan + extraWires;
    let [w, h] = [1 << Math.floor(wireCount/2), 1 << Math.ceil(wireCount/2)];
    let controls = Controls.NONE;
    for (let i = 0; i < extraWires; i++) {
        if (Math.random() < 0.5) {
            controls = controls.and(Controls.bit(i + (i < qubitIndex ? 0 : qubitSpan), Math.random() < 0.5));
        }
    }

    let ampCount = matrix.height() << extraWires;
    let inVec = Matrix.generate(1, ampCount, () => new Complex(Math.random()*10 - 5, Math.random()*10 - 5));
    let textureDataIn = new Float32Array(inVec.height() * 4);
    for (let i = 0; i < inVec.height(); i++) {
        textureDataIn[4*i] = inVec.rawBuffer()[2*i];
        textureDataIn[4*i+1] = inVec.rawBuffer()[2*i+1];
    }

    let textureIn = new WglTexture(w, h);
    Shaders.data(textureDataIn).renderTo(textureIn);
    let controlsTexture = CircuitShaders.controlMask(controls).toFloatTexture(w, h);
    let args = new CircuitEvalArgs(
        time,
        qubitIndex,
        wireCount,
        controls,
        controlsTexture,
        textureIn,
        new Map());
    let textureOut = operation(args);

    let textureDataOut = textureOut.readPixels();
    let outVec = Matrix.generate(1, ampCount, r => new Complex(textureDataOut[r*4], textureDataOut[r*4+1]));

    let expectedOutVec = matrix.applyToStateVectorAtQubitWithControls(inVec, qubitIndex, controls);

    assertThat(outVec).withInfo({matrix, inVec, args}).isApproximatelyEqualTo(expectedOutVec, 0.001);
    textureOut.ensureDeinitialized();
    textureIn.ensureDeinitialized();
    controlsTexture.ensureDeinitialized();
}

export { assertThatRandomTestOfCircuitOperationActsLikeMatrix, assertThatRandomTestOfCircuitOperationShaderActsLikeMatrix }
