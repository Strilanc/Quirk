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

import {WglArg} from "./WglArg.js"
import {WglShader} from "./WglShader.js"
import {WglTexture} from "./WglTexture.js"
import {initializedWglContext} from "./WglContext.js"
import {provideWorkingShaderCoderToWglConfiguredShader, WglConfiguredShader} from "./WglConfiguredShader.js"

import {ShaderPart} from "./ShaderCoders_Base.js"
import {SHADER_CODER_BYTES} from "./ShaderCoders_intoBytes.js"
import {SHADER_CODER_FLOATS} from "./ShaderCoders_intoFloats.js"

class ShaderPartDescription {
    /**
     * @param {!function(!ShaderCoder) : !ShaderPart} partMaker
     * @param {!string} description
     */
    constructor(partMaker, description) {
        /**
         * @type {!(function(!ShaderCoder): !ShaderPart)}
         * @private
         */
        this._partMaker = partMaker;
        /**
         * @type {!string}
         */
        this.description = description;
    }

    /**
     * @param {!ShaderCoder} coder
     * @returns {!ShaderPart}
     */
    toConcretePart(coder=undefined) {
        return this._partMaker(coder || currentShaderCoder());
    }

    toString() {
        return `ShaderPartDescription(${this.description})`;
    }
}

class Inputs {
    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static bool(name) {
        return new ShaderPartDescription(
            coder => coder.bool.inputPartGetter(name),
            `Inputs.bool(${name})`);
    }

    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static float(name) {
        return new ShaderPartDescription(
            coder => coder.float.inputPartGetter(name),
            `Inputs.float(${name})`);
    }

    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static vec2(name) {
        return new ShaderPartDescription(
            coder => coder.vec2.inputPartGetter(name),
            `Inputs.vec2(${name})`);
    }

    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static vec4(name) {
        return new ShaderPartDescription(
            coder => coder.vec4.inputPartGetter(name),
            `Inputs.vec4(${name})`);
    }
}

class Outputs {
    /**
     * @returns {!ShaderPartDescription}
     */
    static bool() {
        return new ShaderPartDescription(
            coder => coder.bool.outputPart,
            `Outputs.bool()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static float() {
        return new ShaderPartDescription(
            coder => coder.float.outputPart,
            `Outputs.float()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static vec2() {
        return new ShaderPartDescription(
            coder => coder.vec2.outputPart,
            `Outputs.vec2()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static vec4() {
        return new ShaderPartDescription(
            coder => coder.vec4.outputPart,
            `Outputs.vec4()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static vec4WithOutputCoder() {
        return new ShaderPartDescription(
            _ => outputShaderCoder().vec4.outputPart,
            `Outputs.vec4WithOutputCoder()`);
    }
}

/**
 * @param {!Array.<!ShaderPartDescription|!ShaderPart>} shaderPartsOrDescs
 * @param {!string} bodyCode
 * @returns {!WglShader}
 */
function combinedShaderPartsWithCode(shaderPartsOrDescs, bodyCode) {
    let shaderPartDescs = shaderPartsOrDescs.map(partOrDesc => partOrDesc instanceof ShaderPart ?
        new ShaderPartDescription(_ => partOrDesc, 'fixed') :
        partOrDesc);
    let sourceMaker = () => {
        let libs = new Set();
        for (let part of shaderPartDescs) {
            for (let lib of part.toConcretePart().libs) {
                libs.add(lib);
            }
        }
        let libCode = [...libs, ...shaderPartDescs.map(e => e.toConcretePart().code)].join('');
        let afterLibCode = '\n//////// body ////////\n' + bodyCode + '\n';

        // HACK: workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=764036
        let mainIndex = libCode.indexOf('void main()');
        if (mainIndex !== -1) {
          return libCode.substring(0, mainIndex) + afterLibCode + libCode.substring(mainIndex);
        }

        return libCode + afterLibCode;
    };

    return new WglShader(sourceMaker);
}

/**
 * @param {!Array.<ShaderPartDescription>} inputs
 * @param {!ShaderPartDescription} output
 * @param {!string} bodyCode
 * @returns {!function(args: ...(!!WglTexture|!WglArg)) : !WglConfiguredShader}
 */
function makePseudoShaderWithInputsAndOutputAndCode(inputs, output, bodyCode) {
    let shader = combinedShaderPartsWithCode([...inputs, output], bodyCode);
    return (...inputsAndArgs) => {
        let args = [];
        for (let i = 0; i < inputs.length; i++) {
            args.push(...inputs[i].toConcretePart().argsFor(inputsAndArgs[i]));
        }
        args.push(...inputsAndArgs.slice(inputs.length));
        return shaderWithOutputPartAndArgs(shader, output.toConcretePart(), args)
    };
}

/**
 * @param {!ShaderPart} outputShaderPart
 * @param {!WglShader} shader
 * @param {!Array.<!WglArg>} args
 * @returns {!WglConfiguredShader}
 * @private
 */
function shaderWithOutputPartAndArgs(shader, outputShaderPart, args) {
    return new WglConfiguredShader(destinationTexture =>
        shader.withArgs(...args, ...outputShaderPart.argsFor(destinationTexture)).renderTo(destinationTexture));
}

/** @type {!ShaderCoder} */
let _curShaderCoder = SHADER_CODER_FLOATS;
/** @type {!ShaderCoder} */
let _outShaderCoder = SHADER_CODER_BYTES;

/**
 * @returns {!ShaderCoder}
 */
function currentShaderCoder() {
    return _curShaderCoder;
}

/**
 * @returns {!ShaderCoder}
 */
function outputShaderCoder() {
    return _outShaderCoder;
}

function changeShaderCoder(newCoder) {
    //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
    try {
        initializedWglContext().invalidateExistingResources();
    } catch (_) {
    }

    _curShaderCoder = newCoder;
    _outShaderCoder = newCoder;
}

function _tryWriteAndReadFloatingPointTexture() {
    let texture = new WglTexture(1, 1, WebGLRenderingContext.FLOAT);
    let shader = new WglShader(`void main() { gl_FragColor = vec4(2.0, 3.5, 7.0, -7654321.0); }`);
    try {
        shader.withArgs().renderTo(texture);
        let result = texture.readPixels(false);
        return result instanceof Float32Array &&
            result.length === 4 &&
            result[0] === 2 &&
            result[1] === 3.5 &&
            result[2] === 7 &&
            result[3] === -7654321; // Testing that expected precision is present.
    } catch (ex) {
        console.warn(ex);
        return false;
    } finally {
        texture.ensureDeinitialized();
        shader.ensureDeinitialized()
    }
}

function _tryWriteAndPassFloatingPointWithByteReadTexture() {
    let textureFloat = new WglTexture(1, 1, WebGLRenderingContext.FLOAT);
    let textureByte = new WglTexture(1, 1, WebGLRenderingContext.UNSIGNED_BYTE);
    let shader = new WglShader(`void main() { gl_FragColor = vec4(1.1, 3.0, 5.0, -7654321.0); }`);
    let passer = new WglShader(`uniform sampler2D t; void main() {
        vec4 v = texture2D(t, gl_FragCoord.xy);
        if (v == vec4(2.0, 3.0, 5.0, -7654321.0)) { // Testing that expected precision is present.
            gl_FragColor = vec4(2.0, 3.0, 5.0, 254.0) / 255.0;
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    }`);
    try {
        shader.withArgs().renderTo(textureFloat);
        passer.withArgs(WglArg.texture('t', textureFloat)).renderTo(textureByte);
        let result = textureByte.readPixels(false);
        return result instanceof Uint8Array &&
            result.length === 4 &&
            result[0] === 2 &&
            result[1] === 3 &&
            result[2] === 5 &&
            result[3] === 254;
    } catch (ex) {
        console.warn(ex);
        return false;
    } finally {
        textureFloat.ensureDeinitialized();
        textureByte.ensureDeinitialized();
        shader.ensureDeinitialized();
        passer.ensureDeinitialized();
    }
}

function _chooseShaderCoders() {
    if (_tryWriteAndReadFloatingPointTexture()) {
        // Floats work. Hurray!
        _curShaderCoder = SHADER_CODER_FLOATS;
        _outShaderCoder = SHADER_CODER_FLOATS;
    } else if (_tryWriteAndPassFloatingPointWithByteReadTexture()) {
        console.warn("Wrote but failed to read a floating point texture. Falling back to float-as-byte output coding.");
        _curShaderCoder = SHADER_CODER_FLOATS;
        _outShaderCoder = SHADER_CODER_BYTES;
    } else {
        console.warn("Failed to write a floating point texture. Falling back to float-as-byte coding everywhere.");
        _curShaderCoder = SHADER_CODER_BYTES;
        _outShaderCoder = SHADER_CODER_BYTES;
    }
}

let _floatShadersWorkWell = undefined;
function canTestFloatShaders() {
    if (_floatShadersWorkWell === undefined) {
        _floatShadersWorkWell = _tryWriteAndReadFloatingPointTexture();
    }
    return _floatShadersWorkWell
}

_chooseShaderCoders();

export {
    combinedShaderPartsWithCode,
    shaderWithOutputPartAndArgs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    changeShaderCoder,
    Inputs,
    Outputs,
    outputShaderCoder,
    canTestFloatShaders
}
provideWorkingShaderCoderToWglConfiguredShader(currentShaderCoder);
