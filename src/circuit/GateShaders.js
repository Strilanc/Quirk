import {Controls} from "src/circuit/Controls.js"
import {DetailedError} from "src/base/DetailedError.js"
import {ketArgs, ketShader} from "src/circuit/KetShaderUtil.js"
import {initializedWglContext} from "src/webgl/WglContext.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {workingShaderCoder, makePseudoShaderWithInputsAndOutputAndCode} from "src/webgl/ShaderCoders.js"

/**
 * Defines operations used by gates to operate on textures representing superpositions.
 */
class GateShaders {}

/**
 * Renders the result of applying a custom controlled single-qubit operation to a superposition.
 *
 * @param {!CircuitEvalContext} ctx
 * @param {!Matrix} matrix
 */
function _applySingleQubitOperationFunc(ctx, matrix) {
    if (matrix.width() !== 2 || matrix.height() !== 2) {
        throw new DetailedError("Not a single-qubit operation.", {matrix});
    }
    let [ar, ai, br, bi, cr, ci, dr, di] = matrix.rawBuffer();
    ctx.applyOperation(CUSTOM_SINGLE_QUBIT_OPERATION_SHADER.withArgs(
        ...ketArgs(ctx),
        WglArg.vec2("a", ar, ai),
        WglArg.vec2("b", br, bi),
        WglArg.vec2("c", cr, ci),
        WglArg.vec2("d", dr, di)));
}

const CUSTOM_SINGLE_QUBIT_OPERATION_SHADER = ketShader(
    'uniform vec2 a, b, c, d;',
    'return cmul(inp(0.0), a+(c-a)*out_id) + cmul(inp(1.0), b+(d-b)*out_id);',
    1);

const multiQubitOperationMaker = qubitCount => ketShader(
    `uniform float coefs[${2<<(2*qubitCount)}];`,
    `
        int row = int(out_id);
        vec2 t = vec2(0.0, 0.0);
        for (int d = 0; d < ${1<<qubitCount}; d++) {
            // Can't index by row, since it's not a constant, so we do a const brute force loop searching for it.
            if (d == row) {
                for (int k = 0; k < ${1<<qubitCount}; k++) {
                    vec2 v = inp(float(k));
                    float r = coefs[d*${2<<qubitCount} + k*2];
                    float i = coefs[d*${2<<qubitCount} + k*2 + 1];
                    t += cmul(v, vec2(r, i));
                }
            }
        }
        return t;
    `,
    qubitCount);
const matrix_operation_shaders = [
    multiQubitOperationMaker(2),
    multiQubitOperationMaker(3),
    multiQubitOperationMaker(4)
];

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!Matrix} matrix
 * @returns {void}
 */
GateShaders.applyMatrixOperation = (ctx, matrix) => {
    if (matrix.width() === 2) {
        _applySingleQubitOperationFunc(ctx, matrix);
        return;
    }
    if (!Util.isPowerOf2(matrix.width())) {
        throw new DetailedError("Matrix size isn't a power of 2.", {ctx, matrix});
    }
    if (matrix.width() > 1 << 4) {
        throw new DetailedError("Matrix is past 4 qubits. Too expensive.", {ctx, matrix});
    }
    let shader = matrix_operation_shaders[Math.round(Math.log2(matrix.width())) - 2];
    ctx.applyOperation(shader.withArgs(
        ...ketArgs(ctx),
        WglArg.float_array("coefs", matrix.rawBuffer())));
};

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleAllBits = (inputTexture, shiftAmount) => {
    let size = workingShaderCoder.vec2ArrayPowerSizeOfTexture(inputTexture);
    return CYCLE_ALL_SHADER(
        inputTexture,
        WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, size)));
};
const CYCLE_ALL_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec2Input('input')],
    workingShaderCoder.vec2Output,
    `
    uniform float shiftAmount;

    vec2 outputFor(float k) {
        float span = len_input();
        float shiftedState = k * shiftAmount;
        float cycledState = mod(shiftedState, span) + floor(shiftedState / span);
        return read_input(cycledState);
    }`);

export {GateShaders}
