import {DetailedError} from "src/base/DetailedError.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {initializedWglContext} from "src/webgl/WglContext.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {
    workingShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    SHADER_CODER_BYTES
} from "src/webgl/ShaderCoders.js"

/**
 * Utilities for creating/configuring shaders that render various simple things.
 */
class Shaders {}

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
    WglArg.texture("dataTexture", inputTexture));
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
 * @param {!Float32Array|!Uint8Array} rgbaData
 * @returns {!WglConfiguredShader}
 */
Shaders.data = rgbaData => new WglConfiguredShader(destinationTexture => {
    let [w, h] = [destinationTexture.width, destinationTexture.height];
    if (rgbaData.length !== w * h * 4) {
        throw new DetailedError("rgbaData.length isn't w * h * 4", {w, h, len: rgbaData.length, rgbaData});
    }

    let GL = WebGLRenderingContext;
    let gl = initializedWglContext().gl;
    let dataTexture = gl.createTexture();
    try {
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, dataTexture);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        gl.texImage2D(
            GL.TEXTURE_2D,
            0,
            GL.RGBA,
            w,
            h,
            0,
            GL.RGBA,
            rgbaData instanceof Uint8Array ? GL.UNSIGNED_BYTE : GL.FLOAT,
            rgbaData);
        PASSTHROUGH_SHADER.withArgs(
            WglArg.vec2("textureSize", w, h),
            WglArg.webGlTexture("dataTexture", dataTexture)
        ).renderTo(destinationTexture);
    } finally {
        gl.deleteTexture(dataTexture);
    }
});

/**
 * Returns a configured shader that overlays the destination texture with the given vec2 data.
 * @param {!Float32Array} floats
 * @returns {!WglConfiguredShader}
 */
Shaders.vec2Data = floats => Shaders.data(workingShaderCoder.prepVec2Data(floats));

/**
 * Returns a configured shader that overlays the destination texture with the given vec4 data.
 * @param {!Float32Array} floats
 * @returns {!WglConfiguredShader}
 */
Shaders.vec4Data = floats => Shaders.data(workingShaderCoder.prepVec4Data(floats));

/**
 * Adds the second half of its input into the first half.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldVec4 = inp => SUM_FOLD_SHADER_VEC4(inp);
const SUM_FOLD_SHADER_VEC4 = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec4Input('input')],
    workingShaderCoder.vec4Output,
    `vec4 outputFor(float k) {
        return read_input(k) + read_input(k + len_output());
    }`);

/**
 * Adds the second half of its input into the first half.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldVec2 = inp => SUM_FOLD_SHADER_VEC2(inp);
const SUM_FOLD_SHADER_VEC2 = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec2Input('input')],
    workingShaderCoder.vec2Output,
    `vec2 outputFor(float k) {
         return read_input(k) + read_input(k + len_output());
     }`);

Shaders.vec2AsVec4 = inputTexture => VEC2_AS_VEC4_SHADER(inputTexture);
const VEC2_AS_VEC4_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec2Input('input')],
    workingShaderCoder.vec4Output,
    'vec4 outputFor(float k) { return vec4(read_input(k), vec2(0.0, 0.0)); }');

/**
 * Packs all the values in a float-pixel type texture into a larger byte-pixel type texture, using an encoding similar
 * to IEEE 754.
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
Shaders.encodeFloatsIntoBytes = inputTexture => FLOATS_TO_ENCODED_BYTES_SHADER(inputTexture);
const FLOATS_TO_ENCODED_BYTES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec4Input('input')],
    SHADER_CODER_BYTES.vec4Output,
    'vec4 outputFor(float k) { return read_input(k); }');

export {Shaders}
