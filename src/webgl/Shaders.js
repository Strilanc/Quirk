import DetailedError from "src/base/DetailedError.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import { initializedWglContext } from "src/webgl/WglContext.js"
import { WglConfiguredShader, WglShader } from "src/webgl/WglShader.js"

/**
 * Utilities for creating/configuring shaders that render various simple things.
 */
export default class Shaders {}

/**
 * Returns a configured shader that renders a uniform color over the entire destination texture.
 * @param {!number} r
 * @param {!number} g
 * @param {!number} b
 * @param {!number} a
 * @returns {!WglConfiguredShader}
 */
Shaders.color = (r, g, b, a) => COLOR_SHADER.withArgs(WglArg.vec4("color", r, g, b, a));
const COLOR_SHADER = new WglShader(`
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }`);

/**
 * Returns a configured shader that just draws the input texture's contents.
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
Shaders.passthrough = inputTexture => PASSTHROUGH_SHADER.withArgs(
    WglArg.vec2("textureSize", inputTexture.width, inputTexture.height),
    WglArg.texture("dataTexture", inputTexture, 0));
const PASSTHROUGH_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D dataTexture;
    void main() {
        gl_FragColor = texture2D(dataTexture, gl_FragCoord.xy / textureSize.xy);
    }`);

/**
 * Returns a configured shader that sets each pixel's components to its position in the texture.
 * @type {!WglConfiguredShader}
 */
Shaders.coords = new WglShader(`
    void main() {
        gl_FragColor = vec4(gl_FragCoord.x-0.5, gl_FragCoord.y-0.5, 0.0, 0.0);
    }`).withArgs();

/**
 * Returns a configured shader that overlays the destination texture with the given data.
 * @param {!Float32Array} rgbaData
 * @returns {!WglConfiguredShader}
 */
Shaders.data = rgbaData => new WglConfiguredShader(destinationTexture => {
    let [w, h] = [destinationTexture.width, destinationTexture.height];
    if (rgbaData.length !== w * h * 4) {
        throw new DetailedError("rgbaData.length isn't w * h * 4", {w, h, rgbaData});
    }

    let GL = WebGLRenderingContext;
    let gl = initializedWglContext().gl;
    let dataTexture = gl.createTexture();
    try {
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, dataTexture);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, w, h, 0, GL.RGBA, GL.FLOAT, rgbaData);
        PASSTHROUGH_SHADER.withArgs(
            WglArg.vec2("textureSize", w, h),
            WglArg.webGlTexture("dataTexture", dataTexture, 0)
        ).renderTo(destinationTexture);
    } finally {
        gl.deleteTexture(dataTexture);
    }
});

/**
 * Returns a configured shader that renders the input texture to destination texture, but scaled by a constant.
 * @param {!WglTexture} inputTexture
 * @param {!number} factor
 * @returns {!WglConfiguredShader}
 */
Shaders.scale = (inputTexture, factor) => SCALE_SHADER.withArgs(
    WglArg.vec2("textureSize", inputTexture.width, inputTexture.height),
    WglArg.texture("inputTexture", inputTexture, 0),
    WglArg.float("factor", factor));
const SCALE_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D inputTexture;
    uniform float factor;
    void main() {
        gl_FragColor = texture2D(inputTexture, gl_FragCoord.xy / textureSize.xy) * factor;
    }`);

/**
 * Returns a configured shader that renders teh result of adding each source pixel to the source pixel a fixed offset
 * away.
 * @param {!WglTexture} inputTexture
 * @param {!int} dx
 * @param {!int} dy
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFold = (inputTexture, dx, dy) => SUM_FOLD_SHADER.withArgs(
    WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
    WglArg.vec2("offset", dx, dy),
    WglArg.texture("inputTexture", inputTexture, 0));
const SUM_FOLD_SHADER = new WglShader(`
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform vec2 offset;
    void main() {
        vec2 uv0 = gl_FragCoord.xy / inputSize;
        vec2 uv1 = uv0 + offset / inputSize;
        gl_FragColor = texture2D(inputTexture, uv0) + texture2D(inputTexture, uv1);
    }`);

/**
 * Packs all the values in a float-pixel type texture into a larger byte-pixel type texture, using an encoding similar
 * to IEEE 754.
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
Shaders.encodeFloatsIntoBytes = inputTexture => new WglConfiguredShader(destinationTexture => {
    Util.need(inputTexture.pixelType === WebGLRenderingContext.FLOAT, "input tex should have floats");
    Util.need(destinationTexture.pixelType === WebGLRenderingContext.UNSIGNED_BYTE, "output tex should take bytes");
    Util.need(destinationTexture.width === inputTexture.width * 2 &&
        destinationTexture.height === inputTexture.height * 2,
        "output tex should be double the width and height of the input");

    FLOATS_TO_ENCODED_BYTES_SHADER.withArgs(
        WglArg.texture("inputTexture", inputTexture, 0),
        WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
        WglArg.float("outputWidth", destinationTexture.width)
    ).renderTo(destinationTexture);
});
const FLOATS_TO_ENCODED_BYTES_SHADER = new WglShader(`
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform float outputWidth;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    /**
     * Encodes a single-precision float into four bytes.
     * The format used is similar to the standard IEEE 754 format, except the sign bit is on the opposite end.
     * Also, zero is represented as all-1s because NaN is hard to detect and ends up all-0s.
     */
    vec4 encode_float(float val) {
        float sign = val > 0.0 ? 0.0 : 1.0;

        if (val == 0.0) return vec4(1.0, 1.0, 1.0, 1.0); // Zero
        if (val*2.0 == val) return vec4(1.0, 0.0, 0.0, sign/255.0); // Infinity

        val = abs(val);
        float exponent = floor(log2(val));
        if (pow(2.0, exponent) > val) {
            // On my machine this happens for val=0.2499999850988388
            exponent = floor(exponent - 0.5);
        }
        float mantissa = val * exp2(-exponent) - 1.0;

        float a = exponent + 127.0;
        float b = floor(mantissa * 256.0);
        float c = floor(mod(mantissa * 65536.0, 256.0));
        float d = floor(mod(mantissa * 8388608.0, 128.0)) * 2.0 + sign;
        return vec4(a, b, c, d) / 255.0;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float inputState = floor(state / 4.0);
        float c = mod(state, 4.0);
        vec4 v = texture2D(inputTexture, toUv(inputState));
        float f = c == 0.0 ? v.x
                : c == 1.0 ? v.y
                : c == 2.0 ? v.z
                : v.w;
        gl_FragColor = encode_float(f);
    }`);

/**
 * @param {!int} a
 * @param {!int} b
 * @param {!int} c
 * @param {!int} d
 * @returns {!number}
 */
const decodeByteToFloat = (a, b, c, d) => {
    if (a === 0 && b === 0 && c === 0 && d === 0) {
        return NaN;
    }
    if (a === 255 && b === 255 && c === 255 && d === 255) {
        return 0;
    }
    if (a === 255 && b === 0 && c === 0 && d === 0) {
        return Infinity;
    }
    if (a === 255 && b === 0 && c === 0 && d === 1) {
        return -Infinity;
    }

    let exponent = a - 127;
    let sign = d & 1;
    let mantissa = 1 + (b / 256.0 + c / 65536.0 + (d - sign) / 16777216.0);
    return mantissa * Math.pow(2, exponent) * (sign === 1 ? -1 : +1);
};

/**
 * Decodes the bytes in a Uint8Array (from a float-encoded-as-bytes texture) back into the desired Float32Array.
 * @param {!Uint8Array} bytes
 * @returns {!Float32Array}
 */
Shaders.decodeByteBufferToFloatBuffer = bytes => {
    let result = new Float32Array(bytes.length/4);
    for (let i = 0; i < result.length; i++) {
        let k = i << 2;
        result[i] = decodeByteToFloat(bytes[k], bytes[k+1], bytes[k+2], bytes[k+3]);
    }
    return result;
};
