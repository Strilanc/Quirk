/** @type {!number} */
var GATE_RADIUS = 20;

//noinspection FunctionTooLongJS
new TripWire("start").try(function() {
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
     * @param {!Matrix} input
     * @param {!Array.<!GateColumn>} operations
     * @returns {!Matrix}
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
     * @param {!Point} p
     * @param {!Gate} g
     */
    var drawToolboxGate = function (painter, p, g) {
        var b = Rect.centeredSquareWithRadius(p, GATE_RADIUS);
        g.paint(painter, b, true, false, null);
    };

    /**
     * @param {!Painter} painter
     * @param {!Point} p
     * @param {!Gate} g
     * @param {!Hand} hand
     * @returns {!{isHoveringOverTimeBasedGate: !boolean, newHand: !Hand}}
     */
    var drawToolboxGateHintIfHovering = function (painter, p, g, hand) {
        var b = Rect.centeredSquareWithRadius(p, GATE_RADIUS);
        var newHand = hand;
        if (newHand.pos === null || !b.containsPoint(newHand.pos)) {
            return {isHoveringOverTimeBasedGate: false, newHand: newHand};
        }
        var isHoveringOverTimeBasedGate = g.isTimeBased();
        if (isTappingState && !wasTappingState) {
            newHand = newHand.withHeldGate(GateBlock.single(g), 0);
            Gate.updateIfFuzzGate(g);
        }
        if (newHand.heldGateBlock === null) {
            var r = GATE_RADIUS;

            painter.fillRect(b, "orange");
            painter.strokeRect(b);

            var r2 = new Rect(50, p.y + r + 10, 400, (g.description.split("\n").length + 5) * 16 + 4 * r + 35);
            painter.fillRect(r2);
            painter.strokeRect(r2);
            painter.printText(
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
            painter.paintMatrix(
                g.matrix,
                new Rect(55, p.y + r + 15 + (g.description.split("\n").length + 5) * 16, 4 * r, 4 * r));
        } else {
            painter.fillRect(b);
            painter.strokeRect(b);
        }
        g.paint(painter, b, true, true, null);
        return {isHoveringOverTimeBasedGate: isHoveringOverTimeBasedGate, newHand: newHand};
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
     * @param {!Painter} painter
     * @param {!Circuit} circuit
     * @param {!number} x
     * @param {!Matrix} outputState
     */
    var drawSingleWireProbabilities = function (painter, circuit, x, outputState) {
        for (var i = 0; i < circuit.numWires; i++) {
            var p = measureProbability(1 << i, 1 << i, outputState);
            painter.paintProbabilityBox(
                p,
                Rect.centeredSquareWithRadius(
                    new Point(x + 25, circuit.wireRect(i).center().y),
                    GATE_RADIUS));
        }
    };

    /**
     * @param {!Painter} painter
     * @param {!Circuit} circuit
     * @param {!int} takeCount
     * @param {!Rect} drawRect
     */
    var drawOutputAfter = function (painter, circuit, takeCount, drawRect) {
        var input = circuit.makeInputState();
        var output = transformVectorWithOperations(input, take(circuit.columns, takeCount));
        drawSingleWireProbabilities(painter, circuit, canvas.width - GATE_RADIUS*2 - 10, output);
        var gridRect = drawRect.skipLeft(14).skipTop(14);
        painter.paintColumnVectorAsGrid(output, gridRect);
        painter.printCenteredText(WIRE_LABELLER(0), {x: gridRect.x + gridRect.w/4, y: drawRect.y + 8});
        painter.printCenteredText(WIRE_LABELLER(1), {x: gridRect.x + gridRect.w*2/4, y: drawRect.y + 6});
        painter.printCenteredText(WIRE_LABELLER(0), {x: gridRect.x + gridRect.w*3/4, y: drawRect.y + 8});
        painter.printCenteredText(WIRE_LABELLER(2), {x: drawRect.x + 6, y: gridRect.y + gridRect.h/4});
        painter.printCenteredText(WIRE_LABELLER(3), {x: drawRect.x + 4, y: gridRect.y + gridRect.h*2/4});
        painter.printCenteredText(WIRE_LABELLER(2), {x: drawRect.x + 6, y: gridRect.y + gridRect.h*3/4});
    };

    /**
     * @param {!Painter} painter
     * @param {!Hand} oldHand
     * @return {!{isHoveringOverTimeBasedGate: !boolean, newHand: !Hand}}
     */
    var drawGateSet = function (painter, oldHand) {
        var newHand = oldHand;
        var backRect = new Rect(0, 0, canvas.width, TOOLBOX_HEIGHT);
        painter.fillRect(backRect, "#CCC");
        painter.strokeRect(backRect);
        var isHoveringOverTimeBasedGate = false;

        for (var i = 0; i < 2; i++) {
            for (var c = 0; c < Gate.GATE_SET.length; c++) {
                var col = Gate.GATE_SET[c];
                var x1 = c * (GATE_RADIUS * 4 + 22) + 50;
                var x2 = x1 + GATE_RADIUS * 2 + 2;
                if (i === 0) {
                    painter.printCenteredText(col.hint, {x: (x1 + x2) / 2, y: 10});
                }

                for (var r = 0; r < col.gates.length; r++) {
                    if (col.gates[r] === null) { continue; }
                    var dx = Math.floor(r / 3);
                    var dy = r % 3;
                    var xy = new Point(x1 + (GATE_RADIUS * 2 + 2) * dx, 18 + GATE_RADIUS + dy * (GATE_RADIUS * 2 + 2));
                    if (i === 0) {
                        drawToolboxGate(painter, xy, col.gates[r]);
                    } else {
                        var zz = drawToolboxGateHintIfHovering(painter, xy, col.gates[r], newHand);
                        newHand = zz.newHand;
                        isHoveringOverTimeBasedGate = isHoveringOverTimeBasedGate || zz.isHoveringOverTimeBasedGate;
                    }
                }
            }
        }
        return {isHoveringOverTimeBasedGate: isHoveringOverTimeBasedGate, newHand: newHand};
    };

    var ts = 0;
    var ticker = null;
    var redraw;
    /**
     * @param {!boolean} isHoveringOverTimeBasedGate
     */
    var tickWhenAppropriate = function(isHoveringOverTimeBasedGate) {
        var shouldBeTicking = isHoveringOverTimeBasedGate || stableCircuit.hasTimeBasedGates();
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
        if (hand.heldGateBlock !== null && insertSite === null) {
            for (var k = 0; k < hand.heldGateBlock.gates.length; k++) {
                drawFloatingGate(
                    painter,
                    hand.pos.offsetBy(0, GATE_RADIUS*2*(k - hand.heldGateBlockOffset)),
                    hand.heldGateBlock.gates[k]);
            }
        }
    };

    /**
     * @param {!Painter} painter
     * @param modificationPoint {?{ col : !number, row : !number, isInsert : !boolean }}
     * @param {!Circuit} newCircuit
     */
    var drawInsertSite = function(painter, modificationPoint, newCircuit) {
        //if (modificationPoint !== null && heldHand === null) {
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

    redraw = TripWire.wrap("redraw", function () {
        var painter = new Painter(canvas.getContext("2d"));
        var circuit = stableCircuit;
        var hand = handState;

        painter.fillRect(new Rect(0, 0, canvas.width, canvas.height), "white");

        var insertSite = circuit.findModificationIndex(hand);
        if (insertSite !== null && hand.heldGateBlock === null && insertSite.col >= circuit.columns.length) {
            insertSite = null;
        }

        var candidateCircuit = circuit.withOpBeingAdded(insertSite, hand);
        drawInsertSite(painter, insertSite, candidateCircuit);
        circuit.paint(painter, hand, isTappingState);
        drawOutputAfter(painter, candidateCircuit, candidateCircuit.columns.length, OUTPUT_STATE_HINT_AREA);
        drawHeld(painter, insertSite, hand);
        var zz = drawGateSet(painter, hand);
        handState = zz.newHand;
        var isHoveringOverTimeBasedGate = zz.isHoveringOverTimeBasedGate;

        if (wasTappingState && !isTappingState) {
            stableCircuit = candidateCircuit;
        }
        if (hand.heldGateBlock === null) {
            stableCircuit = stableCircuit.withoutEmpties();
        }

        tickWhenAppropriate(isHoveringOverTimeBasedGate);
    });

    //noinspection JSUnresolvedFunction
    var $canvas = $(canvas);
    var mouseUpdate = function (p, pressed) {
        handState = handState.withPos({
            x: p.pageX - $canvas.position().left,
            y: p.pageY - $canvas.position().top
        });
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
