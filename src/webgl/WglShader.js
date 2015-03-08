import WglCache from "src/webgl/WglCache.js"
import WglArg from "src/webgl/WglArg.js"
import WglTexture from "src/webgl/WglTexture.js"
import Seq from "src/base/Seq.js"

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
        /** @type {!ContextStash} */
        this.contextStash = new Map();
    };

    /**
     * Sets the active shader, for the given context, to a compiled version of this shader with the given uniform
     * arguments.
     * @param {!WglCache} context
     * @param {!(!WglArg[])} uniformArguments
     */
    bindInstanceFor(context, uniformArguments) {
        //noinspection JSCheckFunctionSignatures,JSUnresolvedVariable
        var compiled = context.retrieveOrCreateAssociatedData(this.contextStash, () =>
            new WglShaderContext(context, this.fragmentShaderSource, uniformArguments.map(e => e.name)));

        compiled.load(context, uniformArguments);
    };
}

const WGL_ARG_TYPE_UNIFORM_ACTION_MAP = {
    [WglArg.BOOL_TYPE]: (c, loc, val) => c.webGLRenderingContext.uniform1f(loc, val ? 1 : 0),
    [WglArg.INT_TYPE]: (c, loc, val) => c.webGLRenderingContext.uniform1i(loc, val),
    [WglArg.FLOAT_TYPE]: (c, loc, val) => c.webGLRenderingContext.uniform1f(loc, val),
    [WglArg.VEC2_TYPE]: (c, loc, val) => c.webGLRenderingContext.uniform2f(loc, val[0], val[1]),
    [WglArg.VEC4_TYPE]: (c, loc, val) => c.webGLRenderingContext.uniform4f(loc, val[0], val[1], val[2], val[3]),
    [WglArg.TEXTURE_TYPE]: (c, loc, val) => {
        if (val.unit >= c.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${val.unit} but max is ${c.maxTextureUnits}.`);
        }
        if (val.texture.width >= c.maxTextureDiameter || val.texture.height >= c.maxTextureDiameter) {
            throw new Error(`Uniform texture argument is ${val.texture.width}x${val.texture.height}, but max ` +
                `diameter is ${c.maxTextureDiameter}.`);
        }
        let g = c.webGLRenderingContext;
        g.uniform1i(loc, val.unit);
        g.activeTexture(WebGLRenderingContext.TEXTURE0 + val.unit);
        g.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.texture.instanceFor(c).texture);
    },
    [WglArg.RAW_TEXTURE_TYPE]: (c, loc, val) => {
        if (val.unit >= c.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${val.unit} but max is ${c.maxTextureUnits}.`);
        }
        let g = c.webGLRenderingContext;
        g.uniform1i(loc, val.unit);
        g.activeTexture(WebGLRenderingContext.TEXTURE0 + val.unit);
        g.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.texture);
    }
};

/**
 * A compiled shader program definition that can be bound to / used by a webgl context.
 */
class WglShaderContext {
    /**
     * @param {!WglCache} context
     * @param {!string} fragmentShaderSource
     * @param {!Iterable.<!string>} uniformParameterNames
     *
     * @property {!Map} uniformLocations
     * @property {*} positionAttributeLocation
     * @property {*} program
     */
    constructor(context, fragmentShaderSource, uniformParameterNames) {
        let precision = context.getMaximumShaderFloatPrecision();
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

        let s = WebGLRenderingContext;
        let g = context.webGLRenderingContext;
        let glVertexShader = WglShaderContext.compileShader(g, s.VERTEX_SHADER, vertexShader);
        let glFragmentShader = WglShaderContext.compileShader(g, s.FRAGMENT_SHADER, fullFragmentShader);

        let program = g.createProgram();
        g.attachShader(program, glVertexShader);
        g.attachShader(program, glFragmentShader);
        g.linkProgram(program);

        if (g.getProgramInfoLog(program) !== '') {
            console.warn('gl.getProgramInfoLog()', g.getProgramInfoLog(program));
        }

        if (g.getProgramParameter(program, s.LINK_STATUS) === false) {
            throw new Error(
                "Failed to link shader program." +
                "\n" +
                "\n" +
                `gl.VALIDATE_STATUS: ${g.getProgramParameter(program, s.VALIDATE_STATUS)}` +
                "\n" +
                `gl.getError(): ${g.getError()}`);
        }

        g.deleteShader(glVertexShader);
        g.deleteShader(glFragmentShader);

        //noinspection JSCheckFunctionSignatures
        this.uniformLocations = new Seq(uniformParameterNames).toMap(e => e, e => g.getUniformLocation(program, e));
        this.positionAttributeLocation = g.getAttribLocation(program, 'position');
        this.program = program;
    };

    /**
     * @param {!WglCache} context
     * @param {!(!WglArg[])} uniformArgs
     */
    load(context, uniformArgs) {
        let g = context.webGLRenderingContext;
        g.useProgram(this.program);

        for (let arg of uniformArgs) {
            let location = this.uniformLocations.get(arg.name);
            if (location === undefined) {
                throw new Error(`Unexpected argument: ${arg}`)
            }
            WGL_ARG_TYPE_UNIFORM_ACTION_MAP[arg.type](context, location, arg.value);
        }

        g.enableVertexAttribArray(this.positionAttributeLocation);
        g.vertexAttribPointer(this.positionAttributeLocation, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
    };

    /**
     * @param {!WebGLRenderingContext} g
     * @param {number} shaderType
     * @param {!string} sourceCode
     * @returns {!WebGLShader}
     */
    static compileShader(g, shaderType, sourceCode) {
        let shader = g.createShader(shaderType);

        g.shaderSource(shader, sourceCode);
        g.compileShader(shader);

        if (g.getShaderInfoLog(shader) !== '') {
            console.warn('WebGLShader: gl.getShaderInfoLog()', g.getShaderInfoLog(shader));
            console.warn(sourceCode);
        }

        if (g.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS) === false) {
            throw new Error(`WebGLShader: Shader compile failed: ${sourceCode} ${g.getError()}`);
        }

        return shader;
    };
}
