import Config from "src/Config.js"
import DetailedError from "src/base/DetailedError.js"
import WglArg from "src/webgl/WglArg.js"
import { initializedWglContext }  from "src/webgl/WglContext.js"
import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"
import WglTexture from "src/webgl/WglTexture.js"
import { checkGetErrorResult, checkFrameBufferStatusResult } from "src/webgl/WglUtil.js"
import {seq, Seq} from "src/base/Seq.js"

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
     * @param {!string} fragmentShaderSource
     */
    constructor(fragmentShaderSource) {
        /** @type {!string} */
        this.fragmentShaderSource = fragmentShaderSource;
        /** @type {undefined|!WglMortalValueSlot.<!WglCompiledShader>} */
        this._compiledShaderSlot = undefined; // Wait for someone to tell us the parameter names.
    };

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
                () => new WglCompiledShader(this.fragmentShaderSource, parameterNames),
                compiledShader => compiledShader.free());
        }

        return new WglConfiguredShader(texture => {
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
        });
    }

    toString() {
        return `WglShader(fragmentShaderSource: ${this.fragmentShaderSource})`;
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

        let warnings = gl.getProgramInfoLog(program);
        if (warnings !== '' && Config.SUPPRESSED_GLSL_WARNING_PATTERNS.every(e => !e.test(warnings))) {
            console.warn('gl.getProgramInfoLog()', warnings);
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
    };

    /**
     * @param {!(!WglArg[])} uniformArgs
     * @return {void}
     */
    useWithArgs(uniformArgs) {
        let ctx = initializedWglContext();
        let gl = ctx.gl;
        gl.useProgram(this.program);

        for (let arg of uniformArgs) {
            let location = this.uniformLocations.get(arg.name);
            if (location === undefined) {
                throw new DetailedError("Unexpected uniform argument", {arg, uniformArgs});
            }
            WglArg.INPUT_ACTION_MAP.get(arg.type)(ctx, location, arg.value);
        }

        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
    };

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

        if (gl.getShaderInfoLog(shader) !== '') {
            console.warn('WebGLShader: gl.getShaderInfoLog()', gl.getShaderInfoLog(shader));
            console.warn(sourceCode);
        }

        if (gl.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS) === false) {
            throw new Error(`WebGLShader: Shader compile failed: ${sourceCode} ${gl.getError()}`);
        }

        return shader;
    };
}

/**
 * A shader with all its arguments provided, ready to render to a texture.
 */
class WglConfiguredShader {
    /**
     * @param {!function(!WglTexture) : void} renderToFunc
     */
    constructor(renderToFunc) {
        /** @type {!function(!WglTexture) : void} */
        this.renderToFunc = renderToFunc;
    }

    /**
     * Runs the configured renderer, placing its outputs into the given texture.
     * @param {!WglTexture} texture
     */
    renderTo(texture) {
        this.renderToFunc(texture);
    }

    /**
     * Renders into a new float texture of the given size, and returns the texture.
     * @param {!int} width
     * @param {!int} height
     * @returns {!WglTexture}
     */
    toFloatTexture(width, height) {
        let texture = new WglTexture(width, height);
        this.renderTo(texture);
        return texture;
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} width
     * @param {!int} height
     * @returns {!Float32Array|!Uint8Array}
     */
    readFloatOutputs(width, height) {
        let texture = new WglTexture(width, height);
        try {
            this.renderTo(texture);
            return texture.readPixels();
        } finally {
            texture.ensureDeinitialized();
        }
    }

    /**
     * Renders the result into an unsigned byte texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} width
     * @param {!int} height
     * @returns {!Float32Array|!Uint8Array}
     */
    readByteOutputs(width, height) {
        let texture = new WglTexture(width, height, WebGLRenderingContext.UNSIGNED_BYTE);
        this.renderTo(texture);
        let result = texture.readPixels();
        texture.ensureDeinitialized();
        return result;
    }
}

export default WglShader;
export { WglShader, WglConfiguredShader };
