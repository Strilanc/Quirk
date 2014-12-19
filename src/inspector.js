//noinspection FunctionTooLongJS
new TripWire("start").run(function() {
    var canvas = document.getElementById("drawCanvas");
    if (canvas === null) {
        return;
    }

    // --- State ---
    /** @type {!Hand} */
    var handState = new Hand(null, null, null);
    var isTappingState = false;
    var wasTappingState = false;

    /** @type {!number} */
    var TOOLBOX_HEIGHT = 4 * (GATE_RADIUS * 2 + 2) - GATE_RADIUS;
    /** @type {!Toolbox} */
    var toolbox = new Toolbox(new Rect(0, 0, canvas.width, TOOLBOX_HEIGHT));

    /** @type {!Circuit} */
    var stableCircuit = new Circuit(new Rect(0, TOOLBOX_HEIGHT + 2, canvas.width, 201), 4, [], null);
    /** @type {!number} */
    var STATE_DRAW_Y = stableCircuit.area.bottom() + 2;
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
     * @param {!QuantumState} input
     * @param {!Array.<!GateColumn>} operations
     * @returns {!QuantumState}
     */
    var transformVectorWithOperations = function (input, operations) {
        return operations.reduce(function(a, e) { return e.transform(a); }, input);
    };

    /**
     * @param {!Painter} painter
     * @param {!Point} p
     * @param {!Gate} g
     */
    var drawFloatingGate = function (painter, p, g) {
        var b = Rect.centeredSquareWithRadius(p, GATE_RADIUS);
        g.paint(painter, b, false, true, null);
    };

    /**
     * @param {!Painter} painter
     * @param {!Circuit} circuit
     * @param {!int} takeCount
     * @param {!Rect} drawRect
     */
    var drawOutputAfter = function (painter, circuit, takeCount, drawRect) {
        var input = QuantumState.zero(circuit.numWires);
        var output = transformVectorWithOperations(input, take(circuit.columns, takeCount));
        circuit.drawRightHandPeekGates(painter);
        var gridRect = drawRect.skipLeft(14).skipTop(14);
        painter.paintColumnVectorAsGrid(output.columnVector, gridRect);
        painter.printCenteredText(WIRE_LABELLER(0), new Point(gridRect.x + gridRect.w/4, drawRect.y + 8));
        painter.printCenteredText(WIRE_LABELLER(1), new Point(gridRect.x + gridRect.w*2/4, drawRect.y + 6));
        painter.printCenteredText(WIRE_LABELLER(0), new Point(gridRect.x + gridRect.w*3/4, drawRect.y + 8));
        painter.printCenteredText(WIRE_LABELLER(2), new Point(drawRect.x + 6, gridRect.y + gridRect.h/4));
        painter.printCenteredText(WIRE_LABELLER(3), new Point(drawRect.x + 4, gridRect.y + gridRect.h*2/4));
        painter.printCenteredText(WIRE_LABELLER(2), new Point(drawRect.x + 6, gridRect.y + gridRect.h*3/4));
    };

    var ts = 0;
    var ticker = null;
    var redraw;
    /**
     * @param {!Circuit} circuit
     * @param {!boolean} isHoveringOverTimeBasedGate
     */
    var tickWhenAppropriate = function(circuit, isHoveringOverTimeBasedGate) {
        var shouldBeTicking = isHoveringOverTimeBasedGate || circuit.hasTimeBasedGates();
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
     * @param {!Painter} painter
     * @param {?{ col : !number, row : !number, isInsert: !boolean }} insertSite
     * @param {!Hand} hand
     */
    var drawHeld = function(painter, insertSite, hand) {
        if (hand.heldGateBlock === null || insertSite !== null) {
            return;
        }

        for (var k = 0; k < hand.heldGateBlock.gates.length; k++) {
            drawFloatingGate(
                painter,
                hand.pos.offsetBy(0, GATE_RADIUS*2*(k - hand.heldGateBlockOffset)),
                hand.heldGateBlock.gates[k]);
        }
    };

    /**
     * @param {!Painter} painter
     * @param {?{ col : !number, row : !number, isInsert : !boolean }} modificationPoint
     * @param {!Circuit} newCircuit
     * @param {!Hand} hand
     */
    var drawInsertSite = function(painter, modificationPoint, newCircuit, hand) {
        //if (modificationPoint !== null && hand.heldGateBlock !== null) {
        //    var xr = newCircuit.opRect(modificationPoint.col);
        //    painter.ctx.globalAlpha = 0.5;
        //    painter.fillRect(xr, heldHand === null ? "yellow" : "orange");
        //    painter.ctx.globalAlpha = 1;
        //}

        if (modificationPoint !== null) {
            var m = newCircuit.columns[modificationPoint.col].matrix();
            painter.paintMatrix(m, OPERATION_HINT_AREA);

            drawOutputAfter(painter, newCircuit, modificationPoint.col + 1, INTERMEDIATE_STATE_HINT_AREA);
        }
    };

    var redrawTrip = new TripWire("redraw_mark");
    redraw = redrawTrip.wrap(function () {
        var painter = new Painter(canvas.getContext("2d"));
        var circuit = stableCircuit;
        var hand = handState;

        painter.fillRect(new Rect(0, 0, canvas.width, canvas.height), "white");

        redrawTrip.mark("_");
        var modPt = circuit.findModificationIndex(hand);
        if (modPt !== null && hand.heldGateBlock === null && modPt.col >= circuit.columns.length) {
            modPt = null;
        }

        redrawTrip.mark("a");
        var candidateCircuit = circuit.withOpBeingAdded(modPt, hand);

        redrawTrip.mark("b");
        drawInsertSite(painter, modPt, candidateCircuit, hand);

        redrawTrip.mark("c");
        candidateCircuit.paint(painter, hand, isTappingState);

        redrawTrip.mark("d");
        drawOutputAfter(painter, candidateCircuit, candidateCircuit.columns.length, OUTPUT_STATE_HINT_AREA);

        redrawTrip.mark("e");
        toolbox.paint(painter, hand);

        redrawTrip.mark("f");
        drawHeld(painter, modPt, hand);

        if (wasTappingState && !isTappingState) {
            stableCircuit = candidateCircuit;
        }
        if (hand.heldGateBlock === null) {
            stableCircuit = stableCircuit.withoutEmpties();
        }

        redrawTrip.mark("g");

        var isOverTimeBasedGate = hand.pos !== null &&
            toolbox.findGateAt(notNull(hand.pos)) !== null &&
            toolbox.findGateAt(notNull(hand.pos)).gate.isTimeBased();
        var isHoldingTimeBasedGate = hand.heldGateBlock !== null &&
            !hand.heldGateBlock.gates.every(function(e) { return e === null || !e.isTimeBased()});

        tickWhenAppropriate(candidateCircuit, isOverTimeBasedGate || isHoldingTimeBasedGate);
    });

    //noinspection JSUnresolvedFunction
    var $canvas = $(canvas);
    var mouseUpdate = function (p, pressed) {
        handState = handState.withPos(new Point(
            p.pageX - $canvas.position().left,
            p.pageY - $canvas.position().top));
        if (isTappingState !== pressed) {
            wasTappingState = isTappingState;
            isTappingState = pressed;
        }
        redraw();

        if (!isTappingState) {
            handState = handState.withDrop();
        }
        if (isTappingState !== wasTappingState) {
            wasTappingState = isTappingState;
            redraw();
        }
    };
    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(function (p) {
        if (p.which !== 1) { return; }
        handState = toolbox.tryGrab(handState);
        mouseUpdate(p, true);
    });
    //noinspection JSUnresolvedFunction
    $(document).mouseup(function (p) {
        if (p.which !== 1) { return; }
        mouseUpdate(p, false);
    });
    //noinspection JSUnresolvedFunction
    $(document).mousemove(function (p) {
        if (isTappingState) {
            mouseUpdate(p, isTappingState);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mousemove(function (p) {
        if (!isTappingState) {
            mouseUpdate(p, isTappingState);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mouseleave(function () {
        mouseUpdate({offsetX: -100, offsetY: -100}, isTappingState);
    });
    redraw();
});
