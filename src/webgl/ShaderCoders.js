import {DetailedError} from "src/base/DetailedError.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {initializedWglContext} from "src/webgl/WglContext.js"
import {provideWorkingShaderCoderToWglConfiguredShader, WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

import {ShaderPart} from "src/webgl/ShaderCoders_Base.js"
import {SHADER_CODER_BYTES__} from "src/webgl/ShaderCoders_intoBytes.js"
import {SHADER_CODER_FLOATS__} from "src/webgl/ShaderCoders_intoFloats.js"

class ShaderPartDescription {
    /**
     * @param {!function(!ShaderValueCoder) : !ShaderPart} partMaker
     * @param {!string} description
     */
    constructor(partMaker, description) {
        /**
         * @type {!(function(!ShaderValueCoder): !ShaderPart)}
         * @private
         */
        this._partMaker = partMaker;
        /**
         * @type {!string}
         */
        this.description = description;
    }

    /**
     * @param {!ShaderValueCoder} coder
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
    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static bool(name) {
        return new ShaderPartDescription(
            coder => coder.bool.inputPartGetter(name),
            `Inputs.bool(${name})`);
    }
}

class Outputs {
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

    /**
     * @returns {!ShaderPartDescription}
     */
    static bool() {
        return new ShaderPartDescription(
            coder => coder.bool.outputPart,
            `Outputs.bool()`);
    }
}

/**
 * @param {!string} tailCode
 * @param {!Array.<!ShaderPartDescription|!ShaderPart>} shaderPartsOrDescs
 * @returns {!WglShader}
 */
function combinedShaderPartsWithCode(shaderPartsOrDescs, tailCode) {
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
        return libCode + '\n//////// tail ////////\n' + tailCode;
    };

    return new WglShader(sourceMaker);
}

/**
 * @param {!Array.<ShaderPartDescription>} inputs
 * @param {!ShaderPartDescription} output
 * @param {!string} tailCode
 * @returns {!function(args: ...(!!WglTexture|!WglArg)) : !WglConfiguredShader}
 */
function makePseudoShaderWithInputsAndOutputAndCode(inputs, output, tailCode) {
    let shader = combinedShaderPartsWithCode([...inputs, output], tailCode);
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

/**
 * A strategy for converting between values used inside the shader and the textures those values must live in between
 * shaders.
 */
class ShaderValueCoder {
    /**
     * @param {!ShaderCoder} parent
     * @param {!function(!WglTextureTrader) : void} vec2TradePack
     */
    constructor(parent, vec2TradePack) {
        this.vec2 = parent.vec2;
        this.vec4 = parent.vec4;
        this.float = parent.float;
        this.bool = parent.bool;

        /** @type {!int} */
        this.vec2PowerSizeOverhead = parent.vec2.powerSizeOverhead;
        /** @type {!int} */
        this.vec4PowerSizeOverhead = parent.vec4.powerSizeOverhead;
        /** @type {!int} */
        this.vecPixelType = parent.vec2.pixelType;
        /** {!function(!Float32Array) : !Float32Array|!Uint8Array} */
        this.prepVec2Data = parent.vec2.dataToPixels;
        /** {!function(!Float32Array|!Uint8Array) : !Float32Array} */
        this.unpackVec2Data = parent.vec2.pixelsToData;
        /** {!function(!Float32Array) : !Float32Array|!Uint8Array} */
        this.prepVec4Data = parent.vec4.dataToPixels;
        /** {!function(!Float32Array|!Uint8Array) : !Float32Array} */
        this.unpackVec4Data = parent.vec4.pixelsToData;
        this.vec2ArrayPowerSizeOfTexture = tex => parent.vec2.arrayPowerSizeOfTexture(tex);
        this.vec4ArrayPowerSizeOfTexture = tex => parent.vec4.arrayPowerSizeOfTexture(tex);
        /** @type {!function(!WglTextureTrader) : void} */
        this.vec2TradePack = vec2TradePack;
    }
}

/**
 * @param {!WglTexture}
 * @returns {!WglConfiguredShader)
 */
const PACK_VEC2S_INTO_VEC4S_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec4(),
    'vec4 outputFor(float k) { return vec4(read_input(k*2.0), read_input(k*2.0 + 1.0)); }');

/** @type {!ShaderValueCoder} */
const SHADER_CODER_FLOATS = new ShaderValueCoder(
    SHADER_CODER_FLOATS__,
    trader => trader.shadeHalveAndTrade(PACK_VEC2S_INTO_VEC4S_SHADER));

/** @type {!ShaderValueCoder} */
const SHADER_CODER_BYTES = new ShaderValueCoder(
    SHADER_CODER_BYTES__,
    () => {});

/** @type {!ShaderValueCoder} */
let _curShaderCoder = SHADER_CODER_FLOATS;
/** @type {!ShaderValueCoder} */
let _outShaderCoder = SHADER_CODER_BYTES;

/**
 * @returns {!ShaderValueCoder}
 */
function currentShaderCoder() {
    return _curShaderCoder;
}

/**
 * @returns {!ShaderValueCoder}
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
    SHADER_CODER_BYTES,
    SHADER_CODER_FLOATS,
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
