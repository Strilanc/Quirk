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

import {Config} from "../Config.js"
import {Controls} from "./Controls.js"
import {ketArgs, ketShaderPermute} from "./KetShaderUtil.js"
import {Shaders} from "../webgl/Shaders.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"
import {
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    Inputs,
    Outputs
} from "../webgl/ShaderCoders.js"

/**
 * Defines operations used to initialize, advance, and inspect quantum states stored in WebGL textures.
 */
class CircuitShaders {}

/**
 * Returns a configured shader that renders the superposition corresponding to a classical state.
 *
 * @param {!int} stateBitMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.classicalState = stateBitMask => SET_SINGLE_PIXEL_SHADER(
    WglArg.float("state", stateBitMask));
const SET_SINGLE_PIXEL_SHADER = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.vec2(), `
    uniform float state;
    vec2 outputFor(float k) {
        return vec2(float(k == state), 0.0);
    }`);

/**
 * Renders a texture with the given background texture, but with the given foreground texture's data scanned
 * linearly into the background.
 *
 * @param {!int} offset
 * @param {!WglTexture} foregroundTexture
 * @param {!WglTexture} backgroundTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.linearOverlay = (offset, foregroundTexture, backgroundTexture) => LINEAR_OVERLAY_SHADER(
    backgroundTexture,
    foregroundTexture,
    WglArg.float("offset", offset));
const LINEAR_OVERLAY_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [
        Inputs.vec4('back'),
        Inputs.vec4('fore')
    ],
    Outputs.vec4(),
    `
    uniform float offset;
    vec4 outputFor(float k) {
        // Note: can't use multiplication to combine because it spreads NaNs from the background into the foreground.
        return k >= offset && k < offset + len_fore() ? read_fore(k - offset) : read_back(k);
    }`);

/**
 * Returns a configured shader that renders a control mask texture corresponding to the given control mask, with 1s
 * at pixels meeting the control and 0s at pixels not meeting the control.
 * @param {!Controls} controlMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlMask = controlMask => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.color(1, 0, 0, 0);
    }

    return CONTROL_MASK_SHADER(
        WglArg.float('used', controlMask.inclusionMask),
        WglArg.float('desired', controlMask.desiredValueMask));
};
const CONTROL_MASK_SHADER = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.bool(), `
    uniform float used;
    uniform float desired;

    bool outputFor(float k) {
        float pass = 1.0;
        float bit = 1.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            float v = mod(floor(k/bit), 2.0);
            float u = mod(floor(used/bit), 2.0);
            float d = mod(floor(desired/bit), 2.0);
            pass *= 1.0 - abs(v-d)*u;
            bit *= 2.0;
        }
        return pass == 1.0;
    }`);

/**
 * Returns a configured shader that renders only the control-matching parts of an input texture to a smaller output
 * texture. This allows later shaders to omit any control-masking steps (and to work on less data).
 * @param {!Controls} controlMask
 * @param {!WglTexture} dataTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlSelect = (controlMask, dataTexture) => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.passthrough(dataTexture);
    }

    return CONTROL_SELECT_SHADER(
        dataTexture,
        WglArg.float('used', controlMask.inclusionMask),
        WglArg.float('desired', controlMask.desiredValueMask));
};
const CONTROL_SELECT_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
    `
    uniform float used;
    uniform float desired;

    /**
     * Inserts bits from the given value into the holes between used bits in the desired mask.
     */
    float scatter(float k) {
        float maskPos = 1.0;
        float coordPos = 1.0;
        float result = 0.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            float v = mod(floor(k/coordPos), 2.0);
            float u = mod(floor(used/maskPos), 2.0);
            float d = mod(floor(desired/maskPos), 2.0);
            result += (v + u*(d-v)) * maskPos;
            coordPos *= 2.0-u;
            maskPos *= 2.0;
        }
        return result;
    }

    vec2 outputFor(float k) {
        return read_input(scatter(k));
    }`);

/**
 * Renders the result of applying a controlled swap operation to a superposition.
 *
 * @param {!CircuitEvalContext} ctx
 * @param {!int} otherRow
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.swap = (ctx, otherRow) =>
    SWAP_QUBITS_SHADER.withArgs(...ketArgs(ctx, otherRow - ctx.row + 1));
const SWAP_QUBITS_SHADER = ketShaderPermute('', `
    float low_bit = mod(out_id, 2.0);
    float mid_bits = floor(mod(out_id, span*0.5)*0.5);
    float high_bit = floor(out_id*2.0/span);
    return high_bit + mid_bits*2.0 + low_bit*span*0.5;`);

/**
 * Returns a configured shader that renders the marginal states of each qubit, for each possible values of the other
 * qubits (i.e. folding still needs to be done), into a destination texture. The marginal states are laid out in
 * [a,br,bi,d] order within each pixel and represent the density matrix {{a, b},{b*, d}}.
 * @param {!WglTexture} inputTexture A superposition texture.
 * @param {undefined|!int=} keptBitMask A bit mask with a 1 at the positions corresponding to indicates of the desired
 * qubit densities.
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.qubitDensities = (inputTexture, keptBitMask = undefined) => {
    if (keptBitMask === undefined) {
        keptBitMask = (1 << currentShaderCoder().vec2.arrayPowerSizeOfTexture(inputTexture)) - 1;
    }
    let keptCount = Util.ceilingPowerOf2(Util.numberOfSetBits(keptBitMask));

    return QUBIT_DENSITIES_SHADER(
        inputTexture,
        WglArg.float('keptCount', keptCount),
        WglArg.float('keptBitMask', keptBitMask));
};
const QUBIT_DENSITIES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec4(),
    `
    uniform float keptCount;
    uniform float keptBitMask;

    float scatter(float val, float used) {
        float result = 0.0;
        float posUsed = 1.0;
        float posVal = 1.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            float u = mod(floor(used/posUsed), 2.0);
            float v = mod(floor(val/posVal), 2.0);
            result += u * v * posUsed;
            posVal *= 1.0+u;
            posUsed *= 2.0;
        }
        return result;
    }

    vec4 outputFor(float k) {
        float bitIndex = mod(k, keptCount);
        float otherBits = floor(k / keptCount);
        float bit = scatter(exp2(bitIndex), keptBitMask);

        // Indices of the two complex values making up the current conditional ket.
        float srcIndex0 = mod(otherBits, bit) + floor(otherBits / bit) * bit * 2.0;
        float srcIndex1 = srcIndex0 + bit;

        // Grab the two complex values.
        vec2 w1 = read_input(srcIndex0);
        vec2 w2 = read_input(srcIndex1);

        // Compute density matrix components.
        float a = dot(w1, w1);
        float br = dot(w1, w2);
        float bi = dot(vec2(-w1.y, w1.x), w2);
        float d = dot(w2, w2);

        return vec4(a, br, bi, d);
    }`);

export {CircuitShaders}
