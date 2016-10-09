/**
 * Describes a uniform argument, for passing into shaders when rendering.
 */
class WglArg {
    /**
     * @param {!string} type
     * @param {!string} name
     * @param {*} value
     */
    constructor(type, name, value) {
        /** @type {!Symbol} */
        this.type = type;
        /** @type {!string} */
        this.name = name;
        /** @type {*} */
        this.value = value;
    }

    /**
     * @param {!string} name
     * @param {!boolean} value
     * @returns {!WglArg}
     */
    static bool(name, value) {
        return new WglArg(WglArg.BOOL_TYPE, name, value);
    }

    /**
     * @param {!string} name
     * @param {!number} value
     * @returns {!WglArg}
     */
    static float(name, value) {
        return new WglArg(WglArg.FLOAT_TYPE, name, value);
    }

    /**
     * @param {!string} name
     * @param {!int} value
     * @returns {!WglArg}
     */
    static int(name, value) {
        return new WglArg(WglArg.INT_TYPE, name, value);
    }

    /**
     * @param {!string} name
     * @param {!number} x
     * @param {!number} y
     * @returns {!WglArg}
     */
    static vec2(name, x, y) {
        return new WglArg(WglArg.VEC2_TYPE, name, [x, y]);
    }

    /**
     * @param {!string} name
     * @param {!Float32Array|!Float64Array} buf
     * @returns {!WglArg}
     */
    static float_array(name, buf) {
        if (buf instanceof Float64Array) {
            buf = new Float32Array(buf);
        }
        return new WglArg(WglArg.FLOAT_ARRAY_TYPE, name, buf);
    }

    /**
     * @param {!string} name
     * @param {!number} x
     * @param {!number} y
     * @param {!number} z
     * @param {!number} t
     * @returns {!WglArg}
     */
    static vec4(name, x, y, z, t) {
        return new WglArg(WglArg.VEC4_TYPE, name, [x, y, z, t]);
    }

    /**
     * @param {!string} name
     * @param {!Float32Array|!Array.<!number>} cellsRowByRow
     * @returns {!WglArg}
     */
    static mat4(name, cellsRowByRow) {
        return new WglArg(WglArg.MAT4_TYPE, name, cellsRowByRow);
    }

    /**
     * @param {!string} name
     * @param {!WglTexture} wglTexture
     * @returns {!WglArg}
     */
    static texture(name, wglTexture) {
        return new WglArg(WglArg.WGL_TEXTURE_TYPE, name, wglTexture);
    }

    /**
     * @param {!string} name
     * @param {!WebGLTexture} webGlTexture
     * @returns {!WglArg}
     */
    static webGlTexture(name, webGlTexture) {
        return new WglArg(WglArg.WEB_GL_TEXTURE_TYPE, name, webGlTexture);
    }

    toString() {
        return `${this.type} ${this.name} = ${JSON.stringify(this.value)}`;
    }
}

WglArg.BOOL_TYPE = "bool";
WglArg.FLOAT_TYPE = "float";
WglArg.INT_TYPE = "int";
WglArg.VEC2_TYPE = "vec2";
WglArg.FLOAT_ARRAY_TYPE = "float[]";
WglArg.VEC4_TYPE = "vec4";
WglArg.MAT4_TYPE = "mat4";
WglArg.WGL_TEXTURE_TYPE = "wgl_texture";
WglArg.WEB_GL_TEXTURE_TYPE = "web_gl_texture";

/**
 * A map from an argument's type to the action used to give it to a shader.
 * @type {!Map.<!string, !function(!WglContext, !WebGLUniformLocation, *. {coopTextureUnit: !int) : void>}
 */
WglArg.INPUT_ACTION_MAP = new Map([
    [WglArg.BOOL_TYPE, (ctx, loc, val) => ctx.gl.uniform1f(loc, val ? 1 : 0)],
    [WglArg.INT_TYPE, (ctx, loc, val) => ctx.gl.uniform1i(loc, val)],
    [WglArg.FLOAT_TYPE, (ctx, loc, val) => ctx.gl.uniform1f(loc, val)],
    [WglArg.VEC2_TYPE, (ctx, loc, [x,y]) => ctx.gl.uniform2f(loc, x, y)],
    [WglArg.FLOAT_ARRAY_TYPE, (ctx, loc, buf) => ctx.gl.uniform1fv(loc, buf)],
    [WglArg.VEC4_TYPE, (ctx, loc, [r,g,b,a]) => ctx.gl.uniform4f(loc, r, g, b, a)],
    [WglArg.MAT4_TYPE, (ctx, loc, val) => ctx.gl.uniformMatrix4fv(loc, false, val)],
    [WglArg.WGL_TEXTURE_TYPE, (ctx, loc, texture, coop) => {
        let unit = coop.coopTextureUnit++;
        if (unit >= ctx.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${unit} but max ` +
                `is ${ctx.maxTextureUnits}.`);
        }
        if (texture.width > ctx.maxTextureSize || texture.height > ctx.maxTextureSize) {
            throw new Error(`Uniform texture argument is ${texture.width}x${texture.height}, but max ` +
                `texture diameter is ${ctx.maxTextureSize}.`);
        }
        let gl = ctx.gl;
        gl.uniform1i(loc, unit);
        gl.activeTexture(WebGLRenderingContext.TEXTURE0 + unit);
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, texture.initializedTexture());
    }],
    [WglArg.WEB_GL_TEXTURE_TYPE, (ctx, loc, texture, coop) => {
        let unit = coop.coopTextureUnit++;
        if (unit >= ctx.maxTextureUnits) {
            throw new Error(`Uniform texture argument uses texture unit ${unit} but max ` +
                `is ${ctx.maxTextureUnits}.`);
        }
        let gl = ctx.gl;
        gl.uniform1i(loc, unit);
        gl.activeTexture(WebGLRenderingContext.TEXTURE0 + unit);
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, texture);
    }]
]);

export {WglArg}
