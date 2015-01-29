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
    var toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;

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

Inspector.prototype.toString = function() {
    return "Inspector(drawArea: " + this.drawArea +
        ", circuit: " + this.circuit +
        ", toolbox: " + this.toolbox +
        ", hand: " + this.hand + ")";
};

/**
 * @param {!number} time
 * @param {!Painter} painter
 * @private
 */
Inspector.prototype.paintOutput = function(painter, time) {
    // Wire probabilities
    this.circuit.drawRightHandPeekGates(painter, time);

    //var factors = this.circuit.getOutput().contiguousFactorization();
    //for (var i = 0; i < factors.length; i++) {
    //    painter.paintQuantumStateAsGrid(factors[i], this.focusedStateHintArea.leftHalf().topHalf().withX(i * this.focusedOperationHintArea.w*0.6));
    //}

    // State amplitudes
    painter.paintQuantumStateAsLabelledGrid(
        this.circuit.getOutput(time),
        this.outputStateHintArea,
        this.circuit.getLabels());

    painter.paintMatrix(
        this.circuit.getCumulativeOperationUpToBefore(this.circuit.columns.length, time),
        this.cumulativeOperationHintArea,
        this.hand);

    //var _ = 0;
    //var X = 0;
    //painter.paintDisalloweds(
    //    Matrix.square([
    //        // 1  0  1  0  1  0  1  0  1  0  1  0  1  0  1
    //        // 0  1  1  0  0  1  1  0  0  1  1  0  0  1  1
    //        // 0  0  0  1  1  1  1  0  0  0  0  1  1  1  1
    //        // 0  0  0  0  0  0  0  1  1  1  1  1  1  1  1
    //        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _
    //    ]),
    //    this.cumulativeOperationHintArea);
};

/**
 * @param {!Painter} painter
 * @param {!number} time
 * @private
 */
Inspector.prototype.paintFocus = function(painter, time) {
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
        this.circuit.scanStates(time)[c + 1],
        this.focusedStateHintArea,
        this.circuit.getLabels());

    painter.paintMatrix(
        this.circuit.columns[c].matrixAt(time),
        this.focusedOperationHintArea);

    painter.paintMatrix(
        this.circuit.getCumulativeOperationUpToBefore(c + 1, time),
        this.cumulativeFocusedOperationHintArea);
};

/**
 * @param {!Painter} painter
 * @param {!number} time
 */
Inspector.prototype.paint = function(painter, time) {
    // Clear
    painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

    this.paintFocus(painter, time);
    this.circuit.paint(painter, this.hand, time);
    this.paintOutput(painter, time);
    this.toolbox.paint(painter, this.hand, time);
    this.paintHand(painter, time);
};

/**
 * @param {!Painter} painter
 * @param {!number} time
 * @private
 */
Inspector.prototype.paintHand = function(painter, time) {
    if (this.hand.pos === null || this.hand.heldGateBlock === null) {
        return;
    }

    var dh = this.circuit.getWireSpacing();
    for (var k = 0; k < this.hand.heldGateBlock.gates.length; k++) {
        var p = this.hand.pos.offsetBy(0, dh * (k - this.hand.heldGateBlockOffset));
        var r = Rect.centeredSquareWithRadius(p, Config.GATE_RADIUS);
        var g = this.hand.heldGateBlock.gates[k];
        g.paint(painter, r, false, true, time, null);
    }
};

/**
 *
 * @param {!Painter} painter
 * @param {!function(!number)} progressCallback
 * @param {!function(!string)} urlCallback
 */
Inspector.prototype.captureCycle = function(painter, progressCallback, urlCallback) {
    //noinspection JSUnresolvedFunction
    var gif = new GIF({
        workers: 2,
        quality: 10
    });
    for (var t = 0.001; t < 1; t += 0.02) {
        this.paint(painter, t);
        gif.addFrame(painter.canvas,  {copy: true, delay: 50});
        if (!this.needsContinuousRedraw()) {
            break;
        }
    }
    gif.on('progress', progressCallback);
    gif.on('finished', function(blob) {
        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
        urlCallback(URL.createObjectURL(blob));
    });
    gif.render();
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

Inspector.prototype.exportCircuit = function() {
    return {
        custom_gates: [],
        wire_count: this.circuit.numWires,
        circuit_columns: this.circuit.columns.map(arg1(GateColumn.prototype.toJson))
    };
};

/**
 * @param {!string} text
 * @returns {!Inspector}
 */
Inspector.prototype.withImportedCircuit = function(text) {
    var json = JSON.parse(text);
    var wireCount = forceGetProperty(json, "wire_count");
    if (!isInt(wireCount) || wireCount < 1 || wireCount > Config.MAX_WIRE_COUNT) {
        throw new Error("wire_count must be an int between 1 and " + Config.MAX_WIRE_COUNT);
    }

    var columns = forceGetProperty(json, "circuit_columns");
    if (!Array.isArray(columns)) {
        throw new Error("circuit_columns must be an array.");
    }

    var gateCols = columns.map(GateColumn.fromJson).map(function(e) {
        if (e.gates.length < wireCount) {
            return new GateColumn(e.gates.paddedWithTo(null, wireCount));
        }
        if (e.gates.length > wireCount) {
            return new GateColumn(e.gates.slice(0, wireCount));
        }
        return e;
    });

    return new Inspector(
        this.drawArea,
        new Circuit(
            this.circuit.area,
            wireCount,
            gateCols,
            null,
            this.circuit.wireLabeller),
        this.toolbox,
        Hand.EMPTY);
};
