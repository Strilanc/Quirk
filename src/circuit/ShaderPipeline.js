import {DetailedError} from "src/base/DetailedError.js"
import {Shaders} from "src/webgl/Shaders.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {workingShaderCoder} from "src/webgl/ShaderCoders.js"

/**
 * Stores a sequence of transformations to apply to textures, with output sizes known ahead of time.
 */
class ShaderPipeline {
    constructor() {
        /**
         * @type {!Array.<!{outOrder: !int, shaderFunc: !function(!WglTexture, keepResult: !boolean): !WglConfiguredShader>}
         */
        this.steps = [];
    }

    /**
     * @param {!int} qubitCount
     * @param {!function(!WglTexture): !WglConfiguredShader} nearlyConfiguredShader
     * @param {!boolean=} keepResult
     */
    addStep(qubitCount, nearlyConfiguredShader, keepResult=false) {
        this.steps.push({
            outOrder: qubitCount,
            shaderFunc: nearlyConfiguredShader,
            keepResult});
    }

    /**
     * @param {!int} qubitCount
     * @param {!function(!WglTexture): !WglConfiguredShader} nearlyConfiguredShader
     * @param {!boolean=} keepResult
     */
    addStepVec2(qubitCount, nearlyConfiguredShader, keepResult=false) {
        this.addStep(qubitCount + workingShaderCoder.vec2Overhead, nearlyConfiguredShader, keepResult);
    }

    /**
     * @param {!int} qubitCount
     * @param {!function(!WglTexture): !WglConfiguredShader} nearlyConfiguredShader
     * @param {!boolean=} keepResult
     */
    addStepVec4(qubitCount, nearlyConfiguredShader, keepResult=false) {
        this.addStep(qubitCount + workingShaderCoder.vec4Overhead, nearlyConfiguredShader, keepResult);
    }

    /**
     * @param {!ShaderPipeline} other
     * @param {!boolean=} keepResult
     */
    addPipelineSteps(other, keepResult=false) {
        for (let i = 0; i < other.steps.length; i++) {
            let {outOrder, shaderFunc} = other.steps[i];
            this.addStep(outOrder, shaderFunc, i === other.steps.length-1 && keepResult);
        }
    }
}

export {ShaderPipeline}
