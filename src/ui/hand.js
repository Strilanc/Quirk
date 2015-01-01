/**
 * @param {?Point} pos
 * @param {?GateBlock} heldGateBlock
 * @param {?int} heldGateBlockOffset
 *
 * @property {?Point} pos
 * @property {?GateBlock} heldGateBlock
 * @property {?int} heldGateBlockOffset
 *
 * @constructor
 */
function Hand(pos, heldGateBlock, heldGateBlockOffset) {
    need(pos === null || pos instanceof Point, "pos isa ?Point");
    need((heldGateBlock === null) === (heldGateBlockOffset === null), "heldGateBlock iff heldGateBlockOffset");
    this.heldGateBlock = heldGateBlock;
    this.heldGateBlockOffset = heldGateBlockOffset;
    this.pos = pos;
}

/**
 * @param {!Rect} rect
 * @returns {!boolean}
 */
Hand.prototype.isHoveringIn = function(rect) {
    return this.pos !== null && this.heldGateBlock === null && rect.containsPoint(notNull(this.pos));
};

/**
 * @param {!Painter} painter
 * @param {!Rect} rect
 * @param {!string} text
 */
Hand.prototype.paintToolTipIfHoveringIn = function(painter, rect, text) {
    if (this.isHoveringIn(rect)) {
        painter.strokeRect(rect, Config.TOOLTIP_HIGHLIGHT_STROKE_COLOR, 3);
        painter.paintTooltip(text, notNull(this.pos), rect);
    }
};

/**
 *
 * @param {!Hand|*} other
 * @returns {!boolean}
 */
Hand.prototype.isEqualTo = function(other) {
    if (this === other) {
        return true;
    }
    return other instanceof Hand &&
        CUSTOM_IS_EQUAL_TO_EQUALITY(this.pos, other.pos) &&
        this.heldGateBlockOffset === other.heldGateBlockOffset &&
        CUSTOM_IS_EQUAL_TO_EQUALITY(this.heldGateBlock, other.heldGateBlock);
};

Hand.prototype.toString = function() {
    return "pos: " + this.pos + ", holding: " + this.heldGateBlock;
};

/**
 * @param {?Point} newPos
 * @returns {!Hand}
 */
Hand.prototype.withPos = function(newPos) {
    return new Hand(newPos, this.heldGateBlock, this.heldGateBlockOffset);
};

/**
 * @returns {!Hand}
 */
Hand.prototype.withDrop = function() {
    return new Hand(this.pos, null, null);
};

/**
 * @param {!GateBlock} gateBlock
 * @param {!int} holdOffset
 * @returns {!Hand}
 */
Hand.prototype.withHeldGate = function(gateBlock, holdOffset) {
    return new Hand(this.pos, gateBlock, holdOffset);
};
