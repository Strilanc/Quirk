import {DetailedError} from "src/base/DetailedError.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {initializedWglContext} from "src/webgl/WglContext.js"
import {provideWorkingShaderCoderToWglConfiguredShader, WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

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
            coder => coder.vec2Input(name),
            `Inputs.vec2(${name})`);
    }
    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static vec4(name) {
        return new ShaderPartDescription(
            coder => coder.vec4Input(name),
            `Inputs.vec4(${name})`);
    }
    /**
     * @param {!string} name
     * @returns {!ShaderPartDescription}
     */
    static bool(name) {
        return new ShaderPartDescription(
            coder => coder.boolInput(name),
            `Inputs.bool(${name})`);
    }
}

class Outputs {
    /**
     * @returns {!ShaderPartDescription}
     */
    static vec2() {
        return new ShaderPartDescription(
            coder => coder.vec2Output,
            `Outputs.vec2()`);
    }
    /**
     * @returns {!ShaderPartDescription}
     */
    static vec4() {
        return new ShaderPartDescription(
            coder => coder.vec4Output,
            `Outputs.vec4()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static vec4WithOutputCoder() {
        return new ShaderPartDescription(
            _ => outputShaderCoder().vec4Output,
            `Outputs.vec4()`);
    }

    /**
     * @returns {!ShaderPartDescription}
     */
    static bool() {
        return new ShaderPartDescription(
            coder => coder.boolOutput,
            `Outputs.bool()`);
    }
}

/**
 * A piece of a shader.
 *
 * Because some GPUs don't support float textures very well, inputs and outputs may need to be processed into
 * appropriate forms before computing/storing. Instead of having every shader do it, the conversion functionality is
 * abstracted into decorator instances.
 */
class ShaderPart {
    /**
     * @param {!string} code
     * @param {!Array.<!string>} libs
     * @param {!function(!WglTexture) : !Array.!<WglArg>} argsFor
     */
    constructor(code, libs, argsFor) {
        /** @type {!string} */
        this.code = code;
        /** @type {!Array.<!string>} */
        this.libs = libs;
        /** @type {!function(!WglTexture) : !Array.!<WglArg>} */
        this.argsFor = argsFor;
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
     * @param {!function(name: !string) : !ShaderPart} vec2Input
     * @param {!function(name: !string) : !ShaderPart} vec4Input
     * @param {!function(name: !string) : !ShaderPart} boolInput
     * @param {!ShaderPart} vec2Output
     * @param {!ShaderPart} vec4Output
     * @param {!ShaderPart} boolOutput
     * @param {!int} vec2Overhead
     * @param {!int} vec4Overhead
     * @param {!int} vecPixelType
     * @param {!function(!Float32Array) : !Float32Array|!Uint8Array} prepVec2Data
     * @param {!function(!Float32Array|!Uint8Array) : !Float32Array} unpackVec2Data
     * @param {!function(!Float32Array) : !Float32Array|!Uint8Array} prepVec4Data
     * @param {!function(!Float32Array|!Uint8Array) : !Float32Array} unpackVec4Data
     * @param {!function(!WglTexture) : !int} vec2ArrayPowerSizeOfTexture
     * @param {!function(!WglTexture) : !int} vec4ArrayPowerSizeOfTexture
     * @param {!function(!WglTextureTrader) : void} vec2TradePack
     */
    constructor(vec2Input,
                vec4Input,
                boolInput,
                vec2Output,
                vec4Output,
                boolOutput,
                vec2Overhead,
                vec4Overhead,
                vecPixelType,
                prepVec2Data,
                unpackVec2Data,
                prepVec4Data,
                unpackVec4Data,
                vec2ArrayPowerSizeOfTexture,
                vec4ArrayPowerSizeOfTexture,
                vec2TradePack) {
        /** @type {!function(name: !string) : !ShaderPart} */
        this.vec2Input = vec2Input;
        /** @type {!function(name: !string) : !ShaderPart} */
        this.vec4Input = vec4Input;
        /** @type {!function(name: !string) : !ShaderPart} */
        this.boolInput = boolInput;
        /** @type {!ShaderPart} */
        this.vec2Output = vec2Output;
        /** @type {!ShaderPart} */
        this.vec4Output = vec4Output;
        /** @type {!ShaderPart} */
        this.boolOutput = boolOutput;
        /** @type {!int} */
        this.vec2PowerSizeOverhead = vec2Overhead;
        /** @type {!int} */
        this.vec4PowerSizeOverhead = vec4Overhead;
        /** @type {!int} */
        this.vecPixelType = vecPixelType;
        /** {!function(!Float32Array) : !Float32Array|!Uint8Array} */
        this.prepVec2Data = prepVec2Data;
        /** {!function(!Float32Array|!Uint8Array) : !Float32Array} */
        this.unpackVec2Data = unpackVec2Data;
        /** {!function(!Float32Array) : !Float32Array|!Uint8Array} */
        this.prepVec4Data = prepVec4Data;
        /** {!function(!Float32Array|!Uint8Array) : !Float32Array} */
        this.unpackVec4Data = unpackVec4Data;
        /** @type {!function(!WglTexture) : !int} */
        this.vec2ArrayPowerSizeOfTexture = vec2ArrayPowerSizeOfTexture;
        /** @type {!function(!WglTexture) : !int} */
        this.vec4ArrayPowerSizeOfTexture = vec4ArrayPowerSizeOfTexture;
        /** @type {!function(!WglTextureTrader) : void} */
        this.vec2TradePack = vec2TradePack;
    }
}

/**
 * Packs an array of single-precision floats into an array of bytes.
 *
 * Uses a rotated version of the usual IEEE format, where the sign bit is at the end instead of at the start
 * (to avoid a few shifts).
 *
 * @param {!Float32Array} floats
 * @returns {!Uint8Array}
 */
function encodeFloatsIntoBytes(floats) {
    let result = new Uint8Array(floats.length * 4);
    for (let i = 0; i < floats.length; i++) {
        let val = floats[i];

        let sign = val < 0 ? 1 : 0;
        let mag = Math.abs(val);
        let exponent = mag === 0 ? -127 : Math.floor(0.1 + Math.log2(mag));
        exponent -= mag !== 0 && Math.pow(2, exponent) > mag ? 1 : 0;
        let mantissa = Math.max(0, mag * Math.pow(2, -exponent) - 1.0);

        let a = exponent + 127;
        let b = Math.floor(mantissa * 256);
        let c = Math.floor((mantissa * 65536) & 0xFF);
        let d = sign | (Math.floor((mantissa * 8388608) & 0x7F) << 1);

        let k = i << 2;
        result[k] = a;
        result[k+1] = b;
        result[k+2] = c;
        result[k+3] = d;
    }

    return result;
}

const PACK_FLOAT_INTO_BYTES = `
    //////////// PACK_FLOAT_INTO_BYTES /////////////
    vec4 _gen_packFloatIntoBytes(float val) {
        float sign = float(val < 0.0);
        float mag = abs(val);
        float exponent = mag == 0.0 ? -127.0 : floor(0.1 + log2(mag));
        exponent -= float(mag != 0.0 && exp2(exponent) > mag);
        float mantissa = max(0.0, mag * exp2(-exponent) - 1.0);

        float a = exponent + 127.0;
        float b = floor(mantissa * 256.0);
        float c = floor(mod(mantissa * 65536.0, 256.0));
        float d = floor(mod(mantissa * 8388608.0, 128.0)) * 2.0 + sign;
        return vec4(a, b, c, d) / 255.0;
    }`;

function _decodeBytesIntoFloat(a, b, c, d) {
    let exponent = a - 127;
    let sign = 1 - ((d & 1) << 1);
    let mantissa = (a > 0 ? 1 : 0)
        + b / 256
        + c / 65536
        + (d & 0xFE) / 16777216;

    return sign * mantissa * Math.pow(2, exponent);
}

/**
 * Recovers an array of single-precision floats from an array of bytes.
 *
 * Uses a rotated version of the usual IEEE format, where the sign bit is at the end instead of at the start
 * (to avoid a few shifts).
 *
 * @param {!Uint8Array|!Array.<int>} bytes
 * @returns {!Float32Array}
 */
function decodeBytesIntoFloats(bytes) {
    let result = new Float32Array(bytes.length >> 2);
    for (let i = 0; i < result.length; i++) {
        let k = i << 2;
        let a = bytes[k];
        let b = bytes[k+1];
        let c = bytes[k+2];
        let d = bytes[k+3];
        result[i] = _decodeBytesIntoFloat(a, b, c, d);
    }

    return result;
}

const UNPACK_BYTES_INTO_FLOAT_CODE = `
    //////////// UNPACK_BYTES_INTO_FLOAT_CODE /////////////
    float _gen_unpackBytesIntoFloat(vec4 v) {
        float a = floor(v.r * 255.0 + 0.5);
        float b = floor(v.g * 255.0 + 0.5);
        float c = floor(v.b * 255.0 + 0.5);
        float d = floor(v.a * 255.0 + 0.5);

        float exponent = a - 127.0;
        float sign = 1.0 - mod(d, 2.0)*2.0;
        float mantissa = float(a > 0.0)
                       + b / 256.0
                       + c / 65536.0
                       + floor(d / 2.0) / 8388608.0;
        return sign * mantissa * exp2(exponent);
    }`;

/**
 * @param {!string} name
 * @param {!int} vecSize
 * @returns {!ShaderPart}
 */
function vecInput_Float(name, vecSize) {
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// vecInput_Float(${name}, ${vecSize}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        vec${vecSize} read_${name}(float k) {
            vec2 uv = vec2(mod(k, ${pre}_size.x) + 0.5,
                           floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            return texture2D(${pre}_tex, uv).${'xyzw'.substring(0, vecSize)};
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y;
        }`,
        [],
        texture => {
            if (texture.pixelType !== WebGLRenderingContext.FLOAT) {
                throw new DetailedError(`vecInput${vecSize}_Float requires float texture`, {name, texture});
            }
            return [
                WglArg.texture(`${pre}_tex`, texture),
                WglArg.vec2(`${pre}_size`, texture.width, texture.height)
            ];
        });
}

/**
 * @param {!string} name
 * @returns {!ShaderPart}
 */
function vec2Input_Byte(name) {
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// vec2Input_Byte(${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        vec2 read_${name}(float k) {
            k *= 2.0;
            vec2 uv1 = vec2(mod(k, ${pre}_size.x) + 0.5,
                            floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            vec2 uv2 = uv1 + vec2(1.0 / ${pre}_size.x, 0.0);

            vec4 bytes1 = texture2D(${pre}_tex, uv1);
            vec4 bytes2 = texture2D(${pre}_tex, uv2);

            return vec2(_gen_unpackBytesIntoFloat(bytes1),
                        _gen_unpackBytesIntoFloat(bytes2));
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y / 2.0;
        }`,
        [UNPACK_BYTES_INTO_FLOAT_CODE],
        texture => {
            if (texture.pixelType !== WebGLRenderingContext.UNSIGNED_BYTE) {
                throw new DetailedError("vec2Input_Byte requires byte texture", {name, texture});
            }
            return [
                WglArg.texture(`${pre}_tex`, texture),
                WglArg.vec2(`${pre}_size`, texture.width, texture.height)
            ];
        });
}

/**
 * @param {!string} name
 * @returns {!ShaderPart.<vec2>}
 */
function vec4Input_Byte(name) {
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// vec4Input_Byte(${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        vec4 read_${name}(float k) {
            k *= 4.0;
            vec2 uv1 = vec2(mod(k, ${pre}_size.x) + 0.5,
                            floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            vec2 uv2 = uv1 + vec2(1.0 / ${pre}_size.x, 0.0);
            vec2 uv3 = uv1 + vec2(2.0 / ${pre}_size.x, 0.0);
            vec2 uv4 = uv1 + vec2(3.0 / ${pre}_size.x, 0.0);

            vec4 bytes1 = texture2D(${pre}_tex, uv1);
            vec4 bytes2 = texture2D(${pre}_tex, uv2);
            vec4 bytes3 = texture2D(${pre}_tex, uv3);
            vec4 bytes4 = texture2D(${pre}_tex, uv4);

            return vec4(_gen_unpackBytesIntoFloat(bytes1),
                        _gen_unpackBytesIntoFloat(bytes2),
                        _gen_unpackBytesIntoFloat(bytes3),
                        _gen_unpackBytesIntoFloat(bytes4));
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y / 4.0;
        }`,
        [UNPACK_BYTES_INTO_FLOAT_CODE],
        texture => {
            if (texture.width < 4) {
                throw new DetailedError("vec4Input_Byte requires texture.width >= 4", {name, texture});
            }
            if (texture.pixelType !== WebGLRenderingContext.UNSIGNED_BYTE) {
                throw new DetailedError("vec4Input_Byte requires byte texture", {name, texture});
            }
            return [
                WglArg.texture(`${pre}_tex`, texture),
                WglArg.vec2(`${pre}_size`, texture.width, texture.height)
            ]
        });
}

/**
 * @param {!string} name
 * @returns {!ShaderPart}
 */
function boolInput(name) {
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// boolInput(${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        float read_${name}(float k) {
            vec2 uv = vec2(mod(k, ${pre}_size.x) + 0.5,
                           floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            return float(texture2D(${pre}_tex, uv).x == 1.0);
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y * 4.0;
        }`,
        [],
        texture => [
            WglArg.texture(`${pre}_tex`, texture),
            WglArg.vec2(`${pre}_size`, texture.width, texture.height)
        ]);
}

const BOOL_OUTPUT = new ShaderPart(`
    ///////////// VEC2_OUTPUT_AS_FLOAT ////////////
    bool outputFor(float k);

    uniform vec2 _gen_output_size;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float k = xy.y * _gen_output_size.x + xy.x;
        gl_FragColor = vec4(float(outputFor(k)), 0.0, 0.0, 0.0);
    }`,
    [],
    texture => [WglArg.vec2('_gen_output_size', texture.width, texture.height)]);

const VEC2_OUTPUT_AS_FLOAT = new ShaderPart(`
    ///////////// VEC2_OUTPUT_AS_FLOAT ////////////
    vec2 outputFor(float k);

    uniform vec2 _gen_output_size;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float k = xy.y * _gen_output_size.x + xy.x;

        vec2 v = outputFor(k);

        gl_FragColor = vec4(v.x, v.y, 0.0, 0.0);
    }`,
    [],
    texture => [WglArg.vec2('_gen_output_size', texture.width, texture.height)]);

const VEC4_OUTPUT_AS_FLOAT = new ShaderPart(`
    ///////////// VEC4_OUTPUT_AS_FLOAT ////////////
    vec4 outputFor(float k);

    uniform vec2 _gen_output_size;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float k = xy.y * _gen_output_size.x + xy.x;

        vec4 v = outputFor(k);

        gl_FragColor = v;
    }`,
    [],
    texture => [WglArg.vec2('_gen_output_size', texture.width, texture.height)]);

const VEC2_OUTPUT_AS_BYTE = new ShaderPart(`
    ///////////// VEC2_OUTPUT_AS_BYTE ////////////
    vec2 outputFor(float k);

    uniform vec2 _gen_output_size;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y / 2.0;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float k = xy.y * _gen_output_size.x + xy.x;
        float r = mod(k, 2.0);

        vec2 result = outputFor(floor(k / 2.0));
        float component = dot(result, vec2(1.0 - r, r));

        gl_FragColor = _gen_packFloatIntoBytes(component);
    }`,
    [PACK_FLOAT_INTO_BYTES],
    texture => [WglArg.vec2('_gen_output_size', texture.width, texture.height)]);

const VEC4_OUTPUT_AS_BYTE = new ShaderPart(`
    ///////////// VEC4_OUTPUT_AS_BYTE ////////////
    vec4 outputFor(float k);

    uniform vec2 _gen_output_size;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y / 4.0;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float k = xy.y * _gen_output_size.x + xy.x;
        float r = mod(k, 4.0);

        vec4 result = outputFor(floor(k / 4.0));
        vec4 picker = vec4(float(r == 0.0),
                           float(r == 1.0),
                           float(r == 2.0),
                           float(r == 3.0));
        float component = dot(result, picker);
        gl_FragColor = _gen_packFloatIntoBytes(component);
    }`,
    [PACK_FLOAT_INTO_BYTES],
    texture => [WglArg.vec2('_gen_output_size', texture.width, texture.height)]);

function spreadFloatVec2(vec2Data) {
    let result = new Float32Array(vec2Data.length << 1);
    for (let i = 0; i*2 < vec2Data.length; i++) {
        result[4*i] = vec2Data[2*i];
        result[4*i+1] = vec2Data[2*i+1];
    }
    return result;
}

function unspreadFloatVec2(pixelData) {
    let result = new Float32Array(pixelData.length >> 1);
    for (let i = 0; i*2 < result.length; i++) {
        result[2*i] = pixelData[4*i];
        result[2*i+1] = pixelData[4*i+1];
    }
    return result;
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
    name => vecInput_Float(name, 2),
    name => vecInput_Float(name, 4),
    boolInput,
    VEC2_OUTPUT_AS_FLOAT,
    VEC4_OUTPUT_AS_FLOAT,
    BOOL_OUTPUT,
    0,
    0,
    WebGLRenderingContext.FLOAT,
    spreadFloatVec2,
    unspreadFloatVec2,
    e => e,
    e => e,
    t => Math.round(Math.log2(t.width * t.height)),
    t => Math.round(Math.log2(t.width * t.height)),
    trader => trader.shadeHalveAndTrade(PACK_VEC2S_INTO_VEC4S_SHADER));

/** @type {!ShaderValueCoder} */
const SHADER_CODER_BYTES = new ShaderValueCoder(
    vec2Input_Byte,
    vec4Input_Byte,
    boolInput,
    VEC2_OUTPUT_AS_BYTE,
    VEC4_OUTPUT_AS_BYTE,
    BOOL_OUTPUT,
    1,
    2,
    WebGLRenderingContext.UNSIGNED_BYTE,
    encodeFloatsIntoBytes,
    decodeBytesIntoFloats,
    encodeFloatsIntoBytes,
    decodeBytesIntoFloats,
    t => Math.round(Math.log2(t.width * t.height)) - 1,
    t => Math.round(Math.log2(t.width * t.height)) - 2,
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
}

function _tryReadAndWriteFloatingPointTexture() {
    let texture = new WglTexture(1, 1, WebGLRenderingContext.FLOAT);
    let shader = new WglShader(`void main() { gl_FragColor = vec4(2.0, 3.5, 7.0, -1113.0); }`);
    //noinspection UnusedCatchParameterJS
    try {
        shader.withArgs().renderTo(texture);
        let result = texture.readPixels();
        return result instanceof Float32Array &&
            result.length === 4 &&
            result[0] === 2 &&
            result[1] === 3.5 &&
            result[2] === 7 &&
            result[3] === -1113;
    } catch (ex) {
        console.warn(ex);
        return false;
    } finally {
        texture.ensureDeinitialized();
        shader.ensureDeinitialized()
    }
}

function _tryWriteFloatingPointWithByteReadTexture() {
    let textureFloat = new WglTexture(1, 1, WebGLRenderingContext.FLOAT);
    let textureByte = new WglTexture(1, 1, WebGLRenderingContext.UNSIGNED_BYTE);
    let shader = new WglShader(`void main() { gl_FragColor = vec4(2.0, 3.0, 5.0, 7.0)/255.0; }`);
    let passer = new WglShader(`uniform sampler2D t; void main() { gl_FragColor = texture2D(t, gl_FragCoord.xy); }`);
    //noinspection UnusedCatchParameterJS
    try {
        shader.withArgs().renderTo(textureFloat);
        passer.withArgs(WglArg.texture('t', textureFloat)).renderTo(textureByte);
        let result = textureByte.readPixels();
        return result instanceof Uint8Array &&
            result.length === 4 &&
            result[0] === 2 &&
            result[1] === 3 &&
            result[2] === 5 &&
            result[3] === 7;
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
    if (_tryWriteFloatingPointWithByteReadTexture()) {
        // Floats work. Hurray!
        _curShaderCoder = SHADER_CODER_FLOATS;
        _outShaderCoder = SHADER_CODER_FLOATS;
    } else if (_tryReadAndWriteFloatingPointTexture()) {
        console.warn("Wrote but failed to read a floating point texture. Falling back to float-as-byte output coding.");
        _curShaderCoder = SHADER_CODER_FLOATS;
        _outShaderCoder = SHADER_CODER_BYTES;
    } else {
        console.warn("Failed to write a floating point texture. Falling back to float-as-byte coding everywhere.");
        _curShaderCoder = SHADER_CODER_BYTES;
        _outShaderCoder = SHADER_CODER_BYTES;
    }
}

_chooseShaderCoders();

export {
    SHADER_CODER_BYTES,
    SHADER_CODER_FLOATS,
    encodeFloatsIntoBytes,
    decodeBytesIntoFloats,
    combinedShaderPartsWithCode,
    shaderWithOutputPartAndArgs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    changeShaderCoder,
    Inputs,
    Outputs,
    outputShaderCoder
}
provideWorkingShaderCoderToWglConfiguredShader(currentShaderCoder);
