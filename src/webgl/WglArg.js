/**
 * Describes a uniform argument, for passing into shaders when rendering.
 */
export default class WglArg {
    /**
     * @param {!Symbol} type
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
     * @param {!{x: !number, y: !number}} value
     * @returns {!WglArg}
     */
    static vec2(name, value) {
        return new WglArg(WglArg.VEC2_TYPE, name, value);
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
     * @param {!{data: !Float32Array, width: int, height: int}} value
     * @returns {!WglArg}
     */
    static dataTexture(name, value) {
        return new WglArg(WglArg.DATA_TEXTURE_TYPE, name, value);
    }
}

//noinspection JSUnresolvedFunction
WglArg.FLOAT_TYPE = Symbol("WGL_ARG_FLOAT_TYPE");
//noinspection JSUnresolvedFunction
WglArg.INT_TYPE = Symbol("WGL_ARG_INT_TYPE");
//noinspection JSUnresolvedFunction
WglArg.VEC2_TYPE = Symbol("WGL_ARG_VEC2_TYPE");
//noinspection JSUnresolvedFunction
WglArg.TEXTURE_TYPE = Symbol("WGL_ARG_TEXTURE_TYPE");
//noinspection JSUnresolvedFunction
WglArg.DATA_TEXTURE_TYPE = Symbol("WGL_ARG_DATA_TEXTURE_TYPE");
