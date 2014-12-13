var canvas = document.getElementById("drawCanvas");
if (canvas !== null) {
    /** @type {!int} */
    var numWires = 4;

    /**
     * @returns {!Matrix}
     */
    var makeInputVector = function () {
        return Matrix.col([1, 0]).tensorPower(numWires);
    };

    /** @type {!Painter} */
    var circuitPainter = new Painter(canvas.getContext("2d"));

    // --- State ---
    /** @type {!{x: !number, y: !number}} */
    var latestMousePos = {x: 0, y: 0};
    /** @type {?{ gateBlock: !GateBlock, holdIndex: !int, col: (?number), row: (?number) }} */
    var helds = null;
    var isTapping = false;
    var wasTapping = false;

    // --- Layout Constants ---
    /** @type {!number} */
    var gateRadius = 20;
    /** @type {!number} */
    var circuitOperationHorizontalSpacing = 10;
    /** @type {!Array.<!GateColumn>} */
    var circuitOperationColumns = [];

    /** @type {!number} */
    var TOOLBOX_HEIGHT = 4 * (gateRadius * 2 + 2) - gateRadius;

    /** @type {!Rect} */
    var CIRCUIT_AREA = new Rect(0, TOOLBOX_HEIGHT + 2, canvas.width, 201);
    /** @type {!number} */
    var STATE_DRAW_Y = CIRCUIT_AREA.bottom() + 2;
    /** @type {!number} */
    var STATE_DRAW_H = canvas.height - STATE_DRAW_Y;

    /** @type {!Rect} */
    var OPERATION_HINT_AREA = new Rect(
        0,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H
    );

    /** @type {!Rect} */
    var INTERMEDIATE_STATE_HINT_AREA = new Rect(
        OPERATION_HINT_AREA.right() + 5,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H
    );

    /** @type {!Rect} */
    var OUTPUT_STATE_HINT_AREA = new Rect(
        canvas.width - STATE_DRAW_H,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H
    );

    /**
     * @param {!int} i
     * @returns {!string}
     */
    var makeBitLabel = function (i) {
        if (i === 0) { return "A1"; }
        if (i === 1) { return "A2"; }
        if (i === 2) { return "B1"; }
        if (i === 3) { return "B2"; }
        return "bit" + i;
    };

// --- Math and Circuits ---
    /**
     * @param {!Matrix} input
     * @param {!Array.<!GateColumn>} operations
     * @returns {!Matrix}
     */
    var transformVectorWithOperations = function (input, operations) {
        for (var i = 0; i < operations.length; i++) {
            input = operations[i].transform(input);
        }
        return input;
    };

// --- Layout Functions ---
    /** @type {!boolean} */
    var isHoveringOverTimeBasedGate = false;

    /**
     * @param {!number} i
     * @returns {number}
     */
    var wireIndexToY = function (i) {
        return CIRCUIT_AREA.y + (2 * i + 1) * CIRCUIT_AREA.h / numWires / 2;
    };

    /**
     * @param {!number} y
     * @returns {?int}
     */
    var wireYToIndex = function (y) {
        var result = Math.round(((y - CIRCUIT_AREA.y) * 2 * numWires / CIRCUIT_AREA.h - 1) / 2);
        if (result < 0 || result >= numWires) {
            return null;
        }
        return result;
    };

    /**
     * @param {!number} index
     * @returns {number}
     */
    var operationIndexToX = function (index) {
        if (helds !== null && helds.col !== null) {
            if (index === helds.col && circuitOperationColumns.length > 0) {
                index -= 0.5;
            }
            if (index > helds.col) {
                index -= 1;
            }
        }
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        return s * (index + 1);
    };

    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!Array.<!GateColumn>} circuitCols
     * @returns {?{ col : !number, row : !number, inExisting : !boolean }}
     */
    var posToColumnIndexAndInsertSuggestion = function (x, y, circuitCols) {
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        var c = x / s - 0.5;
        var i = Math.floor(c);
        if (wireYToIndex(y) === null) {
            return null;
        }
        //noinspection JSValidateTypes
        /** @type {!int} */
        var j = wireYToIndex(y);
        if (helds !== null) {
            j -= helds.holdIndex;
            j = Math.max(0, j);
            j = Math.min(j, numWires - helds.gateBlock.gates.length);
        }
        if (i < 0) {
            return {col: 0, row: j, inExisting: false};
        }
        if (i >= circuitCols.length) {
            return {col: i, row: j, inExisting: false};
        }

        var dc = c % 1;
        var isBefore = dc <= 0.3;
        var isAfter = dc >= 0.7;
        var isCentered = !isBefore && !isAfter;
        var isFree = circuitCols[i].gates[j] === null;
        if (helds !== null) {
            for (var k = 1; k < helds.gateBlock.gates.length; k++) {
                if (circuitCols[i].gates[j + k] !== null) {
                    isFree = false;
                }
            }
        }
        if (isFree && isCentered) {
            return {col: i, row: j, inExisting: true};
        }

        var di = isAfter ? 1 : 0;
        return {col: i + di, row: j, inExisting: false};
    };

    /**
     * @param {!{x: !number, y: !number}} p
     * @param {!Gate} g
     */
    var drawFloatingGate = function (p, g) {
        var b = Rect.centeredSquareWithRadius(p, gateRadius);
        g.paint(circuitPainter, b, false, true, null);
    };

    /**
     * @param {!{x: !number, y: !number}} p
     * @param {!Gate} g
     */
    var drawToolboxGate = function (p, g) {
        var b = Rect.centeredSquareWithRadius(p, gateRadius);
        g.paint(circuitPainter, b, true, false, null);
    };

    var isNotTimeBasedGate = function (g) {
        return Gate.EVOLVING_GATES.indexOf(g) === -1;
    };

    var hasTimeBasedGates = function () {
        return !circuitOperationColumns.every(function (e) { return e.gates.every(isNotTimeBasedGate); });
    };

    /**
     * @param {!{x: !number, y: !number}} p
     * @param {!Gate} g
     */
    var drawToolboxGateHintIfHovering = function (p, g) {
        var b = Rect.centeredSquareWithRadius(p, gateRadius);
        if (!b.containsPoint(latestMousePos)) {
            return;
        }
        isHoveringOverTimeBasedGate = isHoveringOverTimeBasedGate || !isNotTimeBasedGate(g);
        if (isTapping && !wasTapping) {
            helds = {
                gateBlock: GateBlock.single(g),
                holdIndex: 0,
                row: null,
                col: null
            };
            Gate.updateIfFuzzGate(g);
        }
        if (helds === null) {
            var r = gateRadius;

            circuitPainter.fillRect(b, "orange");
            circuitPainter.strokeRect(b);

            var r2 = new Rect(50, p.y + r + 10, 400, (g.description.split("\n").length + 5) * 16 + 4 * r + 35);
            circuitPainter.fillRect(r2);
            circuitPainter.strokeRect(r2);
            circuitPainter.printText(
                g.name +
                "\n\n" +
                g.description +
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
                g.matrix.toString(), {x: 50 + 5, y: p.y + r + 25});
            circuitPainter.paintMatrix(
                g.matrix,
                new Rect(55, p.y + r + 15 + (g.description.split("\n").length + 5) * 16, 4 * r, 4 * r));
        } else {
            circuitPainter.fillRect(b);
            circuitPainter.strokeRect(b);
        }
        g.paint(circuitPainter, b, true, true, null);
    };

    /**
     * @param {!GateColumn} gateColumn
     * @param {!int} columnIndex
     */
    var drawColumnControlWires = function (gateColumn, columnIndex) {
        var hasControls = gateColumn.gates.indexOf(Gate.CONTROL) > -1;
        var hasAntiControls = gateColumn.gates.indexOf(Gate.ANTI_CONTROL) > -1;
        var hasSwaps = gateColumn.gates.indexOf(Gate.SWAP_HALF) > -1;

        if (!hasControls && !hasAntiControls && !hasSwaps) {
            return;
        }

        var minIndex;
        var maxIndex;
        for (var i = 0; i < gateColumn.gates.length; i++) {
            if (gateColumn.gates[gateColumn.gates.length - 1 - i] !== null) {
                minIndex = gateColumn.gates.length - 1 - i;
            }
            if (gateColumn.gates[i] !== null) {
                maxIndex = i;
            }
        }
        var x = operationIndexToX(columnIndex);
        circuitPainter.strokeLine({x: x, y: wireIndexToY(minIndex)}, {x: x, y: wireIndexToY(maxIndex)});
    };

    /**
     * Determines the probability of a wire or wires having particular values, given a quantum state.
     *
     * Note that wire probabilities are not independent in general. Wires may be correlated.
     *
     * @param {!int} wireExpectedMask The bits of this number determine the desired wire values.
     * @param {!int} wireRequiredMask The set bits of this number determine which wire values to check.
     * @param {!Matrix} state A complex column vector.
     */
    var measureProbability = function (wireExpectedMask, wireRequiredMask, state) {
        var t = 0;
        for (var i = 0; i < state.height(); i++) {
            if ((i & wireRequiredMask) === (wireExpectedMask & wireRequiredMask)) {
                t += state.rows[i][0].norm2();
            }
        }
        return t;
    };

    /**
     * @param {!int} columnIndex
     * @param {!int} i
     */
    var grabGateBlockAt = function(columnIndex, i) {
        var gateColumn = circuitOperationColumns[columnIndex];
        var hasTwoSwaps = gateColumn.gates.filter(function (e) { return e === Gate.SWAP_HALF; }).length === 2;
        //noinspection JSValidateTypes
        /** @type {!Gate} */
        var gate = gateColumn.gates[i];
        gateColumn.gates[i] = null;
        if (hasTwoSwaps && gate === Gate.SWAP_HALF) {
            var i2 = gateColumn.gates.indexOf(Gate.SWAP_HALF);
            gateColumn.gates[i2] = null;
            helds = {
                gateBlock: GateBlock.swap(Math.abs(i - i2)),
                holdIndex: Math.max(i - i2, 0),
                col: null,
                row: null
            };
        } else {
            helds = {
                gateBlock: GateBlock.single(gate),
                holdIndex: 0,
                col: null,
                row: null
            };
        }
    };

    /**
     * @param {!GateColumn} gateColumn
     * @param {!int} columnIndex
     * @param {!Matrix} columnState A complex column vector.
     */
    var drawCircuitOperation = function (gateColumn, columnIndex, columnState) {

        drawColumnControlWires(gateColumn, columnIndex);
        var x = operationIndexToX(columnIndex);

        for (var i = 0; i < gateColumn.gates.length; i++) {
            var cy = wireIndexToY(i);
            var b = Rect.centeredSquareWithRadius({x: x, y: cy}, gateRadius);

            if (gateColumn.gates[i] === null) {
                continue;
            }
            //noinspection JSValidateTypes
            /** @type {!Gate} */
            var gate = gateColumn.gates[i];

            var isHolding = helds !== null && helds.col === columnIndex && helds.row === i;
            var canGrab = b.containsPoint(latestMousePos) && helds === null && !isTapping;
            var didGrab = b.containsPoint(latestMousePos) && helds === null && !wasTapping && isTapping;
            var isHighlighted = canGrab || isHolding;
            gate.paint(circuitPainter, b, false, isHighlighted, new CircuitContext(gateColumn, i, columnState));
            if (didGrab) {
                grabGateBlockAt(columnIndex, i);
            }
        }
    };

    /**
     * @param {!Matrix} inputState
     * @param {!Array.<!GateColumn>} gateColumns
     */
    var drawCircuit = function (inputState, gateColumns) {
        for (var i = 0; i < numWires; i++) {
            var wireY = wireIndexToY(i);
            circuitPainter.printCenteredText(makeBitLabel(i) + ":", {x: CIRCUIT_AREA.x + 14, y: wireY});
            circuitPainter.strokeLine({x: CIRCUIT_AREA.x + 30, y: wireY}, {x: CIRCUIT_AREA.x + canvas.width, y: wireY});
        }
        for (var i2 = 0; i2 < gateColumns.length; i2++) {
            inputState = gateColumns[i2].matrix().times(inputState);
            drawCircuitOperation(gateColumns[i2], i2, inputState);
        }
    };

    /**
     * @param {!number} x
     * @param {!Matrix} outputState
     */
    var drawSingleWireProbabilities = function (x, outputState) {
        for (var i = 0; i < numWires; i++) {
            var p = measureProbability(1 << i, 1 << i, outputState);
            circuitPainter.paintProbabilityBox(p, Rect.centeredSquareWithRadius({x: x + 25, y: wireIndexToY(i)}, gateRadius));
        }
    };

    /**
     * @param {!Array.<!GateColumn>} operations
     * @param {!Rect} drawRect
     */
    var drawOutputAfter = function (operations, drawRect) {
        var input = makeInputVector();
        var output = transformVectorWithOperations(input, operations);
        drawSingleWireProbabilities(canvas.width - gateRadius*2 - 10, output);
        var gridRect = drawRect.skipLeft(14).skipTop(14);
        circuitPainter.paintColumnVectorAsGrid(output, gridRect);
        circuitPainter.printCenteredText(makeBitLabel(0), {x: gridRect.x + gridRect.w/4, y: drawRect.y + 8});
        circuitPainter.printCenteredText(makeBitLabel(1), {x: gridRect.x + gridRect.w*2/4, y: drawRect.y + 6});
        circuitPainter.printCenteredText(makeBitLabel(0), {x: gridRect.x + gridRect.w*3/4, y: drawRect.y + 8});
        circuitPainter.printCenteredText(makeBitLabel(2), {x: drawRect.x + 6, y: gridRect.y + gridRect.h/4});
        circuitPainter.printCenteredText(makeBitLabel(3), {x: drawRect.x + 4, y: gridRect.y + gridRect.h*2/4});
        circuitPainter.printCenteredText(makeBitLabel(2), {x: drawRect.x + 6, y: gridRect.y + gridRect.h*3/4});
    };

    var drawGateSet = function () {
        var backRect = new Rect(0, 0, canvas.width, TOOLBOX_HEIGHT);
        circuitPainter.fillRect(backRect, "#CCC");
        circuitPainter.strokeRect(backRect);

        for (var i = 0; i < 2; i++) {
            for (var c = 0; c < Gate.GATE_SET.length; c++) {
                var col = Gate.GATE_SET[c];
                var x1 = c * (gateRadius * 4 + 22) + 50;
                var x2 = x1 + gateRadius * 2 + 2;
                if (i === 0) {
                    circuitPainter.printCenteredText(col.hint, {x: (x1 + x2) / 2, y: 10});
                }

                for (var r = 0; r < col.gates.length; r++) {
                    if (col.gates[r] === null) { continue; }
                    var dx = Math.floor(r / 3);
                    var dy = r % 3;
                    var x = x1 + (gateRadius * 2 + 2) * dx;
                    var y = 18 + gateRadius + dy * (gateRadius * 2 + 2);
                    if (i === 0) {
                        drawToolboxGate({x: x, y: y}, col.gates[r]);
                    } else {
                        drawToolboxGateHintIfHovering({x: x, y: y}, col.gates[r]);
                    }
                }
            }
        }
    };

    var ts = 0;
    var ticker = null;
    var redraw;
    var tickWhenAppropriate = function() {
        var shouldBeTicking = isHoveringOverTimeBasedGate || hasTimeBasedGates();
        var isTicking = ticker !== null;
        if (isTicking === shouldBeTicking) {
            return;
        }
        if (shouldBeTicking) {
            ticker = setInterval(function() {
                ts += 0.01;
                ts %= 1;
                Gate.updateTimeGates(ts);
                redraw();
            }, 50);
        } else {
            clearInterval(ticker);
            ticker = null;
        }
    };

    /**
     * @param insertSite {?{ col : !number, row : !number, inExisting : !boolean }}
     * @param {!Array.<!GateColumn>} candidateNewCols
     */
    var addHeldOpIntoCircuit = function(insertSite, candidateNewCols) {
        if (insertSite === null || helds === null) {
            return;
        }

        if (insertSite.inExisting) {
            helds.row = null;
            helds.col = null;
        } else {
            while (candidateNewCols.length < insertSite.col) {
                candidateNewCols.push(GateColumn.empty(numWires));
            }
            candidateNewCols.splice(insertSite.col, 0, GateColumn.empty(numWires));
            helds.row = insertSite.row;
            helds.col = insertSite.col;
        }
        for (var j = 0; j < helds.gateBlock.gates.length; j++) {
            candidateNewCols[insertSite.col].gates[insertSite.row + j] = helds.gateBlock.gates[j];
        }
    };

    /**
     * @param insertSite {?{ col : !number, row : !number, inExisting : !boolean }}
     */
    var drawHeld = function(insertSite) {
        if (helds !== null && insertSite === null) {
            for (var k = 0; k < helds.gateBlock.gates.length; k++) {
                drawFloatingGate({x: latestMousePos.x, y: latestMousePos.y + gateRadius*2*k}, helds.gateBlock.gates[k]);
            }
        }
    };

    /**
     * @param insertSite {?{ col : !number, row : !number, inExisting : !boolean }}
     * @param {!Array.<!GateColumn>} candidateNewCols
     */
    var drawInsertSite = function(insertSite, candidateNewCols) {
        if (insertSite !== null && helds === null) {
            var x1 = operationIndexToX(insertSite.col - 0.5);
            var x2 = operationIndexToX(insertSite.col + 0.5);
            circuitPainter.ctx.fillStyle = helds === null ? "yellow" : "orange";
            circuitPainter.ctx.fillRect(x1, CIRCUIT_AREA.y, x2 - x1, CIRCUIT_AREA.h);
            circuitPainter.ctx.globalAlpha = 1;
            circuitPainter.ctx.beginPath();
            circuitPainter.ctx.moveTo(x2, CIRCUIT_AREA.y);
            circuitPainter.ctx.lineTo(x2, CIRCUIT_AREA.y + CIRCUIT_AREA.h);
            circuitPainter.ctx.strokeStyle = "gray";
            circuitPainter.ctx.stroke();
        }

        if (insertSite !== null) {
            var m = candidateNewCols[insertSite.col].matrix();
            circuitPainter.paintMatrix(m, OPERATION_HINT_AREA);

            drawOutputAfter(candidateNewCols.slice(0, insertSite.col + 1), INTERMEDIATE_STATE_HINT_AREA);
        }
    };

    redraw = function () {
        isHoveringOverTimeBasedGate = false;
        circuitPainter.fillRect(new Rect(0, 0, canvas.width, canvas.height), "white");

        var candidateNewCols = circuitOperationColumns.slice(0);
        for (var i = 0; i < candidateNewCols.length; i++) {
            candidateNewCols[i] = new GateColumn(candidateNewCols[i].gates.slice(0));
        }
        var insertSite = CIRCUIT_AREA.containsPoint(latestMousePos) ?
            posToColumnIndexAndInsertSuggestion(latestMousePos.x, latestMousePos.y, candidateNewCols)
            : null;
        if (insertSite !== null && helds === null && insertSite.col >= candidateNewCols.length) {
            insertSite = null;
        }

        addHeldOpIntoCircuit(insertSite, candidateNewCols);
        drawInsertSite(insertSite, candidateNewCols);
        drawCircuit(makeInputVector(), candidateNewCols);
        drawOutputAfter(candidateNewCols, OUTPUT_STATE_HINT_AREA);
        drawGateSet();
        drawHeld(insertSite);

        if (insertSite !== null && helds !== null && wasTapping && !isTapping) {
            circuitOperationColumns = candidateNewCols.filter(function (e) { return !e.isEmpty();});
        }

        tickWhenAppropriate();
    };

    var mouseUpdate = function (p, pressed) {
        //noinspection JSUnresolvedFunction
        latestMousePos.x = p.pageX - $(canvas).position().left;
        //noinspection JSUnresolvedFunction
        latestMousePos.y = p.pageY - $(canvas).position().top;
        if (isTapping !== pressed) {
            wasTapping = isTapping;
            isTapping = pressed;
        }
        redraw();

        if (!isTapping) {
            helds = null;
        }
        if (isTapping !== wasTapping) {
            wasTapping = isTapping;
            redraw();
        }
    };
    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(function (p) {
        if (p.which !== 1) { return; }
        mouseUpdate(p, true);
    });
    //noinspection JSUnresolvedFunction
    $(document).mouseup(function (p) {
        if (p.which !== 1) { return; }
        mouseUpdate(p, false);
    });
    //noinspection JSUnresolvedFunction
    $(document).mousemove(function (p) {
        if (isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mousemove(function (p) {
        if (!isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mouseleave(function () {
        mouseUpdate({offsetX: -100, offsetY: -100}, isTapping);
    });
    redraw();
}
