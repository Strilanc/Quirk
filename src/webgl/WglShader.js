import Config from "src/Config.js"
import WglArg from "src/webgl/WglArg.js"
import { initializedWglContext }  from "src/webgl/WglContext.js"
import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"
import WglTexture from "src/webgl/WglTexture.js"
import {seq, Seq} from "src/base/Seq.js"

/**
 * A shader program definition, used to render outputs onto textures based on the given GLSL source code.
 */
export default class WglShader {
    /**
     * @param {!string} fragmentShaderSource
     */
    constructor(fragmentShaderSource) {
        /** @type {!string} */
        this.fragmentShaderSource = fragmentShaderSource;
        /** @type {undefined|!WglMortalValueSlot.<!WglCompiledShader>} */
        this._shaderContextSlot = undefined; // Wait for someone to tell us the parameter names.
    };

    /**
     * Sets the active shader, for the given context, to a compiled version of this shader with the given uniform
     * arguments.
     * @param {!WglContext} context
     * @param {!(!WglArg[])} uniformArguments
     */
    bindInstanceFor(context, uniformArguments) {
        if (this._shaderContextSlot === undefined) {
            // We just learned the parameter names.
            let parameterNames = uniformArguments.map(e => e.name);
            this._shaderContextSlot = new WglMortalValueSlot(
                () => new WglCompiledShader(this.fragmentShaderSource, parameterNames));
        }
        this._shaderContextSlot.initializedValue(context).load(context, uniformArguments);
    };

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
     * @param {!WglContext} context
     * @param {!(!WglArg[])} uniformArgs
     */
    load(context, uniformArgs) {
        let gl = context.gl;
        gl.useProgram(this.program);

        for (let arg of uniformArgs) {
            let location = this.uniformLocations.get(arg.name);
            if (location === undefined) {
                throw new Error(`Unexpected argument: ${arg}`)
            }
            WglArg.INPUT_ACTION_MAP.get(arg.type)(context, location, arg.value);
        }

        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
    };

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
