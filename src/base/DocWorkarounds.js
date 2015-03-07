/**
 * Associates keys with values.
 *
 * This class is just a JSDoc hack to make WebStorm understand the built-in Map type, and should not be used.
 */
class Map {
    /**
     * @property {!int} size
     * @property {!function()} clear
     * @property {!function(K): !boolean} has
     * @property {!function(K) : V} get
     * @property {!function(K, V) : !Map<K, V>} set
     * @property {!function(K)} delete
     * @property {!Iterator<!((K|V)[])>} entries
     * @property {!function() : !Iterator<K>} keys
     * @property {!function() : !Iterator<V>} values
     * @template K, V
     */
    constructor() {
        throw new Error("Just a doc class")
    }
}

/**
 * A collection of distinct keys, with efficient membership testing.
 *
 * This class is just a JSDoc hack to make WebStorm understand the built-in Set type, and should not be used.
 */
class Set {
    /**
     * @property {!int} size
     * @property {!function()} clear
     * @property {!function(T): !boolean} has
     * @property {!function(T) : !Set<T>} add
     * @property {!function(T)} delete
     * @property {!Iterator<!(T[])>} entries
     * @property {!function() : !Iterator<T>} keys
     * @property {!function() : !Iterator<T>} values
     * @template T
     */
    constructor() {
        throw new Error("Just a doc class")
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
     * @property {!function(): !Iterator<T>} [Symbol.iterator]
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
class Symbol {
}

Symbol.iterator = {};
