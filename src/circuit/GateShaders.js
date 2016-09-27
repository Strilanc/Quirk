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
import {WglConfiguredShader} from "src/webgl/WglShader.js"

/**
 * Defines operations used by gates to operate on textures representing superpositions.
 */
class GateShaders {}

/**
 * Renders the result of applying a custom controlled single-qubit operation to a superposition.
 *
 * @param {!CircuitEvalArgs} args
 * @param {!Matrix} matrix
 * @returns {!WglConfiguredShader}
 */
let singleQubitOperationFunc = (args, matrix) => new WglConfiguredShader(destinationTexture => {
        if (matrix.width() !== 2 || matrix.height() !== 2) {
            throw new DetailedError("Not a single-qubit operation.", {matrix});
        }
        let [ar, ai, br, bi, cr, ci, dr, di] = matrix.rawBuffer();
        CUSTOM_SINGLE_QUBIT_OPERATION_SHADER.withArgs(
            ...ketArgs(args),
            WglArg.vec2("a", ar, ai),
            WglArg.vec2("b", br, bi),
            WglArg.vec2("c", cr, ci),
            WglArg.vec2("d", dr, di)
        ).renderTo(destinationTexture);
    });
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
 * @param {!CircuitEvalArgs} args
 * @param {!Matrix} matrix
 * @returns {!WglConfiguredShader}
 */
GateShaders.matrixOperation = (args, matrix) => {
    if (matrix.width() === 2) {
        return singleQubitOperationFunc(args, matrix);
    }
    if (!Util.isPowerOf2(matrix.width())) {
        throw new DetailedError("Matrix size isn't a power of 2.", {args, matrix});
    }
    if (matrix.width() > 1 << 4) {
        throw new DetailedError("Matrix is past 4 qubits. Too expensive.", {args, matrix});
    }
    let shader = matrix_operation_shaders[Math.round(Math.log2(matrix.width())) - 2];
    return new WglConfiguredShader(destinationTexture => {
        shader.withArgs(
            ...ketArgs(args),
            WglArg.float_array("coefs", matrix.rawBuffer())
        ).renderTo(destinationTexture);
    });
};

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleAllBits = (inputTexture, shiftAmount) => {
    let size = Math.floor(Math.log2(inputTexture.width * inputTexture.height));
    return new WglConfiguredShader(destinationTexture => {
        CYCLE_ALL_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, size))
        ).renderTo(destinationTexture);
    });
};
const CYCLE_ALL_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float shiftAmount;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float span = inputSize.x * inputSize.y;
        float state = xy.y * outputWidth + xy.x;
        float shiftedState = state * shiftAmount;
        float cycledState = mod(shiftedState, span) + floor(shiftedState / span);
        vec2 uv = uvFor(cycledState);
        gl_FragColor = texture2D(inputTexture, uv);
    }`);

export {GateShaders}
