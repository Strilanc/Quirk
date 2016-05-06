import describe from "src/base/Describe.js"
import DetailedError from "src/base/DetailedError.js"
import Gate from "src/circuit/Gate.js"
import GateColumn from "src/circuit/GateColumn.js"
import Point from "src/math/Point.js"
import Util from "src/base/Util.js"

class Hand {
    /**
     * @param {undefined|!Point} pos
     * @param {undefined|!Gate} heldGate
     * @param {undefined|!Point} heldGateOffset
     * @param {undefined|!Point} resizingGateSlot
     */
    constructor(pos, heldGate, heldGateOffset, resizingGateSlot) {
        if (pos !== undefined && !(pos instanceof Point)) {
            throw new DetailedError("Bad pos", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }
        if (heldGate !== undefined && !(heldGate instanceof Gate)) {
            throw new DetailedError("Bad heldGate", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }
        if (heldGateOffset !== undefined && !(heldGateOffset instanceof Point)) {
            throw new DetailedError("Bad heldGateOffset", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }
        if (resizingGateSlot !== undefined && !(resizingGateSlot instanceof Point)) {
            throw new DetailedError("Bad resizingGateSlot", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }
        if ((heldGate !== undefined) !== (heldGateOffset !== undefined)) {
            throw new DetailedError("Inconsistent hold properties", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }
        if (heldGate !== undefined && this.resizingGateSlot !== undefined) {
            throw new DetailedError("Holding AND resizing", {pos, heldGate, heldGateOffset, resizingGateSlot});
        }

        /** @type {undefined|!Point} */
        this.pos = pos;
        /** @type {undefined|!Gate} */
        this.heldGate = heldGate;
        /** @type {undefined|!Point} */
        this.heldGateOffset = heldGateOffset;
        /** @type {undefined|!Point} */
        this.resizingGateSlot = resizingGateSlot;
    }

    paintCursor(painter) {
        if (this.heldGate !== undefined) {
            painter.setDesiredCursor('move');
        } else if (this.resizingGateSlot !== undefined) {
            painter.setDesiredCursor('ns-resize');
        }
    }

    /**
     * @returns {!boolean}
     */
    isBusy() {
        return this.heldGate !== undefined || this.resizingGateSlot !== undefined;
    }

    /**
     * @returns {!Array.<!Point>}
     */
    hoverPoints() {
        return this.pos === undefined || this.isBusy() ? [] : [this.pos];
    }

    /**
     * @param {!Hand|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof Hand &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.pos, other.pos) &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGateOffset, other.heldGateOffset) &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGate, other.heldGate) &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.resizingGateSlot, other.resizingGateSlot);
    }

    /**
     * @returns {!string}
     */
    toString() {
        return `Hand(${describe({
            pos: this.pos,
            heldGate: this.heldGate,
            heldGateOffset: this.heldGateOffset,
            resizingGateSlot: this.resizingGateSlot
        })}`;
    }

    /**
     * @param {undefined|!Point} newPos
     * @returns {!Hand}
     */
    withPos(newPos) {
        return new Hand(newPos, this.heldGate, this.heldGateOffset, this.resizingGateSlot);
    }

    /**
     * @returns {!Hand}
     */
    withDrop() {
        return new Hand(this.pos, undefined, undefined, undefined);
    }

    /**
     * @param {!Gate} heldGate
     * @param {!Point} heldGateOffset
     * @returns {!Hand}
     */
    withHeldGate(heldGate, heldGateOffset) {
        return new Hand(this.pos, heldGate, heldGateOffset, undefined);
    }

    /**
     * @param {!Point} resizeSlot
     * @returns {!Hand}
     */
    withResizeSlot(resizeSlot) {
        return new Hand(this.pos, undefined, undefined, resizeSlot);
    }

    /**
     * @returns {!boolean}
     */
    needsContinuousRedraw() {
        return this.heldGate !== undefined && this.heldGate.isTimeBased();
    }
}
export default Hand;

Hand.EMPTY = new Hand(undefined, undefined, undefined, undefined);
