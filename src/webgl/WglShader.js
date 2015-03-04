import WglCache from "src/webgl/WglCache.js"
import WglArg from "src/webgl/WglArg.js"
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
        //noinspection JSUnresolvedFunction
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

/**
 * A compiled shader program definition that can be bound to / used by a webgl context.
 */
class WglShaderContext {
    /**
     * @param {!WglCache} context
     * @param {!string} fragmentShaderSource
     * @param {!Iterable<!string>} uniformParameterNames
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

        let nextTextureUnitIndex = 0;
        let getNextTextureUnitIndex = () => {
            let textureUnit = nextTextureUnitIndex++;
            if (textureUnit >= context.maxTextureUnits) {
                throw new Error(`WebGLRenderer: not enough texture units (${context.maxTextureUnits})`);
            }
            return textureUnit;
        };

        let typeActionMap = {
            [WglArg.BOOL_TYPE]: (loc, val) => g.uniform1f(loc, val ? 1 : 0),
            [WglArg.INT_TYPE]: (loc, val) => g.uniform1i(loc, val),
            [WglArg.FLOAT_TYPE]: (loc, val) => g.uniform1f(loc, val),
            [WglArg.VEC2_TYPE]: (loc, val) => g.uniform2f(loc, val.x, val.y),

            /**
             * @param {*} loc
             * @param {!WglTexture} val
             */
            [WglArg.TEXTURE_TYPE]: (loc, val) => {
                let textureUnit = getNextTextureUnitIndex();
                g.uniform1i(loc, textureUnit);
                g.activeTexture(WebGLRenderingContext.TEXTURE0 + textureUnit);
                //noinspection JSCheckFunctionSignatures
                g.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.instanceFor(context).texture);
            },

            /**
             * @param {*} loc
             * @param {!{data: !Float32Array, width: int, height: int}} val
             */
            [WglArg.DATA_TEXTURE_TYPE]: (loc, val) => {
                if (val.width > context.maxTextureDiameter || val.height > context.maxTextureDiameter) {
                    throw new Error(
                        `Texture size (${val.width} x ${val.height}) exceeds ` +
                        `maximum diameter (${context.maxTextureDiameter}).`);
                }

                let s = WebGLRenderingContext;
                let textureUnit = getNextTextureUnitIndex();
                g.uniform1i(loc, textureUnit);
                g.activeTexture(s.TEXTURE0 + textureUnit);

                let texture = g.createTexture();
                g.bindTexture(s.TEXTURE_2D, texture);
                g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MAG_FILTER, s.NEAREST);
                g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MIN_FILTER, s.NEAREST);
                g.texImage2D(s.TEXTURE_2D, 0, s.RGBA, val.width, val.height, 0, s.RGBA, s.FLOAT, val.data);
            }
        };

        g.useProgram(this.program);

        for (let arg of uniformArgs) {
            let location = this.uniformLocations.get(arg.name);
            if (location === undefined) {
                throw new Error(`Unexpected argument: ${arg}`)
            }
            typeActionMap[arg.type](location, arg.value);
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
