import Util from "src/base/Util.js"
import Point from "src/base/Point.js"
import Gate from "src/ui/Gate.js"
import GateColumn from "src/ui/GateColumn.js"

class Hand {
    /**
     * @param {?Point} pos
     * @param {?GateColumn} heldGates
     * @param {?int} heldGatesGrabInset
     *
     * @property {?Point} pos
     * @property {?GateColumn} heldGates
     * @property {?int} heldGatesGrabInset
     *
     * @constructor
     */
    constructor(pos, heldGates, heldGatesGrabInset) {
        Util.need(pos === null || pos instanceof Point, "pos instanceof ?Point");
        Util.need((heldGates === null) === (heldGatesGrabInset === null), "heldGates iff heldGatesGrabInset");
        this.heldGates = heldGates;
        this.heldGatesGrabInset = heldGatesGrabInset;
        this.pos = pos;
    }

    isBusy() {
        return this.heldGates !== null;
    }

    hoverPoints() {
        return this.pos === null || this.isBusy() ? [] : [this.pos];
    }

    ///**
    // * @param {!Rect} rect
    // * @returns {!boolean}
    // */
    //isHoveringIn(rect) {
    //    //noinspection JSCheckFunctionSignatures
    //    return !hoverPoints().every(e => !rect.containsPoint(e));
    //};

    ///**
    // * @param {!Painter} painter
    // * @param {!Rect} rect
    // * @param {!string} text
    // */
    //paintToolTipIfHoveringIn(painter, rect, text) {
    //    if (this.isHoveringIn(rect)) {
    //        painter.strokeRect(rect, Config.TOOLTIP_HIGHLIGHT_STROKE_COLOR, 3);
    //        painter.paintTooltip(text, Util.notNull(this.pos), rect);
    //    }
    //};

    /**
     *
     * @param {!Hand|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof Hand &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.pos, other.pos) &&
            this.heldGatesGrabInset === other.heldGatesGrabInset &&
            Util.CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGates, other.heldGates);
    }

    toString() {
        return `pos: ${this.pos}, holding: ${this.heldGates}`;
    }

    /**
     * @param {?Point} newPos
     * @returns {!Hand}
     */
    withPos(newPos) {
        return new Hand(newPos, this.heldGates, this.heldGatesGrabInset);
    }

    /**
     * @returns {!Hand}
     */
    withDrop() {
        return new Hand(this.pos, null, null);
    }

    /**
     * @param {!GateColumn} heldGates
     * @param {!int} heldGatesGrabInset
     * @returns {!Hand}
     */
    withHeldGates(heldGates, heldGatesGrabInset=0) {
        return new Hand(this.pos, heldGates, heldGatesGrabInset);
    }
}
export default Hand;

Hand.EMPTY = new Hand(null, null, null);
