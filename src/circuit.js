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
    var circuitOperations = [];

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
    var turnToAngleDescription = function (r) {
        return (r * 360) + "°";
    };
    var matrixForOperation = function (operation) {
        var es = [];
        for (var i = 0; i < numWires; i++) {
            var p = null;
            if (operation.wire == i) {
                p = operation.gate.matrix;
            } else if (operation.controls.indexOf(i) >= 0) {
                p = Matrix.CONTROL_SYGIL;
            } else {
                p = Matrix.identity(2);
            }
            es.push(p);

        }

        return es.reduce(function (e1, e2) {
            return e1.tensorProduct(e2);
        }, Matrix.identity(1));
    };
    var transformVectorWithOperation = function (input, operation) {
        return matrixForOperation(operation).times(input);
    };
    var transformVectorWithOperations = function (input, operations) {
        for (var i = 0; i < operations.length; i++) {
            input = transformVectorWithOperation(input, operations[i]);
        }
        return input;
    };

// --- Define toolbox gate types ---
    var gateSet = [];
    gateSet.push({
        name: "Pauli X Gate",
        desc: "Flips a bit's value.\n" +
        "\n" +
        "Other interpretations:\n" +
        "- A NOT gate.\n" +
        "- A 180° turn around the X axis of the Block Sphere.",
        matrix: Matrix.PAULI_X,
        symbol: "X"
    });
    gateSet.push({
        name: "Pauli Y Gate",
        desc: "Flips a bit's value and rotates its phase by 90°.\n" +
        "The direction of rotation switches when the bit is ON.\n" +
        "\n" +
        "Other interpretations:\n" +
        "- A 180° turn around the Y axis of the Block Sphere.",
        matrix: Matrix.PAULI_Y,
        symbol: "Y"
    });
    gateSet.push({
        name: "Pauli Z Gate",
        desc: "Rotates the phase of a bit by 180° when it is in the ON state.\n" +
        "No effect when the bit is OFF.\n" +
        "\n" +
        "Other interpretations:\n" +
        "- The R(" + turnToAngleDescription(0.5) + ") gate.\n" +
        "- A 180° turn around the Z axis of the Block Sphere.",
        matrix: Matrix.PAULI_Z,
        symbol: "Z"
    });
    gateSet.push({
        name: "Hadamard Gate",
        desc: "Translates a bit's value into a uniform superposition,\n" +
        "moving the value into the phases of the output.\n" +
        "\n" +
        "Other interpretations:\n" +
        "- A 180° turn around the X+Z diagonal axis of the Block Sphere.\n" +
        "- A single-bit Fourier transform.\n" +
        "- Converts to/from the diagonal [1,1],[1,-1] basis.",
        matrix: Matrix.HADAMARD,
        symbol: "H"
    });
    var makeRGate = function (turnProportion) {
        var angle = turnToAngleDescription(turnProportion);
        var posAngle = turnToAngleDescription((turnProportion + 1) % 1);
        return {
            name: "Phase Shift Gate (" + angle + ")",
            desc: "Rotates the phase of a bit in the ON state by " + angle + ".\n" +
            "No effect when the bit is OFF.\n" +
            "\n" +
            "Other interpretations:\n" +
            "- A " + posAngle + " rotation around the Z axis of the Block Sphere.",
            matrix: Matrix.fromRotation([0, 0, turnProportion]),
            symbol: "R(" + angle + ")"
        };
    };
    gateSet.push(makeRGate(-1 / 4));
    gateSet.push(makeRGate(-1 / 8));
    if (numWires > 3) {
        gateSet.push(makeRGate(-1 / 16));
    }

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
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        return s * (index + 1);
    };
    var operationXToIndex = function (x) {
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        return Math.floor(x / s - 0.5);
    };
    var makeRectRadius = function (x, y, r) {
        return makeRect(x - r, y - r, 2 * r, 2 * r);
    };

// --- State ---
    var latestMouseX = 0;
    var latestMouseY = 0;
    var heldOperation = null;
    var isTapping = false;
    var wasTapping = false;

    var drawRect = function (rect, fill) {
        ctx.fillStyle = fill || "white";
        ctx.strokeStyle = "black";
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
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
    var drawBall = function (x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
    };
    var rectContainsMouse = function (b) {
        var x = latestMouseX;
        var y = latestMouseY;
        return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
    };
    var drawFloatingGate = function (x, y, g) {
        var b = makeRectRadius(x, y, gateRadius);
        drawRect(b, "orange");
        drawCenteredString(x, y, g.symbol);
    };
    var drawToolboxGate = function (x, y, g) {
        var b = makeRectRadius(x, y, gateRadius);
        if (rectContainsMouse(b)) {
            if (isTapping && !wasTapping) {
                heldOperation = {
                    gate: g,
                    controls: [],
                    wire: 0
                };
            }
            if (heldOperation === null) {
                var r = gateRadius;
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "white";
                ctx.fillRect(0, y + r + 15, 800, 800);
                ctx.globalAlpha = 1;

                drawRect(b, "orange");

                drawRect(makeRect(50, y + r + 10, 400, (g.desc.split("\n").length + 5) * 16 + 4 * r + 10));
                drawParagraph(50 + 5, y + r + 25, g.name + "\n\n" + g.desc + "\n\n1-Wire Matrix:");
                drawMatrix(makeRect(55, y + r + 10 + (g.desc.split("\n").length + 5) * 16, 4 * r, 4 * r), g.matrix);
            } else {
                drawRect(b);
            }
        } else {
            drawRect(b);
        }
        drawCenteredString(x, y, g.symbol);
    };
    var drawCircuitOperation = function (operation, operationIndex) {
        var x = operationIndexToX(operationIndex);
        var cy = wireIndexToY(operation.wire);
        for (var i = 0; i < operation.controls.length; i++) {
            var cy2 = wireIndexToY(operation.controls[i]);
            drawLine(x, cy2, x, cy);
            drawBall(x, cy2, 5);
        }

        var b = makeRectRadius(x, cy, gateRadius);

        var highlightGate = heldOperation == operation || (rectContainsMouse(b) && heldOperation === null && !isTapping);
        drawRect(b, highlightGate ? "orange" : null);
        drawCenteredString(x, cy, operation.gate.symbol);
        if (rectContainsMouse(b) && heldOperation === null && !wasTapping && isTapping) {
            heldOperation = operation;
            circuitOperations.splice(operationIndex, 1);
        }
    };
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
        var x = rect.x + rect.w / 2;
        var y = rect.y + rect.h / 2;
        var len = value.abs();

        if (len > 0.0001) {
            var h = len * (rect.h - 1);
            var w = len * (rect.w - 1);
            ctx.fillStyle = "orange";
            ctx.fillRect(rect.x + rect.w / 2 - w / 2, rect.y + rect.h / 2 - h / 2, w, h);
        }

        if (len > 0.0001) {
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

            drawLine(x, y, x + rect.w / 2.2 * value.real / len, y - rect.h / 2.2 * value.imag / len);
        }
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
    var drawTestStates = function (rect, operations, label, highlightIfMatches) {
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

        var focusedOperationIndex = rectContainsMouse(circuitRect) ? operationXToIndex(latestMouseX) : null;
        if (focusedOperationIndex !== null) {
            if (heldOperation !== null) {
                focusedOperationIndex = Math.max(0, Math.min(circuitOperations.length, focusedOperationIndex));
            } else if (focusedOperationIndex < 0 || focusedOperationIndex >= circuitOperations.length) {
                focusedOperationIndex = null;
            }
        }

        var ops = circuitOperations.slice(0);
        if (focusedOperationIndex !== null && heldOperation !== null) {
            heldOperation.wire = wireYToIndex(latestMouseY);
            ops.splice(focusedOperationIndex, 0, heldOperation);
            if (wasTapping && !isTapping) {
                circuitOperations = ops;
            }
        }
        if (focusedOperationIndex !== null) {
            var x1 = operationIndexToX(focusedOperationIndex - 0.5);
            var x2 = operationIndexToX(focusedOperationIndex + 0.5);
            ctx.fillStyle = heldOperation === null ? "yellow" : "orange";
            ctx.fillRect(x1, circuitRect.y, x2 - x1, circuitRect.h);
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(x2, circuitRect.y);
            ctx.lineTo(x2, circuitRect.y + circuitRect.h);
            ctx.strokeStyle = "gray";
            ctx.stroke();

            for (var i = 0; i < numWires; i++) {
                var opRect = makeRect(operationIndexToX(focusedOperationIndex) - 10, wireIndexToY(i) - 10, 20, 20);
                if (rectContainsMouse(opRect)) {
                    if (isTapping && !wasTapping && i != circuitOperations[focusedOperationIndex].wire) {
                        var conds = circuitOperations[focusedOperationIndex].controls;
                        var ind = conds.indexOf(i);
                        if (ind == -1) {
                            conds.push(i);
                        } else {
                            conds.splice(ind, 1);
                        }
                    }
                    drawRect(opRect, "orange");
                } else {
                    drawRect(opRect);
                }
            }
        }

        drawCircuit(ops);

        if (focusedOperationIndex !== null) {
            if (showOperationMatrixInline) {
                operationMatrixRect.x = operationIndexToX(focusedOperationIndex);
                operationMatrixRect.x += operationMatrixRect.x > operationMatrixRect.w + 75 ? -operationMatrixRect.w - 50 : 50;
            } else {
                drawCenteredString(operationMatrixRect.x + operationMatrixRect.w / 2, operationMatrixRect.y + testVectorsTitleOffset, effectOfOperationCaption);
            }
            var m = matrixForOperation(ops[focusedOperationIndex]);
            drawMatrix(makeRect(operationMatrixRect.x, operationMatrixRect.y, operationMatrixRect.w, operationMatrixRect.h), m);

            drawIntermediateVectors(ops.slice(0, focusedOperationIndex + 1));
        } else {
            drawInputVectors();
        }

        drawOutputVectors(ops);

        drawGateSet();

        if (heldOperation !== null && focusedOperationIndex === null) {
            drawFloatingGate(latestMouseX, latestMouseY, heldOperation.gate);
        }
    };

    var mouseUpdate = function (p, pressed) {
        latestMouseX = p.pageX - $(canvas).position().left;
        latestMouseY = p.pageY - $(canvas).position().top;
        if (isTapping != pressed) {
            wasTapping = isTapping;
            isTapping = pressed;
        }
        redraw();

        if (!isTapping) {
            heldOperation = null;
        }
        if (isTapping != wasTapping) {
            wasTapping = isTapping;
            redraw();
        }
    };
    $(canvas).mousedown(function (p) {
        if (p.which != 1) return;
        mouseUpdate(p, true);
    });
    $(document).mouseup(function (p) {
        if (p.which != 1) return;
        mouseUpdate(p, false);
    });
    $(document).mousemove(function (p) {
        if (isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    $(canvas).mousemove(function (p) {
        if (!isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    $(canvas).mouseleave(function (p) {
        mouseUpdate({offsetX: -100, offsetY: -100}, isTapping);
    });

    var testInputs = entangledIndexVectorsInput;
    redraw();
}
