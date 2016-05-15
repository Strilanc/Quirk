import DetailedError from "src/base/DetailedError.js"
import Shaders from "src/webgl/Shaders.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { WglConfiguredShader } from "src/webgl/WglShader.js"

/**
 * Stores a sequence of transformations to apply to textures, with output sizes known ahead of time.
 */
export default class ShaderPipeline {
    constructor() {
        /**
         * @type {!Array.<!{w: !int, h: !int, f: !function(!WglTexture): !WglConfiguredShader>}
         */
        this.steps = [];
    }

    /**
     * @param {!int} outWidth
     * @param {!int} outHeight
     * @param {!function(!WglTexture): !WglConfiguredShader} nearlyConfiguredShader
     */
    addStep(outWidth, outHeight, nearlyConfiguredShader) {
        this.steps.push({w: outWidth, h: outHeight, f: nearlyConfiguredShader});
    }
}
