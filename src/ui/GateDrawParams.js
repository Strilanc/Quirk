/**
 * @param {!GateColumn} gateColumn
 * @param {!int} wireIndex
 * @param {!QuantumState} state
 *
 * @property {!GateColumn} gateColumn
 * @property {!int} wireIndex
 * @property {!QuantumState} state
 *
 * @constructor
 */
export class CircuitContext {
    constructor(gateColumn, wireIndex, state) {
        this.gateColumn = gateColumn;
        this.wireIndex = wireIndex;
        this.state = state;
    }
}

export default class GateDrawParams {
    /**
     * @param {!Painter} painter
     * @param {!boolean} isInToolbox
     * @param {!boolean} isHighlighted
     * @param {!Rect} rect
     * @param {!Gate} gate
     * @param {!number} time
     * @param {?CircuitContext} circuitContext
     *
     * @property {!Painter} painter
     * @property {!boolean} isInToolbox
     * @property {!boolean} isHighlighted
     * @property {!Rect} rect
     * @property {!Gate} gate
     * @property {!number} time
     * @property {?CircuitContext} circuitContext
     */
    constructor(painter, isInToolbox, isHighlighted, rect, gate, time, circuitContext) {
        this.painter = painter;
        this.isInToolbox = isInToolbox;
        this.isHighlighted = isHighlighted;
        this.rect = rect;
        this.gate = gate;
        this.time = time;
        this.circuitContext = circuitContext;
    }
}
