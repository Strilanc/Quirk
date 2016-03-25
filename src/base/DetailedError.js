import describe from "src/base/Describe.js"

let CONSTRUCTOR_CALLS_NESTING = 0;

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
        this.name = 'Error';
        /** @type {!string} */
        this.message = message;
        /** @type {!string} */
        this.stack = new Error().stack.replace(/^Error\n\s+at new DetailedError (\S+)\s?\n\s+at /, '\n    ');

        CONSTRUCTOR_CALLS_NESTING++;
        try {
            /** @type {!string} */
            this.details = CONSTRUCTOR_CALLS_NESTING === 1 ?
                describe(detailsObj) :
                "(failed to describe detailsObj due to possibly re-entrancy)";
        } catch (ex) {
            console.error(ex);
            this.details = "(failed to describe detailsObj, see the console for details)";
        } finally {
            CONSTRUCTOR_CALLS_NESTING--;
        }
    }
}
