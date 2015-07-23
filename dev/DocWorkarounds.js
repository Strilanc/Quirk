/**
 * Associates keys with values.
 *
 * This class is just a JSDoc hack to make WebStorm understand the built-in Map type, and should not be used.
 * @property {!function() : !Iterator.<V>} values
 * @template K, V
 */
class Map {
    //noinspection JSUnusedLocalSymbols
    /**
     * @param {(*[])=} iterableKeyValuePairs
     */
    constructor(iterableKeyValuePairs) {
        /** @type {!int} */
        this.size = 0;
        throw new Error("Just a doc class");
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * @returns undefined
     */
    clear() {
    }

    //noinspection JSUnusedGlobalSymbols,ReservedWordAsName
    /**
     * @param {K|*} key
     * @returns undefined
     * @template K
     */
    delete(key) {
        throw new Error("Just a doc class " + key + this)
    }

    /**
     * @param {K|*} key
     * @returns {V|undefined}
     * @template K, V
     */
    get(key) {
        throw new Error("Just a doc class " + key + this)
    }

    /**
     * @param {K|*} key
     * @param {V|*} val
     * @returns {Map.<K, V>|undefined}
     * @template K, V
     */
    set(key, val) {
        throw new Error("Just a doc class " + key + val + this)
    }

    /**
     * @param {K|*} key
     * @returns {!boolean}
     * @template K
     */
    has(key) {
        throw new Error("Just a doc class " + key + this)
    }

    /**
     * @returns {!Iterator.<K>}
     * @template K
     */
    keys() {
        throw new Error("Just a doc class " + this);
    }

    /**
     * @returns {!Iterator.<V>}
     * @template V
     */
    values() {
        throw new Error("Just a doc class " + this);
    }

    /**
     * @returns {!Iterator.<[K, V]>}
     * @template K, V
     */
    entries() {
        throw new Error("Just a doc class " + this);
    }
}

/**
 * A collection of distinct keys, with efficient membership testing.
 *
 * This class is just a JSDoc hack to make WebStorm understand the built-in Set type, and should not be used.
 */
class Set {
    //noinspection JSUnusedLocalSymbols
    /**
     * @param {(*[]=} valuesIterable
     * @property {!int} size
     * @property {!function()} clear
     * @property {!function(T) : !Set.<T>} add
     * @property {!function(T)} delete
     * @property {!Iterator.<!(T[])>} entries
     * @property {!function() : !Iterator.<T>} keys
     * @property {!function() : !Iterator.<T>} values
     * @template T
     */
    constructor(valuesIterable) {
        throw new Error("Just a doc class")
    }

    /**
     * @param {T|*} key
     * @returns {!boolean}
     * @template T
     */
    has(key) {
        throw new Error("Just a doc class " + key + this)
    }
}

/**
 * Yields items.
 *
 * This class is just a JSDoc hack to make WebStorm understand the implicit type, and should not be used.
 */
class Iterator {
    /**
     * @property {!function() : !{
     *     value: (T|undefined),
     *     done: !boolean
     *   }
     * }} next
     * @template T
     */
    constructor() {
        throw new Error("Just a doc class")
    }
}

/**
 * Can be iterated.
 *
 * This class is just a JSDoc hack to make WebStorm understand the implicit type, and should not be used.
 */
class Iterable {
    /**
     * @property {!function(): !Iterator.<T>} [Symbol.iterator]
     * @template T
     */
    constructor() {
        throw new Error("Just a doc class")
    }
}

/**
 * A unique key.
 *
 * This class is just a JSDoc hack to make WebStorm understand the Symbol "type", and should not be used.
 */
function Symbol(key) {
    throw new Error("Just a doc class " + key);
}
Symbol.iterator = {};

/**
 * A WebGL texture.
 *
 * This class is just a JSDoc hack to make WebStorm understand the webgl type, and should not be used.
 */
class WebGLTexture {}

class performance {
    /**
     * @returns {!number}
     */
    static now() {
        throw new Error("Just a doc class")
    }
}
