var canvas = document.getElementById("drawCanvas");
if (canvas !== null) {
    var numWires = 4;
    var numStates = 1 << numWires;

    var ctx = canvas.getContext("2d");
    var painter = new Painter(ctx);

    // --- Layout Constants ---
    var gateRadius = 25;
    var circuitOperationHorizontalSpacing = 10;
    /**
     * @type {GateColumn[]}
     */
    var circuitOperationColumns = [];

    var testVectorsTitleOffset = -20;
    var testVectorLabelOffset = -8;
    var testVectorSeparation = 3;

    var testVectorsY = 350;
    var testVectorsInterSpacing = 25;
    var testVectorsWidth = 200;

    var circuitRect = new Rect(0, 120, canvas.width, 201);
    var inputVectorsRect = new Rect(5, testVectorsY, testVectorsWidth / numStates, -1);
    var operationMatrixRect = new Rect(
        inputVectorsRect.x + inputVectorsRect.w + testVectorsInterSpacing,
        testVectorsY,
        testVectorsWidth - testVectorSeparation * (numStates - 1),
        testVectorsWidth - testVectorSeparation * (numStates - 1));
    var outputVectorsRect = new Rect(
        operationMatrixRect.x + operationMatrixRect.w + testVectorsInterSpacing,
        testVectorsY,
        testVectorsWidth / numStates,
        -1);
    var showOperationMatrixInline = false;
    var intermediateVectorsRect = inputVectorsRect;
    var inputTestVectorsCaption = "Test Inputs";
    var intermediatePostTestVectorsCaption = "States after Operation";
    var outputTestVectorsCaption = "Current Outputs";
    var effectOfOperationCaption = "Highlighted Operation";

// --- Math and Circuits ---
    /**
     * @param {Matrix} input
     * @param {GateColumn[]} operations
     * @returns {Matrix}
     */
    var transformVectorWithOperations = function (input, operations) {
        for (var i = 0; i < operations.length; i++) {
            input = operations[i].transform(input);
        }
        return input;
    };

// --- Define toolbox gate types ---
    var spinR = new Gate("R(t)", Matrix.identity(2), "Rotater", "");
    var spinX = new Gate("X(t)", Matrix.identity(2), "X Spinner", "");
    var spinY = new Gate("Y(t)", Matrix.identity(2), "Y Spinner", "");
    var spinZ = new Gate("Z(t)", Matrix.identity(2), "Z Spinner", "");
    var gateSet = [
        Gate.CONTROL,
        Gate.ANTI_CONTROL,
        Gate.PEEK,
        spinR,
        spinX,
        spinY,
        spinZ,
        Gate.DOWN,
        Gate.X,
        Gate.UP,
        Gate.RIGHT,
        Gate.Y,
        Gate.LEFT,
        Gate.COUNTER_CLOCKWISE,
        Gate.Z,
        Gate.CLOCKWISE,
        Gate.H,
        Gate.fromRotation(0, 0, 0.125)
    ];

// --- Layout Functions ---
    var wireIndexToY = function (i) {
        return circuitRect.y + (2 * i + 1) * circuitRect.h / numWires / 2;
    };
    var wireYToIndex = function (y) {
        var result = Math.round(((y - circuitRect.y) * 2 * numWires / circuitRect.h - 1) / 2);
        if (result < 0 || result >= numWires) return null;
        return result;
    };
    var operationIndexToX = function (index) {
        if (held !== null && held.col !== null) {
            if (index === held.col && circuitOperationColumns.length > 0) {
                index -= 0.5;
            }
            if (index > held.col) {
                index -= 1;
            }
        }
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        return s * (index + 1);
    };
    /**
     * @param {number} x
     * @param {number} y
     * @param {GateColumn[]} circuitCols
     * @returns {{ col : number, row : number, inExisting : boolean }}
     */
    var posToColumnIndexAndInsertSuggestion = function (x, y, circuitCols) {
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        var c = x / s - 0.5;
        var i = Math.floor(c);
        var j = wireYToIndex(y);
        if (j === null) {
            return null;
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
        if (isFree && isCentered) {
            return {col: i, row: j, inExisting: true};
        }

        var di = isAfter ? 1 : 0;
        return {col: i + di, row: j, inExisting: false};
    };

// --- State ---
    var latestMouseX = 0;
    var latestMouseY = 0;
    /**
     * @type {null|{ gate: Gate, col: (number|null), row: (number|null) }}
     */
    var held = null;
    var isTapping = false;
    var wasTapping = false;

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawFloatingGate = function (x, y, g) {
        var b = Rect.centeredSquareWithRadius(x, y, gateRadius);
        painter.fillRect(b, "orange");
        painter.strokeRect(b);
        drawGateSymbol(x, y, g);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawGateSymbol = function(x, y, g) {
        if (g.symbol === "\\∡") {
            painter.printCenteredText(g.symbol, x, y);
        } if (g.symbol === "\\⊹") {
            drawMatrix(Rect.centeredSquareWithRadius(x, y, gateRadius), g.matrix)
        } else if (g.symbol === "\\•") {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            if (g.matrix === Matrix.ANTI_CONTROL) {
                ctx.fillStyle = "white";
                ctx.strokeStyle = "black";
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = "black";
                ctx.fill();
            }
        } else {
            painter.printCenteredText(g.symbol, x, y);
        }
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawToolboxGate = function (x, y, g) {
        var b = Rect.centeredSquareWithRadius(x, y, gateRadius);
        if (b.containsPoint({x: latestMouseX, y: latestMouseY})) {
            if (isTapping && !wasTapping) {
                held = {
                    gate: g,
                    row: null,
                    col: null
                };
            }
            if (held === null) {
                var r = gateRadius;
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "white";
                ctx.fillRect(0, y + r + 15, 800, 800);
                ctx.globalAlpha = 1;

                painter.fillRect(b, "orange");
                painter.strokeRect(b);

                var r2 = new Rect(50, y + r + 10, 400, (g.description.split("\n").length + 5) * 16 + 4 * r + 35);
                painter.fillRect(r2);
                painter.strokeRect(r2);
                painter.printText(
                    g.name +
                    "\n\n" +
                    g.description +
                    "\n\n" +
                    "Transition Matrix (input chooses column(s)):\n" +
                    "    if OFF      if ON\n" +
                    "\n" +
                    "                                  OFF output\n" +
                    "\n" +
                    "\n" +
                    "                                  ON output\n" +
                    "\n" +
                    "\n" +
                    g.matrix.toString(), 50 + 5, y + r + 25);
                drawMatrix(new Rect(55, y + r + 15 + (g.description.split("\n").length + 5) * 16, 4 * r, 4 * r), g.matrix);
            } else {
                painter.fillRect(b);
                painter.strokeRect(b);
            }
        } else {
            painter.fillRect(b);
            painter.strokeRect(b);
        }
        drawGateSymbol(x, y, g);
    };

    /**
     * @param {GateColumn} gateColumn
     * @param {int} columnIndex
     */
    var drawColumnControlWires = function(gateColumn, columnIndex) {
        var nonNullGates = gateColumn.gates.filter(function(e) { return e !== null; });
        var controls = nonNullGates.filter(function(e) { return e.symbol === "\\•"; });

        var hasControls = controls.length > 0;
        var hasOthers = controls.length < nonNullGates.length;
        if (!hasControls || !hasOthers) {
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
        painter.strokeLine({x: x, y: wireIndexToY(minIndex)}, {x: x, y: wireIndexToY(maxIndex)});
    };

    /**
     * Returns the probability of controls on a column being satisfied and a wire being ON,
     * if that was measured.
     *
     * @param {GateColumn} gateColumn
     * @param {int} targetWire
     * @param {Matrix} columnState
     * @returns {{conditional: number, total: number, canDiffer: boolean}}
     */
    var measureGateColumnProbabilityOn = function (gateColumn, targetWire, columnState) {
        var expectedMask = 0;
        var requiredMask = 0;
        for (var i = 0; i < gateColumn.gates.length; i++) {
            if (gateColumn.gates[i] === Gate.CONTROL) {
                requiredMask |= 1 << i;
                expectedMask |= 1 << i;
            } else if (gateColumn.gates[i] === Gate.ANTI_CONTROL) {
                requiredMask |= 1 << i;
            }
        }
        return {
            conditional: measureConditionalProbability(targetWire, expectedMask, requiredMask, columnState),
            total: measureProbability(expectedMask | (1 << targetWire), requiredMask | (1 << targetWire), columnState),
            canDiffer: requiredMask != 0
        };
    };

    /**
     * @param {GateColumn} gateColumn
     * @param {int} columnIndex
     * @param {Matrix} columnState A complex column vector.
     */
    var drawCircuitOperation = function (gateColumn, columnIndex, columnState) {

        drawColumnControlWires(gateColumn, columnIndex);
        var x = operationIndexToX(columnIndex);

        for (var i = 0; i < gateColumn.gates.length; i++) {
            var cy = wireIndexToY(i);
            var b = Rect.centeredSquareWithRadius(x, cy, gateRadius);
            var gate = gateColumn.gates[i];
            if (gate === null) {
                continue;
            }

            var isHolding = held !== null && held.col === columnIndex && held.row === i;
            var canGrab = b.containsPoint({x: latestMouseX, y: latestMouseY}) && held === null && !isTapping;
            var didGrab = b.containsPoint({x: latestMouseX, y: latestMouseY}) && held === null && !wasTapping && isTapping;
            var highlightGate = isHolding || canGrab;
            var isNotControl = gate.symbol !== "\\•";
            var doDrawGateBox = isHolding || canGrab || isNotControl;
            if (doDrawGateBox) {
                painter.fillRect(b, highlightGate ? "orange" : "white");
                painter.strokeRect(b);
            }
            if (gate === Gate.PEEK) {
                var p = measureGateColumnProbabilityOn(gateColumn, i, columnState);
                drawProbabilityBox(b, p.conditional, p.total, p.canDiffer);
            } else {
                drawGateSymbol(x, cy, gate);
            }
            if (didGrab) {
                held = {gate: gate, col: null, row: null};
                circuitOperationColumns[columnIndex].gates[i] = null;
            }
        }
    };
    /**
     * @param {Matrix} inputState
     * @param {GateColumn[]} gateColumns
     */
    var drawCircuit = function (inputState, gateColumns) {
        for (var i = 0; i < numWires; i++) {
            var wireY = wireIndexToY(i);
            painter.printCenteredText("bit" + i + ":", circuitRect.x + 14, wireY);
            painter.strokeLine({x: circuitRect.x + 30, y: wireY}, {x: circuitRect.x + canvas.width, y: wireY});
        }
        for (var i2 = 0; i2 < gateColumns.length; i2++) {
            inputState = gateColumns[i2].matrix().times(inputState);
            drawCircuitOperation(gateColumns[i2], i2, inputState);
        }
    };

    /**
     * @param {Rect} rect
     * @param {number} conditional_probability
     * @param {number} intersection_probability
     * @param {boolean} can_differ
     */
    var drawProbabilityBox = function (rect, conditional_probability, intersection_probability, can_differ) {
        painter.fillRect(rect);
        painter.strokeRect(rect);
        if (!can_differ) {
            var w = rect.w * conditional_probability;
            painter.fillRect(rect.takeLeft(w), "gray");
            painter.printCenteredText((conditional_probability*100).toFixed(1) + "%", rect.center().x, rect.center().y);
        } else {
            if (isNaN(conditional_probability)) {
                ctx.beginPath();
                ctx.moveTo(rect.x, rect.y);
                ctx.lineTo(rect.x + rect.w, rect.y + rect.h/2);
                ctx.lineTo(rect.x, rect.y + rect.h/2);
                ctx.lineTo(rect.x, rect.y);
                ctx.fillStyle = "gray";
                ctx.fill();
                painter.strokeLine(rect.topLeft(), rect.centerRight());
                painter.printText(" p|c:N/A", rect.x + 2, rect.y + 15, undefined, 10);
            } else {
                var w1 = rect.w * conditional_probability;
                painter.fillRect(rect.topHalf().takeLeft(w1), "gray");
                painter.printText(" p|c:" + Math.round(conditional_probability*100) + "%", rect.x + 2, rect.y + 15, undefined, 10);
            }
            var w2 = rect.w * intersection_probability;
            painter.fillRect(rect.bottomHalf().takeLeft(w2), "gray");
            ctx.fillStyle = "black";
            ctx.fillText("p∧c:" + Math.round(intersection_probability*100) + "%", rect.x + 2, rect.y + rect.h/2 + 15);
        }
    };

    /**
     * @param {Rect} rect
     * @param {Complex} value
     */
    var drawComplex = function (rect, value) {
        if (value === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
            painter.fillRect(rect, "#444");
            return;
        }

        var c = rect.center();
        var len = value.abs();

        if (len <= 0.0001) {
            return;
        }

        // area magnitude
        painter.fillRect(rect.takeBottom(value.norm2() * rect.h), "orange");

        var isControl = value === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL;
        var r = rect.w / 2 * value.abs();
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isControl ? "#201000" : "yellow";
        ctx.strokeStyle = "gray";
        ctx.fill();
        ctx.stroke();
        painter.strokeLine(c, {x: c.x + rect.w / 2 * value.real, y: c.y - rect.h / 2 * value.imag});

        if (isControl) {
            painter.strokeLine(rect.topLeft(), rect.bottomRight());
        }
    };

    /**
     * @param {Rect} rect
     * @param {Matrix} matrix
     */
    var drawMatrix = function (rect, matrix) {
        var n = matrix.width();
        var w = rect.w / n;
        var h = rect.h / n;
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                drawComplex(new Rect(rect.x + w * i, rect.y + h * j, w, h), matrix.rows[j][i]);
            }
        }

        // draw borders
        ctx.beginPath();
        var r = rect.x + rect.w;
        var b = rect.y + rect.h;
        for (var k = 0; k <= n; k++) {
            var x = rect.x + w * k;
            var y = rect.y + h * k;
            ctx.moveTo(rect.x, y);
            ctx.lineTo(r, y);
            ctx.moveTo(x, b);
            ctx.lineTo(x, rect.y);
        }
        ctx.strokeStyle = "black";
        ctx.stroke();
    };

    /**
     * @param {Rect} rect
     * @param {Matrix} values A column vector.
     */
    var drawState = function (rect, values) {
        // draw values
        var h = rect.w;
        for (var i = 0; i < values.height(); i++) {
            var y = rect.y + h * i;
            drawComplex(new Rect(rect.x, y, rect.w, h), values.rows[i][0]);
        }

        // draw borders
        ctx.beginPath();
        var r = rect.x + rect.w;
        var b = rect.y + h * values.height();
        ctx.moveTo(rect.x, b);
        ctx.lineTo(rect.x, rect.y);
        for (var i2 = 0; i2 < values.height(); i2++) {
            var y2 = rect.y + h * i2;
            ctx.moveTo(rect.x, y2);
            ctx.lineTo(r, y2);
        }
        ctx.moveTo(rect.x, b);
        ctx.lineTo(r, b);
        ctx.lineTo(r, rect.y);
        ctx.strokeStyle = "black";
        ctx.stroke();
    };

    /**
     * @param {Rect} rect
     * @param {{label: String, vec: Matrix}[]} states
     * @param {string} label
     */
    var drawStates = function (rect, states, label) {
        painter.printCenteredText(label, rect.x + rect.w / 2, rect.y + testVectorsTitleOffset);

        var widthDelta = Math.min(50, (rect.w + testVectorSeparation) / states.length);
        var widthVector = widthDelta - testVectorSeparation;

        for (var i = 0; i < states.length; i++) {
            painter.printCenteredText(states[i].label, rect.x + i * widthDelta + widthVector / 2, rect.y + testVectorLabelOffset);
            drawState(new Rect(rect.x + i * widthDelta, rect.y, widthVector, rect.h), states[i].vec);
        }
    };

    /**
     * Determines the probability of a wire or wires having particular values, given a quantum state.
     *
     * Note that wire probabilities are not independent in general. Wires may be correlated.
     *
     * @param {int} wireExpectedMask The bits of this number determine the desired wire values.
     * @param {int} wireRequiredMask The set bits of this number determine which wire values to check.
     * @param {Matrix} state A complex column vector.
     */
    var measureProbability = function(wireExpectedMask, wireRequiredMask, state) {
        var t = 0;
        for (var i = 0; i < state.height(); i++) {
            if ((i & wireRequiredMask) == (wireExpectedMask & wireRequiredMask)) {
                t += state.rows[i][0].norm2();
            }
        }
        return t;
    };

    /**
     * @param {int} wireTarget
     * @param {int} wireExpectedMask
     * @param {int} wireRequiredMask
     * @param {Matrix} state
     */
    var measureConditionalProbability = function(wireTarget, wireExpectedMask, wireRequiredMask, state) {
        var t_off = 0;
        var t_on = 0;
        for (var i = 0; i < state.height(); i++) {
            if ((i & wireRequiredMask) == (wireExpectedMask & wireRequiredMask)) {
                if ((i & (1 << wireTarget)) != 0) {
                    t_on += state.rows[i][0].norm2();
                } else {
                    t_off += state.rows[i][0].norm2();
                }
            }
        }
        return t_on / (t_off + t_on);
    };

    /**
     * @param {number} x
     * @param {Matrix} outputState
     */
    var drawSingleWireProbabilities = function (x, outputState) {
        for (var i = 0; i < numWires; i++) {
            var p = measureProbability(1 << i, 1 << i, outputState);
            drawProbabilityBox(Rect.centeredSquareWithRadius(x + 25, wireIndexToY(i), gateRadius), p, p, false);
        }
    };

    /**
     * @param {Rect} rect
     * @param {GateColumn[]} operations
     * @param {string} label
     */
    var drawTestStates = function (rect, operations, label) {
        var inputs = makeInputVectors();
        var states = [];
        for (var i = 0; i < inputs.length; i++) {
            var output = transformVectorWithOperations(inputs[i].vec, operations);
            states.push({label: inputs[i].label, vec: output});
            drawSingleWireProbabilities(canvas.width - 55, output);
        }

        drawStates(rect, states, label);
    };

    var drawInputVectors = function () {
        drawStates(inputVectorsRect, makeInputVectors(), inputTestVectorsCaption);
    };

    /**
     * @param {GateColumn[]} operations
     */
    var drawOutputVectors = function (operations) {
        drawTestStates(outputVectorsRect, operations, outputTestVectorsCaption);
    };

    /**
     * @param {GateColumn[]} operations
     */
    var drawIntermediateVectors = function (operations) {
        drawTestStates(intermediateVectorsRect, operations, intermediatePostTestVectorsCaption);
    };

    var drawGateSet = function () {
        var r = new Rect(2, 2, gateSet.length * 75 + 25, 100);
        painter.fillRect(r, "gray");
        painter.strokeRect(r);
        painter.printCenteredText("Toolbox (drag gates onto circuit)", r.x + r.w / 2, 15);
        for (var i = 0; i < gateSet.length; i++) {
            drawToolboxGate(i * 40 + 50, 65, gateSet[i]);
        }
    };

    var redraw = function () {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var candidateNewCols = circuitOperationColumns.slice(0);
        for (var i = 0; i < candidateNewCols.length; i++) {
            candidateNewCols[i] = new GateColumn(candidateNewCols[i].gates.slice(0));
        }
        var insertSite = circuitRect.containsPoint({x: latestMouseX, y: latestMouseY})
            ? posToColumnIndexAndInsertSuggestion(latestMouseX, latestMouseY, candidateNewCols)
            : null;
        if (insertSite !== null && held === null && insertSite.col >= candidateNewCols.length) {
            insertSite = null;
        }

        // Add held operation into circuit
        if (insertSite !== null && held !== null) {
            if (!insertSite.inExisting) {
                while (candidateNewCols.length < insertSite.col) {
                    candidateNewCols.push(GateColumn.empty(numWires));
                }
                candidateNewCols.splice(insertSite.col, 0, GateColumn.empty(numWires));
                held.row = insertSite.row;
                held.col = insertSite.col;
            } else {
                held.row = null;
                held.col = null;
            }
            candidateNewCols[insertSite.col].gates[insertSite.row] = held.gate;
        }

        if (insertSite !== null && held === null) {
            var x1 = operationIndexToX(insertSite.col - 0.5);
            var x2 = operationIndexToX(insertSite.col + 0.5);
            ctx.fillStyle = held === null ? "yellow" : "orange";
            ctx.fillRect(x1, circuitRect.y, x2 - x1, circuitRect.h);
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(x2, circuitRect.y);
            ctx.lineTo(x2, circuitRect.y + circuitRect.h);
            ctx.strokeStyle = "gray";
            ctx.stroke();
        }

        drawCircuit(makeInputVectors()[0].vec, candidateNewCols);

        if (insertSite !== null) {
            if (showOperationMatrixInline) {
                operationMatrixRect.x = operationIndexToX(insertSite.col);
                operationMatrixRect.x += operationMatrixRect.x > operationMatrixRect.w + 75 ? -operationMatrixRect.w - 50 : 50;
            } else {
                painter.printCenteredText(effectOfOperationCaption, operationMatrixRect.x + operationMatrixRect.w / 2, operationMatrixRect.y + testVectorsTitleOffset);
            }
            var m = candidateNewCols[insertSite.col].matrix();
            drawMatrix(operationMatrixRect, m);

            drawIntermediateVectors(candidateNewCols.slice(0, insertSite.col + 1));
        } else {
            drawInputVectors();
        }

        drawOutputVectors(candidateNewCols);

        drawGateSet();

        if (held !== null && insertSite === null) {
            drawFloatingGate(latestMouseX, latestMouseY, held.gate);
        }

        if (insertSite !== null && held !== null && wasTapping && !isTapping) {
            circuitOperationColumns = candidateNewCols.filter(function(e) { return !e.isEmpty();});
        }
    };

    var mouseUpdate = function (p, pressed) {
        //noinspection JSUnresolvedFunction
        latestMouseX = p.pageX - $(canvas).position().left;
        //noinspection JSUnresolvedFunction
        latestMouseY = p.pageY - $(canvas).position().top;
        if (isTapping != pressed) {
            wasTapping = isTapping;
            isTapping = pressed;
        }
        redraw();

        if (!isTapping) {
            held = null;
        }
        if (isTapping != wasTapping) {
            wasTapping = isTapping;
            redraw();
        }
    };
    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(function (p) {
        if (p.which != 1) return;
        mouseUpdate(p, true);
    });
    //noinspection JSUnresolvedFunction
    $(document).mouseup(function (p) {
        if (p.which != 1) return;
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

    var ts = 0;
    /**
     * @returns {{label: string, vec: Matrix}[]}
     */
    var makeInputVectors = function () {
        var off = Matrix.col([1, 0]);
        return [{label: "", vec: off.tensorPower(numWires)}];
    };

    setInterval(function() {
        ts += 0.05;
        ts %= 2 * Math.PI;
        spinR.matrix = Matrix.square([
            Math.cos(ts), -Math.sin(ts),
            Math.sin(ts), Math.cos(ts)]);
        spinX.matrix = Matrix.fromRotation(ts / 2 / Math.PI, 0, 0);
        spinY.matrix = Matrix.fromRotation(0, ts / 2 / Math.PI, 0);
        spinZ.matrix = Matrix.fromRotation(0, 0, ts / 2 / Math.PI);
        redraw();
    }, 50);
    redraw();
}
