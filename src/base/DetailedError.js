import describe from "src/base/Describe.js"

/**
 * A generic error with an attached payload of details for context.
 */
export default class DetailedError extends Error {
    /**
     * @param {!string} message
     * @param {*} detailsObj
     */
    constructor(message, detailsObj) {
        super(message);
        /** @type {*} */
        this.detailsObj = detailsObj;
        /** @type {!string} */
        this.details = describe(detailsObj);
        /** @type {!string} */
        this.name = 'Error';
        /** @type {!string} */
        this.message = message;
        /** @type {!string} */
        this.stack = new Error().stack.replace(/^Error\n\s+at new DetailedError (\S+)\s?\n\s+at /, '\n    ');
    }
}
