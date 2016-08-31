/**
 * Values used by gate disable reason finder functions.
 */
export default class GateCheckArgs {
    /**
     * @param {!Gate} gate
     * @param {!GateColumn} innerColumn
     * @param {!int} outerRow
     * @param {!int} measuredMask
     * @param {!Map.<!string, *>} context
     */
    constructor(gate,
                innerColumn,
                outerRow,
                measuredMask,
                context) {
        /** @type {!Gate} */
        this.gate = gate;
        /** @type {!GateColumn} */
        this.innerColumn = innerColumn;
        /** @type {!int} */
        this.outerRow = outerRow;
        /** @type {!int} */
        this.measuredMask = measuredMask;
        /** @type {!Map.<!string, *>} */
        this.context = context;
    }
}
