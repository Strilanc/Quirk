var canvas = document.getElementById("drawCanvas");
if (canvas !== null) {
    var numWires = 3;
    var numStates = Math.pow(2, numWires);
    var tau = Math.PI * 2;

    var ctx = canvas.getContext("2d");
    ctx.font = "12px Helvetica";

    // --- Layout Constants ---
    var makeRect = function (x, y, w, h) {
        return {x: x, y: y, w: w, h: h};
    };
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
    var testVectorsWidth = (canvas.width + testVectorsInterSpacing) / 4 - testVectorsInterSpacing;

    var circuitRect = makeRect(0, 120, canvas.width, 201);
    var inputVectorsRect = makeRect(5, testVectorsY, testVectorsWidth, -1);
    var operationMatrixRect = makeRect(
        inputVectorsRect.x + inputVectorsRect.w + testVectorsInterSpacing,
        testVectorsY,
        testVectorsWidth - testVectorSeparation * (numStates - 1),
        testVectorsWidth - testVectorSeparation * (numStates - 1));
    var outputVectorsRect = makeRect(
        operationMatrixRect.x + operationMatrixRect.w + testVectorsInterSpacing,
        testVectorsY,
        testVectorsWidth,
        -1);
    var showOperationMatrixInline = false;
    var intermediateVectorsRect = inputVectorsRect;
    if (numWires > 3) {
        circuitRect = makeRect(0, 120, 1400, 200);
        inputVectorsRect = makeRect(0, testVectorsY, 300, -1);
        operationMatrixRect = makeRect(0, 130, 200, 200);
        showOperationMatrixInline = true;
        outputVectorsRect = makeRect(350, testVectorsY, 300, -1);
        intermediateVectorsRect = inputVectorsRect;
    }
    var complexPhaseSweepRadius = 8;
    var showComplexPhaseHaveEnoughRadiusCutoff = 20;
    var inputTestVectorsCaption = "Test Inputs";
    var intermediatePostTestVectorsCaption = "States after Operation";
    var outputTestVectorsCaption = "Current Outputs";
    var effectOfOperationCaption = "Highlighted Operation";

// --- Inputs ---
    var entangledIndexVectorsInput = function () {
        var d = [];
        d.push(Complex.from(1));
        for (var i = 0; i < numStates - 1; i++) {
            d.push(Complex.ZERO);
        }

        var r = [];
        for (var j = 0; j < numStates / 2 - 1; j++) {
            r.push(null);
        }
        r.push({label: "0", v: Matrix.col(d)});
        for (var j2 = numStates / 2 + 1; j2 < numStates; j2++) {
            r.push(null);
        }
        return r;
    }();

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
    var gateSet = [
        Gate.CONTROL,
        Gate.ANTI_CONTROL,
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
    var makeRectRadius = function (x, y, r) {
        return makeRect(x - r, y - r, 2 * r, 2 * r);
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

    var fillRect = function (rect, fill) {
        ctx.fillStyle = fill || "white";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    };

    var drawRect = function (rect, fill) {
        ctx.strokeStyle = "black";
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        fillRect(rect, fill);
    };

    var drawParagraph = function (x, y, paragraph) {
        ctx.fillStyle = "black";
        var lines = paragraph.split("\n");
        for (var i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * 16);
        }
    };
    var drawCenteredString = function (x, y, text) {
        ctx.fillStyle = "black";
        var s = ctx.measureText(text);
        ctx.fillText(text, x - s.width / 2, y + 5);
    };
    var drawLine = function (x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "black";
        ctx.stroke();
    };
    var rectContainsMouse = function (b) {
        var x = latestMouseX;
        var y = latestMouseY;
        return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
    };
    var drawFloatingGate = function (x, y, g) {
        var b = makeRectRadius(x, y, gateRadius);
        drawRect(b, "orange");
        drawGateSymbol(x, y, g);
    };
    var drawGateSymbol = function(x, y, g) {
        if (g.symbol === "\\⊹") {
            drawMatrix(makeRectRadius(x, y, gateRadius), g.matrix)
        } else if (g.symbol === "\\•") {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            if (g.matrix === Matrix.ANTI_CONTROL_SYGIL) {
                ctx.fillStyle = "white";
                ctx.strokeStyle = "black";
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = "black";
                ctx.fill();
            }
        } else {
            drawCenteredString(x, y, g.symbol);
        }
    };
    var drawToolboxGate = function (x, y, g) {
        var b = makeRectRadius(x, y, gateRadius);
        if (rectContainsMouse(b)) {
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

                drawRect(b, "orange");

                drawRect(makeRect(50, y + r + 10, 400, (g.description.split("\n").length + 5) * 16 + 4 * r + 35));
                drawParagraph(50 + 5, y + r + 25,
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
                    g.matrix.toString());
                drawMatrix(makeRect(55, y + r + 15 + (g.description.split("\n").length + 5) * 16, 4 * r, 4 * r), g.matrix);
            } else {
                drawRect(b);
            }
        } else {
            drawRect(b);
        }
        drawGateSymbol(x, y, g);
    };

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
        drawLine(x, wireIndexToY(minIndex), x, wireIndexToY(maxIndex));
    };

    /**
     * @param {GateColumn} gateColumn
     * @param {number} columnIndex
     */
    var drawCircuitOperation = function (gateColumn, columnIndex) {

        drawColumnControlWires(gateColumn, columnIndex);
        var x = operationIndexToX(columnIndex);

        for (var i = 0; i < gateColumn.gates.length; i++) {
            var cy = wireIndexToY(i);
            var b = makeRectRadius(x, cy, gateRadius);
            var gate = gateColumn.gates[i];
            if (gate === null) {
                continue;
            }

            var isHolding = held !== null && held.col === columnIndex && held.row === i;
            var canGrab = rectContainsMouse(b) && held === null && !isTapping;
            var didGrab = rectContainsMouse(b) && held === null && !wasTapping && isTapping;
            var highlightGate = isHolding || canGrab;
            var isNotControl = gate.symbol !== "\\•";
            var doDrawGateBox = isHolding || canGrab || isNotControl;
            if (doDrawGateBox) {
                drawRect(b, highlightGate ? "orange" : null);
            }
            drawGateSymbol(x, cy, gate);
            if (didGrab) {
                held = {gate: gate, col: null, row: null};
                circuitOperationColumns[columnIndex].gates[i] = null;
            }
        }
    };
    /**
     * @param {GateColumn[]} ops
     */
    var drawCircuit = function (ops) {
        for (var i = 0; i < numWires; i++) {
            var wireY = wireIndexToY(i);
            drawCenteredString(circuitRect.x + 14, wireY, "bit" + i + ":");
            drawLine(circuitRect.x + 30, wireY, circuitRect.x + canvas.width, wireY);
        }
        for (var i2 = 0; i2 < ops.length; i2++) {
            drawCircuitOperation(ops[i2], i2);
        }
    };

    var drawComplex = function (rect, value) {
        if (value === Matrix.__IDENTITY_ZERO_SYGIL_COMPLEX) {
            fillRect(rect, "#444");
            return;
        }

        var x = rect.x + rect.w / 2;
        var y = rect.y + rect.h / 2;
        var len = value.abs();

        if (len <= 0.0001) {
            return;
        }

        // area magnitude
        var h = len * (rect.h - 1);
        var w = len * (rect.w - 1);
        var isControl = value === Matrix.__CONTROL_SYGIL_COMPLEX;
        ctx.fillStyle = isControl ? "#201000" : "orange";
        ctx.fillRect(Math.round(rect.x + (rect.w - w) / 2), Math.round(rect.y + (rect.h - h) / 2), w, h);
        if (isControl) {
            drawLine(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
        }

        // angle sweep
        if (rect.w / 2 > showComplexPhaseHaveEnoughRadiusCutoff && (value.real < 0 || Math.abs(value.imag) > 0.0001)) {
            var theta = -value.phase();
            if (theta <= -tau / 2) theta += tau;
            if (theta > tau / 2 - 0.001) theta -= tau;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, complexPhaseSweepRadius, Math.min(0, theta), Math.max(0, theta));
            ctx.strokeStyle = "black";
            ctx.fillStyle = "yellow";
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fill();
        }

        // arrow body
        drawLine(x, y, x + rect.w / 2.2 * value.real / len, y - rect.h / 2.2 * value.imag / len);
    };

    var drawMatrix = function (rect, matrix) {
        var n = matrix.width();
        var w = rect.w / n;
        var h = rect.h / n;
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                drawComplex(makeRect(rect.x + w * i, rect.y + h * j, w, h), matrix.rows[j][i]);
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

    var drawState = function (rect, values) {
        // draw values
        var h = rect.w;
        for (var i = 0; i < values.height(); i++) {
            var y = rect.y + h * i;
            drawComplex(makeRect(rect.x, y, rect.w, h), values.rows[i][0]);
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

    var drawStates = function (rect, states, label, highlight) {
        drawCenteredString(rect.x + rect.w / 2, rect.y + testVectorsTitleOffset, label + (highlight ? "✓" : ""));

        var widthDelta = (rect.w + testVectorSeparation) / states.length;
        var widthVector = widthDelta - testVectorSeparation;

        for (var i = 0; i < states.length; i++) {
            if (states[i] === null) continue;
            drawCenteredString(rect.x + i * widthDelta + widthVector / 2, rect.y + testVectorLabelOffset, states[i].label);
            drawState(makeRect(rect.x + i * widthDelta, rect.y, widthVector, rect.h), states[i].v);
        }
    };

    var drawTestStates = function (rect, operations, label) {
        var states = [];
        for (var i = 0; i < testInputs.length; i++) {
            if (testInputs[i] === null) {
                states.push(null);
                continue;
            }
            var input = testInputs[i].v;
            var output = transformVectorWithOperations(input, operations);
            states.push({label: testInputs[i].label, v: output});
        }

        drawStates(rect, states, label, true);
    };

    var drawInputVectors = function () {
        drawStates(inputVectorsRect, testInputs, inputTestVectorsCaption);
    };

    var drawOutputVectors = function (operations) {
        drawTestStates(outputVectorsRect, operations, outputTestVectorsCaption, true);
    };

    var drawIntermediateVectors = function (operations) {
        drawTestStates(intermediateVectorsRect, operations, intermediatePostTestVectorsCaption);
    };

    var drawGateSet = function () {
        var r = makeRect(2, 2, gateSet.length * 75 + 25, 100);
        drawRect(r, "gray");
        drawCenteredString(r.x + r.w / 2, 15, "Toolbox (drag gates onto circuit)");
        for (var i = 0; i < gateSet.length; i++) {
            drawToolboxGate(i * 75 + 50, 65, gateSet[i], true);
        }
    };

    var redraw = function () {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var candidateNewCols = circuitOperationColumns.slice(0);
        for (var i = 0; i < candidateNewCols.length; i++) {
            candidateNewCols[i] = new GateColumn(candidateNewCols[i].gates.slice(0));
        }
        var insertSite = rectContainsMouse(circuitRect) ? posToColumnIndexAndInsertSuggestion(latestMouseX, latestMouseY, candidateNewCols) : null;
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

        drawCircuit(candidateNewCols);

        if (insertSite !== null) {
            if (showOperationMatrixInline) {
                operationMatrixRect.x = operationIndexToX(insertSite.col);
                operationMatrixRect.x += operationMatrixRect.x > operationMatrixRect.w + 75 ? -operationMatrixRect.w - 50 : 50;
            } else {
                drawCenteredString(operationMatrixRect.x + operationMatrixRect.w / 2, operationMatrixRect.y + testVectorsTitleOffset, effectOfOperationCaption);
            }
            var m = candidateNewCols[insertSite.col].matrix();
            drawMatrix(makeRect(operationMatrixRect.x, operationMatrixRect.y, operationMatrixRect.w, operationMatrixRect.h), m);

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

    var testInputs = entangledIndexVectorsInput;
    redraw();
}
