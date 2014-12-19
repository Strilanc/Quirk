/**
 * @param {!Rect} area
 *
 * @property {!Rect} area
 *
 * @constructor
 */
function Toolbox(area) {
    this.area = area;
}

Toolbox.GATE_SPACING = 2;
Toolbox.GROUP_SPACING = 24 - Toolbox.GATE_SPACING;
Toolbox.GATE_SPAN = GATE_RADIUS * 2 + Toolbox.GATE_SPACING;
Toolbox.GROUP_SPAN = Toolbox.GATE_SPAN * 2 + Toolbox.GROUP_SPACING;
Toolbox.MARGIN_X = 5;
Toolbox.MARGIN_Y = 18;
Toolbox.BACK_COLOR = "#CCC";

/**
 * @param {!int} groupIndex
 * @param {!int} gateIndex
 * @returns {!Rect}
 */
Toolbox.prototype.groupedGateRect = function(groupIndex, gateIndex) {
    var dx = Math.floor(gateIndex / 3);
    var dy = gateIndex % 3;

    var x = this.area.x + Toolbox.MARGIN_X + dx * Toolbox.GATE_SPAN + groupIndex * Toolbox.GROUP_SPAN;
    var y = this.area.y + Toolbox.MARGIN_Y + dy * Toolbox.GATE_SPAN;

    return new Rect(x, y, GATE_RADIUS*2, GATE_RADIUS*2);
};

/**
 * @param {!int} groupIndex
 * @returns {!Point}
 */
Toolbox.prototype.groupLabelCenter = function(groupIndex) {
    var r = this.groupedGateRect(groupIndex, 0);
    return new Point(r.x + Toolbox.GATE_SPAN - Toolbox.GATE_SPACING/2, r.y - 10);
};

/**
 * @param {!Painter} painter
 * @param {!int} groupIndex
 * @param {!int} gateIndex
 */
Toolbox.prototype.paintHint = function(painter, groupIndex, gateIndex) {
    var gateRect = this.groupedGateRect(groupIndex, gateIndex);
    var gate = Gate.GATE_SET[groupIndex].gates[gateIndex];
    var paragraphHeight = (gate.description.split("\n").length + 5) * 16;
    var hintRect = new Rect(
        this.area.x + 50,
        gateRect.bottom() + 10,
        400,
        paragraphHeight + 4 * GATE_RADIUS + 35);

    painter.fillRect(hintRect);
    painter.printText(
        gate.name +
        "\n\n" +
        gate.description +
        "\n\n" +
        "Transition Matrix (input chooses column(s)):\n" +
        "  if OFF   if ON\n" +
        "\n" +
        "                            OFF output\n" +
        "\n" +
        "\n" +
        "                            ON output\n" +
        "\n" +
        "\n" +
        gate.matrix.toString(), new Point(this.area.x + 55, gateRect.bottom() + 25));
    painter.paintMatrix(
        gate.matrix,
        new Rect(this.area.x + 55, hintRect.bottom() - 4 * GATE_RADIUS, 4 * GATE_RADIUS, 4 * GATE_RADIUS));
    painter.strokeRect(hintRect);

    gate.paint(painter, gateRect, true, true, null);
};

/**
 *
 * @param {!Point} p
 *
 * @returns {?{groupIndex: !int, gateIndex: !int, gate: !Gate}}
 */
Toolbox.prototype.findGateAt = function(p) {
    for (var groupIndex = 0; groupIndex < Gate.GATE_SET.length; groupIndex++) {
        for (var gateIndex = 0; gateIndex < Gate.GATE_SET[groupIndex].gates.length; gateIndex++) {
            if (this.groupedGateRect(groupIndex, gateIndex).containsPoint(p)) {
                return {groupIndex: groupIndex, gateIndex: gateIndex, gate: Gate.GATE_SET[groupIndex].gates[gateIndex]};
            }
        }
    }
    return null;
};

/**
 * @param {!Painter} painter
 * @param {!Hand} hand
 */
Toolbox.prototype.paint = function (painter, hand) {
    painter.fillRect(this.area, Toolbox.BACK_COLOR);
    painter.strokeRect(this.area);

    for (var groupIndex = 0; groupIndex < Gate.GATE_SET.length; groupIndex++) {
        var group = Gate.GATE_SET[groupIndex];
        painter.printCenteredText(group.hint, this.groupLabelCenter(groupIndex));

        for (var gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
            var gate = group.gates[gateIndex];
            if (gate !== null) {
                gate.paint(painter, this.groupedGateRect(groupIndex, gateIndex), true, false, null);
            }
        }
    }

    if (hand.heldGateBlock === null && hand.pos !== null) {
        var f = this.findGateAt(notNull(hand.pos));
        if (f !== null) {
            this.paintHint(painter, f.groupIndex, f.gateIndex);
        }
    }
};

/**
 *
 * @param {!Hand} hand
 * @returns {!Hand} newHand
 */
Toolbox.prototype.tryGrab = function(hand) {
    if (hand.pos === null || hand.heldGateBlock !== null) {
        return hand;
    }

    var f = this.findGateAt(notNull(hand.pos));
    if (f === null) {
        return hand;
    }

    var gate = Gate.GATE_SET[f.groupIndex].gates[f.gateIndex];
    Gate.updateIfFuzzGate(gate);
    var gateBlock = gate === Gate.SWAP_HALF ? GateBlock.swap(0) : GateBlock.single(gate);
    return hand.withHeldGate(gateBlock, 0);
};
