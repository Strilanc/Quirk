import Config from "src/Config.js"
import WglArg from "src/webgl/WglArg.js"
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
        /** @type {undefined|!WglMortalValueSlot.<!WglShaderContext>} */
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
                    ctx => new WglShaderContext(ctx, this.fragmentShaderSource, parameterNames));
        }
        this._shaderContextSlot.initializedValue(context).load(context, uniformArguments);
    };

    toString() {
        return `WglShader(fragmentShaderSource: ${this.fragmentShaderSource})`;
    }
}

const WGL_ARG_TYPE_UNIFORM_ACTION_MAP = {
    [WglArg.BOOL_TYPE]: (c, loc, val) => c.gl.uniform1f(loc, val ? 1 : 0),
    [WglArg.INT_TYPE]: (c, loc, val) => c.gl.uniform1i(loc, val),
    [WglArg.FLOAT_TYPE]: (c, loc, val) => c.gl.uniform1f(loc, val),
    [WglArg.VEC2_TYPE]: (c, loc, val) => c.gl.uniform2f(loc, val[0], val[1]),
    [WglArg.VEC4_TYPE]: (c, loc, val) => c.gl.uniform4f(loc, val[0], val[1], val[2], val[3]),
    [WglArg.MAT4_TYPE]: (c, loc, val) => c.gl.uniformMatrix4fv(loc, false, val),
    [WglArg.TEXTURE_TYPE]: (c, loc, val) => {
        if (val.unit >= c.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${val.unit} but max is ${c.maxTextureUnits}.`);
        }
        if (val.texture.width > c.maxTextureSize || val.texture.height > c.maxTextureSize) {
            throw new Error(`Uniform texture argument is ${val.texture.width}x${val.texture.height}, but max ` +
                `texture diameter is ${c.maxTextureSize}.`);
        }
        let gl = c.gl;
        gl.uniform1i(loc, val.unit);
        gl.activeTexture(WebGLRenderingContext.TEXTURE0 + val.unit);
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.texture.instanceFor(c).texture);
    },
    [WglArg.RAW_TEXTURE_TYPE]: (c, loc, val) => {
        if (val.unit >= c.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${val.unit} but max is ${c.maxTextureUnits}.`);
        }
        let gl = c.gl;
        gl.uniform1i(loc, val.unit);
        gl.activeTexture(WebGLRenderingContext.TEXTURE0 + val.unit);
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.texture);
    }
};

/**
 * A compiled shader program definition that can be bound to / used by a webgl context.
 */
class WglShaderContext {
    /**
     * @param {!WglContext} ctx
     * @param {!string} fragmentShaderSource
     * @param {!Array.<!string>|!Iterable.<!string>} uniformParameterNames
     *
     * @property {!Map} uniformLocations
     * @property {*} positionAttributeLocation
     * @property {*} program
     */
    constructor(ctx, fragmentShaderSource, uniformParameterNames) {
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
        let glVertexShader = WglShaderContext.compileShader(gl, GL.VERTEX_SHADER, vertexShader);
        let glFragmentShader = WglShaderContext.compileShader(gl, GL.FRAGMENT_SHADER, fullFragmentShader);

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

        this.uniformLocations = new Seq(uniformParameterNames).toMap(e => e, e => gl.getUniformLocation(program, e));
        this.positionAttributeLocation = gl.getAttribLocation(program, 'position');
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
            WGL_ARG_TYPE_UNIFORM_ACTION_MAP[arg.type](context, location, arg.value);
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
