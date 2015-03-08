//import Util from "src/base/Util.js"
//
//class Hand {
//    /**
//     * @param {?Point} pos
//     * @param {?GateBlock} heldGateBlock
//     * @param {?int} heldGateBlockOffset
//     *
//     * @property {?Point} pos
//     * @property {?GateBlock} heldGateBlock
//     * @property {?int} heldGateBlockOffset
//     *
//     * @constructor
//     */
//    constructor(pos, heldGateBlock, heldGateBlockOffset) {
//        Util.need(pos === null || pos instanceof Point, "pos isa ?Point");
//        Util.need((heldGateBlock === null) === (heldGateBlockOffset === null), "heldGateBlock iff heldGateBlockOffset");
//        this.heldGateBlock = heldGateBlock;
//        this.heldGateBlockOffset = heldGateBlockOffset;
//        this.pos = pos;
//    }
//
//    /**
//     * @param {!Rect} rect
//     * @returns {!boolean}
//     */
//    isHoveringIn(rect) {
//        return this.pos !== null && this.heldGateBlock === null && rect.containsPoint(Util.notNull(this.pos));
//    };
//
//    /**
//     * @param {!Painter} painter
//     * @param {!Rect} rect
//     * @param {!string} text
//     */
//    paintToolTipIfHoveringIn(painter, rect, text) {
//        if (this.isHoveringIn(rect)) {
//            painter.strokeRect(rect, Config.TOOLTIP_HIGHLIGHT_STROKE_COLOR, 3);
//            painter.paintTooltip(text, Util.notNull(this.pos), rect);
//        }
//    };
//
//    /**
//     *
//     * @param {!Hand|*} other
//     * @returns {!boolean}
//     */
//    isEqualTo(other) {
//        if (this === other) {
//            return true;
//        }
//        return other instanceof Hand &&
//            CUSTOM_IS_EQUAL_TO_EQUALITY(this.pos, other.pos) &&
//            this.heldGateBlockOffset === other.heldGateBlockOffset &&
//            CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGateBlock, other.heldGateBlock);
//    };
//
//    toString() {
//        return "pos: " + this.pos + ", holding: " + this.heldGateBlock;
//    };
//
//    /**
//     * @param {?Point} newPos
//     * @returns {!Hand}
//     */
//    withPos(newPos) {
//        return new Hand(newPos, this.heldGateBlock, this.heldGateBlockOffset);
//    };
//
//    /**
//     * @returns {!Hand}
//     */
//    withDrop() {
//        return new Hand(this.pos, null, null);
//    };
//
//    /**
//     * @param {!GateBlock} gateBlock
//     * @param {!int} holdOffset
//     * @returns {!Hand}
//     */
//    withHeldGate(gateBlock, holdOffset) {
//        return new Hand(this.pos, gateBlock, holdOffset);
//    };
//}
//
//Hand.EMPTY = new Hand(null, null, null);
