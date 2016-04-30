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
     */
    constructor(pos, heldGate, heldGateOffset) {
        if (pos !== undefined && !(pos instanceof Point)) {
            throw new DetailedError("Bad pos", {pos, heldGate, heldGateOffset});
        }
        if (heldGate !== undefined && !(heldGate instanceof Gate)) {
            throw new DetailedError("Bad heldGate", {pos, heldGate, heldGateOffset});
        }
        if (heldGateOffset !== undefined && !(heldGateOffset instanceof Point)) {
            throw new DetailedError("Bad heldGateOffset", {pos, heldGate, heldGateOffset});
        }
        if ((heldGate !== undefined) !== (heldGateOffset !== undefined)) {
            throw new DetailedError("Inconsistent hold properties", {pos, heldGate, heldGateOffset});
        }

        /**
         * @type {undefined|!Point}
         */
        this.pos = pos;
        /**
         * @type {undefined|!Gate}
         */
        this.heldGate = heldGate;
        /**
         * @type {undefined|!Point}
         */
        this.heldGateOffset = heldGateOffset;
    }

    /**
     * @returns {!boolean}
     */
    isBusy() {
        return this.heldGate !== undefined;
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
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGate, other.heldGate);
    }

    /**
     * @returns {!string}
     */
    toString() {
        return describe({pos: this.pos, heldGate: this.heldGate, heldGateOffset: this.heldGateOffset});
    }

    /**
     * @param {undefined|!Point} newPos
     * @returns {!Hand}
     */
    withPos(newPos) {
        return new Hand(newPos, this.heldGate, this.heldGateOffset);
    }

    /**
     * @returns {!Hand}
     */
    withDrop() {
        return new Hand(this.pos, undefined, undefined);
    }

    /**
     * @param {!Gate} heldGate
     * @param {!Point} heldGateOffset
     * @returns {!Hand}
     */
    withHeldGate(heldGate, heldGateOffset) {
        return new Hand(this.pos, heldGate, heldGateOffset);
    }

    /**
     * @returns {!boolean}
     */
    needsContinuousRedraw() {
        return this.heldGate !== undefined && this.heldGate.isTimeBased();
    }
}
export default Hand;

Hand.EMPTY = new Hand(undefined, undefined, undefined);
