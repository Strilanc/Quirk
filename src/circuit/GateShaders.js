/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {DetailedError} from "../base/DetailedError.js"
import {ketArgs, ketShader} from "./KetShaderUtil.js"
import {Matrix} from "../math/Matrix.js"
import {Shaders} from "../webgl/Shaders.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"
import {
    Inputs,
    Outputs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "../webgl/ShaderCoders.js"

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

const hugeQubitOperationMaker = qubitCount => ketShader(
    '',
    `
        vec2 t = vec2(0.0, 0.0);
        for (int k = 0; k < ${1<<qubitCount}; k++) {
            t += cmul(inp(float(k)),
                      read_coefs(out_id * ${1<<qubitCount}.0 + float(k)));
        }
        return t;
    `,
    qubitCount,
    [Inputs.vec2('coefs')]);
const multiQubitOperationMaker = qubitCount => ketShader(
    `uniform vec4 coefs[${1<<(2*qubitCount-1)}];`,
    `
        int row = int(out_id);
        vec2 t = vec2(0.0, 0.0);
        for (int d = 0; d < ${1<<qubitCount}; d++) {
            // Can't index by row, since it's not a constant, so we do a const brute force loop searching for it.
            if (d == row) {
                for (int k = 0; k < ${1<<(qubitCount-1)}; k++) {
                    vec4 u = coefs[d*${1<<(qubitCount-1)} + k];
                    t += cmul(inp(float(k*2)), u.xy);
                    t += cmul(inp(float(k*2+1)), u.zw);
                }
            }
        }
        return t;
    `,
    qubitCount);
const matrix_operation_shaders = [
    undefined,
    undefined,
    multiQubitOperationMaker(2),
    multiQubitOperationMaker(3),
    hugeQubitOperationMaker(4)
];

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!Matrix} matrix
 * @returns {void}
 */
GateShaders.applyMatrixOperation = (ctx, matrix) => {
    if (!Util.isPowerOf2(matrix.width())) {
        throw new DetailedError("Matrix size isn't a power of 2.", {ctx, matrix});
    }

    // Tiny matrix.
    if (matrix.width() === 2) {
        _applySingleQubitOperationFunc(ctx, matrix);
        return;
    }
    let sizePower = Math.round(Math.log2(matrix.width()));

    // Small matrix (fits in uniforms).
    if (sizePower <= 3) {
        ctx.applyOperation(matrix_operation_shaders[sizePower].withArgs(
            ...ketArgs(ctx),
            WglArg.vec4_array("coefs", matrix.rawBuffer())));
        return;
    }

    // Big matrix (requires a texture).
    if (sizePower <= 4) {
        let tex = Shaders.data(currentShaderCoder().vec2.dataToPixels(matrix.rawBuffer())).toVec2Texture(sizePower * 2);
        try {
            ctx.applyOperation(matrix_operation_shaders[sizePower].withArgs(
                tex,
                ...ketArgs(ctx)));
        } finally {
            tex.deallocByDepositingInPool();
        }
        return;
    }

    throw new DetailedError("Matrix is past 4 qubits. Too expensive.", {ctx, matrix});
};

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleAllBits = (inputTexture, shiftAmount) => {
    let size = currentShaderCoder().vec2.arrayPowerSizeOfTexture(inputTexture);
    return CYCLE_ALL_SHADER_VEC2(
        inputTexture,
        WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, size)));
};
const CYCLE_ALL_SHADER_VEC2 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
    `
    uniform float shiftAmount;

    vec2 outputFor(float k) {
        float span = len_input();
        float shiftedState = k * shiftAmount;
        float cycledState = mod(shiftedState, span) + floor(shiftedState / span);
        return read_input(cycledState);
    }`);

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleAllBitsFloat = (inputTexture, shiftAmount) => {
    let size = currentShaderCoder().float.arrayPowerSizeOfTexture(inputTexture);
    return CYCLE_ALL_SHADER_FLOAT(
        inputTexture,
        WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, size)));
};
const CYCLE_ALL_SHADER_FLOAT = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.float('input')],
    Outputs.float(),
    `
    uniform float shiftAmount;

    float outputFor(float k) {
        float span = len_input();
        float shiftedState = k * shiftAmount;
        float cycledState = mod(shiftedState, span) + floor(shiftedState / span);
        return read_input(cycledState);
    }`);

export {GateShaders}
