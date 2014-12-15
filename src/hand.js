/**
 * @param {?{x: !number, y: !number}} pos
 * @param {?GateBlock} heldGateBlock
 * @param {?int} heldGateBlockOffset
 *
 * @property {?GateBlock} heldGateBlock
 * @property {?int} heldGateBlockOffset
 *
 * @constructor
 */
function Hand(pos, heldGateBlock, heldGateBlockOffset) {
    this.heldGateBlock = heldGateBlock;
    this.heldGateBlockOffset = heldGateBlockOffset;
    this.pos = pos;
}

/**
 * @param {?{x: !number, y: !number}} newPos
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
