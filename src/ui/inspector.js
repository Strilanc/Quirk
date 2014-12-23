/**
 * @param {!Rect} drawArea
 * @param {!Circuit} circuit
 * @param {!Toolbox} toolbox
 * @param {!Hand} hand
 *
 * @property {!Rect} drawArea
 * @property {!Circuit} circuit
 * @property {!Toolbox} toolbox
 * @property {!Hand} hand
 * @property {!Rect} outputStateHintArea
 * @property {!Rect} focusedOperationHintArea
 * @property {!Rect} focusedStateHintArea
 * @property {!Rect} cumulativeFocusedOperationHintArea
 * @property {!Rect} cumulativeOperationHintArea
 *
 * @constructor
 */
function Inspector(drawArea, circuit, toolbox, hand) {
    this.drawArea = drawArea;
    this.hand = hand;
    this.toolbox = toolbox;
    this.circuit = circuit;

    var remainder = drawArea.skipTop(this.circuit.area.bottom());
    this.outputStateHintArea = remainder.takeRight(remainder.h);
    this.cumulativeOperationHintArea = this.outputStateHintArea.
        withX(this.outputStateHintArea.x - this.outputStateHintArea.w - 5);
    this.focusedOperationHintArea = remainder.takeLeft(remainder.h);
    this.focusedStateHintArea = this.focusedOperationHintArea.withX(this.focusedOperationHintArea.right() + 5);
    this.cumulativeFocusedOperationHintArea = this.focusedStateHintArea.withX(this.focusedStateHintArea.right() + 5);
}

/**
 * @param {!int} numWires
 * @param {!Rect} drawArea
 * @returns {Inspector}
 */
Inspector.empty = function(numWires, drawArea) {
    var toolboxHeight = 4 * (GATE_RADIUS * 2 + 2) - GATE_RADIUS;

    return new Inspector(
        drawArea,
        new Circuit(drawArea.skipTop(toolboxHeight).takeTop(250), numWires, [], null, undefined),
        new Toolbox(drawArea.takeTop(toolboxHeight)),
        new Hand(null, null, null));
};

/**
 * @param {!Inspector|*} other
 * @returns {!boolean}
 */
Inspector.prototype.isEqualTo = function(other) {
    if (this === other) {
        return true;
    }
    return other instanceof Inspector &&
        this.drawArea.isEqualTo(other.drawArea) &&
        this.circuit.isEqualTo(other.circuit) &&
        this.toolbox.isEqualTo(other.toolbox) &&
        this.hand.isEqualTo(other.hand);
};

/**
 * @param {!Painter} painter
 * @private
 */
Inspector.prototype.paintOutput = function(painter) {
    // Wire probabilities
    this.circuit.drawRightHandPeekGates(painter);

    // State amplitudes
    painter.paintQuantumStateAsLabelledGrid(
        this.circuit.getOutput(),
        this.outputStateHintArea,
        this.circuit.getLabels());

    painter.paintMatrix(
        this.circuit.getCumulativeOperationUpToBefore(this.circuit.columns.length),
        this.cumulativeOperationHintArea);
};

/**
 * @param {!Painter} painter
 * @private
 */
Inspector.prototype.paintFocus = function(painter) {
    if (this.hand.pos === null) {
        return;
    }

    var possibleFocusedColumn = this.circuit.findExistingOpColumnAt(notNull(this.hand.pos));
    if (possibleFocusedColumn === null) {
        return;
    }

    var c = notNull(possibleFocusedColumn);

    // Highlight the column
    painter.ctx.globalAlpha = 0.75;
    painter.fillRect(this.circuit.opRect(c), "yellow");
    painter.ctx.globalAlpha = 1;

    painter.paintQuantumStateAsLabelledGrid(
        this.circuit.scanStates()[c + 1],
        this.focusedStateHintArea,
        this.circuit.getLabels());

    painter.paintMatrix(
        this.circuit.columns[c].matrix(),
        this.focusedOperationHintArea);

    painter.paintMatrix(
        this.circuit.getCumulativeOperationUpToBefore(c + 1),
        this.cumulativeFocusedOperationHintArea);
};

Inspector.prototype.paint = function(painter) {
    this.paintFocus(painter);
    this.circuit.paint(painter, this.hand);
    this.paintOutput(painter);
    this.toolbox.paint(painter, this.hand);
    this.paintHand(painter);
};

/**
 * @param {!Painter} painter
 * @private
 */
Inspector.prototype.paintHand = function(painter) {
    if (this.hand.pos === null || this.hand.heldGateBlock === null) {
        return;
    }

    var dh = this.circuit.getWireSpacing();
    for (var k = 0; k < this.hand.heldGateBlock.gates.length; k++) {
        var p = this.hand.pos.offsetBy(0, dh * (k - this.hand.heldGateBlockOffset));
        var r = Rect.centeredSquareWithRadius(p, GATE_RADIUS);
        var g = this.hand.heldGateBlock.gates[k];
        g.paint(painter, r, false, true, null);
    }
};

/**
 * @returns {!Inspector}
 */
Inspector.prototype.grab = function() {
    var hand = this.hand;
    var circuit = this.circuit;

    hand = this.toolbox.tryGrab(hand);
    var x = circuit.tryGrab(hand);
    hand = x.newHand;
    circuit = x.newCircuit;

    return new Inspector(
        this.drawArea,
        circuit,
        this.toolbox,
        hand);
};

/**
 * @param {!Circuit} circuit
 * @returns {!Inspector}
 */
Inspector.prototype.withCircuit = function(circuit) {
    return new Inspector(this.drawArea, circuit, this.toolbox, this.hand);
};

/**
 * @param {!Hand} hand
 * @returns {!Inspector}
 */
Inspector.prototype.withHand = function(hand) {
    return new Inspector(this.drawArea, this.circuit, this.toolbox, hand);
};

/**
 * @returns {!Inspector}
 */
Inspector.prototype.drop = function() {
    var p = this.previewDrop();
    return p.
        withCircuit(p.circuit.withoutEmpties()).
        withHand(p.hand.withDrop());
};

/**
 * @returns {!Inspector}
 */
Inspector.prototype.previewDrop = function() {
    if (this.hand.heldGateBlock === null) {
        return this;
    }

    var hand = this.hand;
    var circuit = this.circuit;

    var modPt = circuit.findModificationIndex(hand);
    if (modPt !== null && hand.heldGateBlock === null && modPt.col >= circuit.columns.length) {
        modPt = null;
    }
    if (modPt === null) {
        return this;
    }

    circuit = circuit.withOpBeingAdded(modPt, hand);
    hand = hand.withDrop();

    return new Inspector(
        this.drawArea,
        circuit,
        this.toolbox,
        hand);
};

Inspector.prototype.needsContinuousRedraw = function() {
    return this.previewDrop().circuit.hasTimeBasedGates() ||
        this.toolbox.needsContinuousRedrawAt(this.hand);
};

Inspector.prototype.move = function(p) {
    return new Inspector(
        this.drawArea,
        this.circuit,
        this.toolbox,
        this.hand.withPos(p));
};
