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
        return new WglArg(WglArg.VEC2_TYPE, name, {x: x, y: y});
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
     * @param {!Float32Array} data
     * @param {!int} width
     * @param {!int} height
     * @returns {!WglArg}
     */
    static dataTexture(name, data, width, height) {
        return new WglArg(WglArg.DATA_TEXTURE_TYPE, name, {data: data, width: width, height: height});
    }

    toString() {
        return `${this.type} ${this.name} = ${JSON.stringify(this.value)}`;
    }
}

//noinspection JSUnresolvedFunction
WglArg.FLOAT_TYPE = "float";
//noinspection JSUnresolvedFunction
WglArg.INT_TYPE = "int";
//noinspection JSUnresolvedFunction
WglArg.VEC2_TYPE = "vec2";
//noinspection JSUnresolvedFunction
WglArg.TEXTURE_TYPE = "texture";
//noinspection JSUnresolvedFunction
WglArg.DATA_TEXTURE_TYPE = "data_texture";
