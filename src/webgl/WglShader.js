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
import {DetailedError} from "../base/DetailedError.js"
import {WglArg} from "./WglArg.js"
import {initializedWglContext}  from "./WglContext.js"
import {WglMortalValueSlot} from "./WglMortalValueSlot.js"
import {checkGetErrorResult, checkFrameBufferStatusResult} from "./WglUtil.js"
import {Seq} from "../base/Seq.js"
import {WglConfiguredShader} from "./WglConfiguredShader.js"

/** @type {!WglMortalValueSlot} */
const ENSURE_ATTRIBUTES_BOUND_SLOT = new WglMortalValueSlot(() => {
    const GL = WebGLRenderingContext;
    let gl = initializedWglContext().gl;

    let positionBuffer = gl.createBuffer();
    let positions = new Float32Array([
        -1, +1,
        +1, +1,
        -1, -1,
        +1, -1]);
    gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(GL.ARRAY_BUFFER, positions, GL.STATIC_DRAW);
    // Note: ARRAY_BUFFER should not be rebound anywhere else.

    let indexBuffer = gl.createBuffer();
    let indices = new Uint16Array([
        0, 2, 1,
        2, 3, 1]);
    gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.STATIC_DRAW);
    // Note: ELEMENT_ARRAY_BUFFER should not be rebound anywhere else.

    return {positionBuffer, indexBuffer};
}, () => {});

/**
 * A shader program definition, used to render outputs onto textures based on the given GLSL source code.
 */
class WglShader {
    /**
     * @param {!string|!function() : !string} fragmentShaderSourceGenerator
     */
    constructor(fragmentShaderSourceGenerator) {
        if (typeof fragmentShaderSourceGenerator === 'string') {
            let fixedSource = fragmentShaderSourceGenerator;
            fragmentShaderSourceGenerator = () => fixedSource;
        }

        /** @type {!function() : !string} */
        this.fragmentShaderSourceGenerator = fragmentShaderSourceGenerator;
        /** @type {undefined|!WglMortalValueSlot.<!WglCompiledShader>} */
        this._compiledShaderSlot = undefined; // Wait for someone to tell us the parameter names.
    }

    /**
     * Returns the same shader, but parameterized by the given arguments. Call renderTo on the result to render to a
     * destination texture.
     * @param {!WglArg} uniformArguments
     * @returns {!WglConfiguredShader}
     */
    withArgs(...uniformArguments) {
        // Learn the parameter names.
        if (this._compiledShaderSlot === undefined) {
            let parameterNames = uniformArguments.map(e => e.name);
            this._compiledShaderSlot = new WglMortalValueSlot(
                () => new WglCompiledShader(this.fragmentShaderSourceGenerator(), parameterNames),
                compiledShader => compiledShader.free());
        }

        return new WglConfiguredShader(texture => {
            if (texture.width === 0 || texture.height === 0) {
                return;
            }

            const GL = WebGLRenderingContext;
            let ctx = initializedWglContext();
            let gl = ctx.gl;

            ENSURE_ATTRIBUTES_BOUND_SLOT.ensureInitialized(ctx.lifetimeCounter);

            // Bind frame buffer.
            gl.bindFramebuffer(GL.FRAMEBUFFER, texture.initializedFramebuffer());
            checkGetErrorResult(gl, "framebufferTexture2D", true);
            checkFrameBufferStatusResult(gl, true);

            // Compile and bind shader.
            this._compiledShaderSlot.initializedValue(ctx.lifetimeCounter).useWithArgs(uniformArguments);

            gl.viewport(0, 0, texture.width, texture.height);
            gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
            checkGetErrorResult(gl, "drawElements", true);
            texture.markRendered();
        });
    }

    ensureDeinitialized() {
        if (this._compiledShaderSlot !== undefined) {
            this._compiledShaderSlot.ensureDeinitialized();
        }
    }

    toString() {
        return `WglShader(fragmentShaderSource: ${this.fragmentShaderSourceGenerator()})`;
    }
}
/**
 * A compiled shader program definition that can be bound to / used by a webgl context.
 */
class WglCompiledShader {
    /**
     * @param {!string} fragmentShaderSource
     * @param {!Array.<!string>|!Iterable.<!string>} uniformParameterNames
     */
    constructor(fragmentShaderSource, uniformParameterNames) {
        let ctx = initializedWglContext();
        let precision = ctx.maximumShaderFloatPrecision;
        let vertexShader = `
            precision ${precision} float;
            precision ${precision} int;
            attribute vec2 position;
            void main() {
              gl_Position = vec4(position, 0, 1);
            }`;
        let fullFragmentShader = `
            precision ${precision} float;
            precision ${precision} int;
            ${fragmentShaderSource}`;

        const GL = WebGLRenderingContext;
        let gl = ctx.gl;
        let glVertexShader = WglCompiledShader.compileShader(gl, GL.VERTEX_SHADER, vertexShader);
        let glFragmentShader = WglCompiledShader.compileShader(gl, GL.FRAGMENT_SHADER, fullFragmentShader);

        let program = gl.createProgram();
        gl.attachShader(program, glVertexShader);
        gl.attachShader(program, glFragmentShader);
        gl.linkProgram(program);

        // Note: MDN says the result of getProgramInfoLog is always a DOMString, but a user reported an
        // error where it returned null. So now we fallback to the empty string when getting a falsy value.
        let warnings = (gl.getProgramInfoLog(program) || '').trim();
        if (warnings !== '' &&
                warnings !== '\0' && // [happened in Ubuntu with NVIDIA GK107GL]
                Config.SUPPRESSED_GLSL_WARNING_PATTERNS.every(e => !e.test(warnings))) {
            console.warn('Shader compile caused warnings', 'gl.getProgramInfoLog()', warnings);
        }

        if (gl.getProgramParameter(program, GL.LINK_STATUS) === false) {
            throw new Error(
                "Failed to link shader program." +
                "\n" +
                "\n" +
                `gl.VALIDATE_STATUS: ${gl.getProgramParameter(program, GL.VALIDATE_STATUS)}` +
                "\n" +
                `gl.getError(): ${gl.getError()}`);
        }

        gl.deleteShader(glVertexShader);
        gl.deleteShader(glFragmentShader);

        /** @type {!Map.<!string, !WebGLUniformLocation>} */
        this.uniformLocations = new Seq(uniformParameterNames).toMap(e => e, e => gl.getUniformLocation(program, e));
        /** @type {!Number} */
        this.positionAttributeLocation = gl.getAttribLocation(program, 'position');
        /** @type {!WebGLProgram} */
        this.program = program;
    }

    /**
     * @param {!(!WglArg[])} uniformArgs
     * @return {void}
     */
    useWithArgs(uniformArgs) {
        let ctx = initializedWglContext();
        let gl = ctx.gl;
        gl.useProgram(this.program);

        let coop = {coopTextureUnit: 0};
        for (let arg of uniformArgs) {
            let location = this.uniformLocations.get(arg.name);
            if (location === undefined) {
                throw new DetailedError("Unexpected uniform argument", {arg, uniformArgs});
            }
            WglArg.INPUT_ACTION_MAP.get(arg.type)(ctx, location, arg.value, coop);
        }

        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
    }

    free() {
        let gl = initializedWglContext().gl;
        gl.deleteProgram(this.program);
    }

    /**
     * @param {!WebGLRenderingContext} gl
     * @param {number} shaderType
     * @param {!string} sourceCode
     * @returns {!WebGLShader}
     */
    static compileShader(gl, shaderType, sourceCode) {
        let shader = gl.createShader(shaderType);

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        let info = gl.getShaderInfoLog(shader);
        if (info !== '') {
            let ignored = false;
            for (let term of Config.IGNORED_WEBGL_INFO_TERMS) {
                if (info.indexOf(term)) {
                    ignored = true;
                }
            }
            if (!ignored) {
                console.warn("WebGLShader: gl.getShaderInfoLog() wasn't empty: " + gl.getShaderInfoLog(shader));
                console.warn("Source code was: " + sourceCode);
            }
        }

        if (gl.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS) === false) {
            throw new Error(`WebGLShader: Shader compile failed.
                Info: ${info}
                Source: ${sourceCode}`);
        }

        return shader;
    }
}

export {WglShader};
