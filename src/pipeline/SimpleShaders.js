import Seq from "src/base/Seq.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { initializedWglContext } from "src/webgl/WglContext.js"

/**
 * Defines operations used to initialize, advance, and inspect quantum states stored in WebGL textures.
 */
export default class SimpleShaders {}

/**
 * Returns a parameterized shader that renders a uniform color over the entire destination texture.
 * @param {!number} r
 * @param {!number} g
 * @param {!number} b
 * @param {!number} a
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
SimpleShaders.color = (r, g, b, a) => COLOR_SHADER.withArgs(WglArg.vec4("color", r, g, b, a));
const COLOR_SHADER = new WglShader(`
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }`);

/**
 * Returns a parameterized shader that overlays the destination texture with the given data.
 * @param {!Float32Array} rgbaData
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
SimpleShaders.data = rgbaData => ({
    renderTo: destinationTexture => {
        let [w, h] = [destinationTexture.width, destinationTexture.height];
        Util.need(rgbaData.length === w * h * 4, "rgbaData.length === w * h * 4");

        initializedWglContext().useRawDataTextureIn(w, h, rgbaData, tempDataTexture =>
            PASSTHROUGH_SHADER.withArgs(
                WglArg.vec2("textureSize", w, h),
                WglArg.rawTexture("dataTexture", tempDataTexture, 0)
            ).renderTo(destinationTexture));
    }
});
const PASSTHROUGH_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D dataTexture;
    void main() {
        gl_FragColor = texture2D(dataTexture, gl_FragCoord.xy / textureSize.xy);
    }`);


/**
 * Returns a parameterized shader that overlays a foreground texture's pixels over a background texture's pixels, with
 * an offset.
 * @param {!int} foregroundX
 * @param {!int} foregroundY
 * @param {!WglTexture} foregroundTexture
 * @param {!WglTexture} backgroundTexture
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
SimpleShaders.overlay = (foregroundX, foregroundY, foregroundTexture, backgroundTexture) => OVERLAY_SHADER.withArgs(
    WglArg.vec2("backgroundTextureSize", backgroundTexture.width, backgroundTexture.height),
    WglArg.vec2("foregroundTextureSize", foregroundTexture.width, foregroundTexture.height),
    WglArg.texture("backgroundTexture", backgroundTexture, 0),
    WglArg.texture("foregroundTexture", foregroundTexture, 1),
    WglArg.vec2("foregroundOffset", foregroundX, foregroundY));
const OVERLAY_SHADER = new WglShader(`
    uniform vec2 backgroundTextureSize;
    uniform vec2 foregroundTextureSize;
    uniform sampler2D backgroundTexture;
    uniform sampler2D foregroundTexture;

    /** The top-left corner of the area where the foreground is overlaid over the background. */
    uniform vec2 foregroundOffset;

    void main() {
        vec2 uv = (gl_FragCoord.xy - foregroundOffset) / foregroundTextureSize.xy;
        if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x < 1.0 && uv.y < 1.0) {
          gl_FragColor = texture2D(foregroundTexture, uv);
        } else {
          uv = gl_FragCoord.xy / backgroundTextureSize;
          gl_FragColor = texture2D(backgroundTexture, uv);
        }
    }`);

/**
 * Returns a parameterized shader that renders the input texture to destination texture, but scaled by a constant.
 * @param {!WglTexture} inputTexture
 * @param {!number} factor
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
SimpleShaders.scale = (inputTexture, factor) => SCALE_SHADER.withArgs(
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
