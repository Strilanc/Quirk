/**
 * Describes a uniform argument, for passing into shaders when rendering.
 */
export default class WglArg {
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
    };

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
     * @param {!WglTexture} value
     * @returns {!WglArg}
     */
    static texture(name, value) {
        return new WglArg(WglArg.TEXTURE_TYPE, name, value);
    }

    /**
     * @param {!string} name
     * @param {!WebGLTexture} value
     * @returns {!WglArg}
     */
    static rawTexture(name, value) {
        return new WglArg(WglArg.RAW_TEXTURE_TYPE, name, value);
    }

    toString() {
        return `${this.type} ${this.name} = ${JSON.stringify(this.value)}`;
    }
}

WglArg.BOOL_TYPE = "bool";
WglArg.FLOAT_TYPE = "float";
WglArg.INT_TYPE = "int";
WglArg.VEC2_TYPE = "vec2";
WglArg.VEC4_TYPE = "vec4";
WglArg.TEXTURE_TYPE = "texture";
WglArg.RAW_TEXTURE_TYPE = "raw_texture";
