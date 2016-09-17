/**
 * A random number generator that records its results, so you can make a restarted copy.
 */
class RestartableRng {
    /**
     * @private
     */
    constructor() {
        /**
         * @type {!Array.<!number>}
         * @private
         */
        this._cache = [];
        /**
         * @type {!int}
         * @private
         */
        this._next = 0;
    }

    /**
     * @returns {!RestartableRng}
     */
    restarted() {
        let result =  new RestartableRng();
        result._cache = this._cache;
        return result;
    }

    /**
     * @returns {!number} A random number uniformly sampled from [0, 1).
     */
    random() {
        let p = this._next++;
        if (p >= this._cache.length) {
            this._cache.push(Math.random());
        }
        return this._cache[p];
    }
}

export {RestartableRng}
