var numWires = 4;
var numStates = Math.pow(2, numWires);
var tau = Math.PI*2;

var makeFrequencyVector = function(freqIndex) {
    var d = [];
    var c = tau * freqIndex / numStates;
	var s = Math.sqrt(numStates);
    for (var i = 0; i < numStates; i++) {
        d.push({
            r: Math.cos(c * i)/s,
            i: Math.sin(c * i)/s
        });
    }
    return d;
};
var makeIndexVector = function(index) {
    var d = [];
    for (var i = 0; i < numStates; i++) {
        d.push({
            r: i == index ? 1 : 0,
            i: 0
        });
    }
    return d;
};
var freqVectors = function() {
    d = [];
    for (var f = 0; f < numStates; f++) {
        d.push({label: f + "Hz", v: makeFrequencyVector(f)});
    }
    return d;
}();
var indexVectors = function() {
    d = [];
    for (var f = 0; f < numStates; f++) {
        d.push({label: f+"", v: makeIndexVector(f)});
    }
    return d;
}();
var testVectors = indexVectors;

// --- Math and Circuits ---
var turnToAngleDescription = function(r) {
    return (r * 360) + "°";
};
var complexPlusComplex = function(v1, v2) {
    return { r:v1.r + v2.r, i:v1.i + v2.i };
};
var complexTimesComplex = function(v1, v2) {
    return {
        r:v1.r*v2.r - v1.i*v2.i,
        i:v1.r*v2.i + v2.r*v1.i
    };
};
var matrixTimesVector = function(matrix, vector) {
    result = [];
    var n = vector.length;
    for (var i = 0; i < n; i++) {
        var v = {r:0,i:0};
        for (var j = 0; j < n; j++) {
            v = complexPlusComplex(v, complexTimesComplex(vector[j], matrix[i][j]));
        }
        result.push(v);
    }
    return result;
};
var matrixForOperation = function(operation) {
    var smallMatrix = operation.gate.matrix;
    var d = Math.pow(2, operation.wire);
    var cond = 0;
    for (var i = 0; i < operation.controls.length; i++) {
        cond |= Math.pow(2, operation.controls[i]);
    }
    cond &= ~d;
    
    var bigMatrix = [];
    for (var r = 0; r < numStates; r++) {
        var row = [];
        for (var c = 0; c < numStates; c++) {
            var v = 0;
            if ((cond & ~c) !== 0 || (cond & ~r) !== 0) {
                v = {r:r == c ? 1 : 0,i:0};
            } else if ((~d & c) == (~d & r)) {
                var rs = (d & r) !== 0 ? 1 : 0;
                var cs = (d & c) !== 0 ? 1 : 0;
                v = smallMatrix[rs][cs];
            } else {
                v = {r:0,i:0};
            }
            row.push(v);
        }
        bigMatrix.push(row);
    }
    return bigMatrix;
};
var transformVectorWithOperation = function(input, operation) {
    return matrixTimesVector(matrixForOperation(operation), input);
};
var transformVectorWithOperations = function(input, operations) {
    for (var i = 0; i < operations.length; i++) {
        input = transformVectorWithOperation(input, operations[i]);
    }
    return input;
};

// --- Define toolbox gate types ---
var gateSet = [];
gateSet.push({
    name: "Hadamard Gate",
    desc: "Translates a bit's value into a uniform superposition,\n" +
          "moving the value into the phases of the output.\n" +
          "\n" +
          "Other interpretations:\n" +
          "- A half-rotation around the X+Z diagonal axis of the Block Sphere.\n" +
          "- A single-bit Fourier transform.\n" +
          "- Converts to/from the usual [1,0],[0,1] basis and the diagonal [1,1],[1,-1] basis.",
    matrix: [
        [{r:Math.sqrt(1/2),i:0}, {r:Math.sqrt(1/2),i:0}],
        [{r:Math.sqrt(1/2),i:0}, {r:-Math.sqrt(1/2),i:0}]
    ],
    symbol: "H"
});
gateSet.push({
    name: "Pauli X Gate",
    desc: "Flips a bit's value.\n" +
          "\n" +
          "Other interpretations:\n" +
          "- A NOT gate.\n" +
          "- A half-rotation around the X axis of the Block Sphere.",
    matrix: [
        [{r:0,i:0}, {r:1,i:0}],
        [{r:1,i:0}, {r:0,i:0}]
    ],
    symbol: "X"
});
gateSet.push({
    name: "Pauli Y Gate",
    desc: "Flips a bit's value while spreading its relative phase.\n" +
          "\n" +
          "Other interpretations:\n" +
          "- A half-rotation around the Y axis of the Block Sphere.",
    matrix: [
        [{r:0,i:0}, {r:0,i:-1}],
        [{r:0,i:1}, {r:0,i:0}]
    ],
    symbol: "Y"
});
gateSet.push({
    name: "Pauli Z Gate",
    desc: "Half-rotates the phase of a bit when it is in the ON state.\n" +
          "No effect when the bit is OFF.\n" +
          "\n" +
          "Other interpretations:\n" +
          "- The R(" + turnToAngleDescription(0.5) + ") gate.\n" +
          "- A half-rotation around the Z axis of the Block Sphere.",
    matrix: [
        [{r:1,i:0}, {r:0,i:0}],
        [{r:0,i:0}, {r:-1,i:0}]
    ],
    symbol: "Z"
});
var makeRGate = function(turnProportion) {
	var angle = turnToAngleDescription(turnProportion);
    return {
        name: "Phase Shift Gate (" + angle + ")",
        desc: "Rotates the phase of a bit in the ON state by " + angle + ".\n" +
          "No effect when the bit is OFF.\n" +
          "\n" +
          "Other interpretations:\n" +
          "- A " + angle + " rotation around the Z axis of the Block Sphere.",
        matrix: [
            [{r:1,i:0}, {r:0,i:0}],
            [{r:0,i:0}, {r:Math.cos(turnProportion*tau),i:Math.sin(turnProportion*tau)}]
        ],
        symbol: "R(" + angle + ")"
    };
};
gateSet.push(makeRGate(-1 / 4));
gateSet.push(makeRGate(-1 / 8));
gateSet.push(makeRGate(-1 / 16));

// --- Layout ---
var makeRect = function(x, y, w, h) {
    return {x:x,y:y,w:w,h:h};
};
var canvas = document.getElementById("drawCanvas");
var ctx = canvas.getContext("2d");
var gateRadius = 25;
var gateSeparation = 10;
var circuitOperations = [];

var circuitRect = makeRect(0, 120, 1400, 200);
var inputVectorsRect = makeRect(0, 350, 300, 300);
var operationMatrixRect = makeRect(0, 350, 300-12, 300-12);
var outputVectorsRect = makeRect(350, 350, 300, 300);

var wireIndexToY = function(i) {
    return circuitRect.y + (2 * i + 1) * circuitRect.h / numWires / 2;
};
var wireYToIndex = function(y) {
    var result = Math.round(((y - circuitRect.y) * 2 * numWires / circuitRect.h - 1) / 2);
	if (result < 0 || result >= numWires) return null;
	return result;
};
var operationIndexToX = function(index) {
    var s = gateRadius*2 + gateSeparation;
    return s * (index + 1);
};
var operationXToIndex = function(x) {
    var s = gateRadius*2 + gateSeparation;
    var r = Math.floor(x/s - 0.5);
    return Math.max(0, r);
};

// --- State ---
var latestMouseX = 0;
var latestMouseY = 0;
var heldOperation = null;
var isTapping = false;
var wasTapping = false;
var hoverComplex = null;


var drawRect = function(rect, fill) {
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = fill ? fill : "white";
    ctx.fill();

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "black";
    ctx.stroke();
};

var drawParagraph = function(x,y,paragraph,fontSize) {
    ctx.font = (fontSize ? fontSize : 14) + "px Helvetica";
    ctx.fillStyle = "black";
    var lines = paragraph.split("\n");
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i*16);
    }
};
var drawCenteredString = function(x,y,text,fontSize) {
    ctx.font = (fontSize ? fontSize : 14) + "px Helvetica";
    ctx.fillStyle = "black";
	var s = ctx.measureText(text);
	ctx.fillText(text,x-s.width/2,y+5);
};
var drawLine = function(x1,y1,x2,y2) {
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle = "black";
    ctx.stroke();
};
var drawBall = function(x,y,r) {
    ctx.beginPath();
    ctx.arc(x,y,r, 0,2*Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();
};
var rectContainsMouse = function(b) {
    var x = latestMouseX;
    var y = latestMouseY;
    return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
};
var drawFloatingGate = function(x, y, g) {
    var r = 25;
    var b = makeRect(x - r, y - r, r * 2, r * 2);
    drawRect(b, "orange");
    drawCenteredString(x, y, g.symbol, g.symbol.length > 2 ? 11 : null);
};
var drawToolboxGate = function(x, y, g) {
    var r = 25;
    var b = makeRect(x - r, y - r, r * 2, r * 2);
    if (rectContainsMouse(b)) {
        if (isTapping && !wasTapping) {
            heldOperation = {
                gate: g,
                controls: [],
                wire: 0
            };
        }
        if (heldOperation === null) {
            ctx.beginPath();
            ctx.rect(0, y+r+15, 800, 800);
            ctx.globalAlpha=0.5;
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.globalAlpha=1;
            
            drawRect(b, "orange");
            
            drawRect(makeRect(50, y+r+10, 550, (g.desc.split("\n").length+5)*16+4*r+10));
            drawParagraph(50+5, y+r+25, g.name + "\n\n" + g.desc + "\n\nMatrix Form:");
            drawMatrix(makeRect(55, y+r+10+ (g.desc.split("\n").length+5)*16, 4*r, 4*r), g.matrix);
        } else {
            drawRect(b);
        }
    } else {
        drawRect(b);
    }
    drawCenteredString(x, y, g.symbol, g.symbol.length > 2 ? 11 : null);
};
var drawCircuitOperation = function(operation, operationIndex) {
	var x = operationIndexToX(operationIndex);
    var cy = wireIndexToY(operation.wire);
    for (var i = 0; i < operation.controls.length; i++) {
		var cy2 = wireIndexToY(operation.controls[i]);
        drawLine(x, cy2, x, cy);
        drawBall(x, cy2, 5);
    }

    var r = 25;
    var b = makeRect(x - r, cy - r, r * 2, r * 2);
    
	drawRect(b, rectContainsMouse(b) && heldOperation === null && !isTapping ? "orange" : null);
    drawCenteredString(x, cy, operation.gate.symbol, operation.gate.symbol.length > 2 ? 11 : null);
    if (rectContainsMouse(b) && heldOperation === null && !wasTapping && isTapping) {
        heldOperation = operation;
        circuitOperations.splice(operationIndex, 1);
    }
};
var drawCircuit = function(ops) {
    var s = gateRadius*2 + gateSeparation;
    var w = s*(ops.length+0.5)+s;

    for (var i = 0; i < numWires; i++) {
        var t = wireIndexToY(i);
        drawParagraph(circuitRect.x+2, t, "bit" + i+":");
        drawLine(circuitRect.x+30, t, circuitRect.x + w-30, t);
    }
    for (var i2 = 0; i2 < ops.length; i2++) {
        drawCircuitOperation(ops[i2], i2);
    }
};
var drawComplex = function(rect, value) {
    var x = rect.x + rect.w/2;
    var y = rect.y + rect.h/2;
    if (rectContainsMouse(rect)) {
        hoverComplex = {r:makeRect(x-50, y-50, 100, 100), v:value};
    }
    var len = value.r*value.r + value.i*value.i;
    
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "white";
    ctx.fill();

    if (len > 0.0001) {
        ctx.beginPath();
        var h = Math.sqrt(len)*(rect.h-1);
        var w = Math.sqrt(len)*(rect.w-1);
        ctx.rect(rect.x+rect.w/2-w/2, rect.y+rect.h/2-h/2, w, h);
        ctx.fillStyle = "orange";
        ctx.fill();
    }

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "black";
    ctx.stroke();

    if (len > 0.0001) {
        if (rect.w > 20 && (value.r < 0 || Math.abs(value.i) > 0.0001)) {
            ctx.beginPath();
            var theta = Math.atan2(-value.i, value.r);
            if (theta <= -tau/2) theta += tau;
            if (theta > tau/2-0.001) theta -= tau;
            ctx.moveTo(x, y);
            ctx.arc(x, y, 5, Math.min(0, theta), Math.max(0, theta));
            ctx.strokeStyle = "black";
            ctx.fillStyle = "yellow";
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fill();
        }

        drawLine(x, y, x + rect.w/2.2*value.r/Math.sqrt(len), y - rect.h/2.2*value.i/Math.sqrt(len));
    }
};
var drawMatrix = function(rect, matrix) {
    var n = matrix.length;
    var w = rect.w / n;
    var h = rect.h / n;
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            drawComplex(makeRect(rect.x+w*i, rect.y+h*j, w, h), matrix[j][i]);
        }
    }
};
var drawState = function(rect, values) {
    var h = rect.w;
    for (var i = 0; i < values.length; i++) {
        drawComplex(makeRect(rect.x, rect.y + h * i, rect.w, h), values[i]);
    }
};
var drawTestStates = function(rect, operations, label) {
    drawCenteredString(rect.x+rect.w/2, rect.y, label);
    var w = rect.w/testVectors.length;
    
    for (var i = 0; i < testVectors.length; i++) {
		var input = testVectors[i].v;
        var output = transformVectorWithOperations(input, operations);
        drawCenteredString(rect.x + i * w + w/2-2/2, rect.y + 10, testVectors[i].label, 8);
        drawState(makeRect(rect.x + i * w, rect.y+20, w-2, rect.h-20), output);
    }
};
var drawInputVectors = function() {
	drawTestStates(inputVectorsRect, [], "Inputs");
};
var drawOutputVectors = function(operations) {
	drawTestStates(outputVectorsRect, operations, "Outputs");
};
var drawIntermediateVectors = function(operations) {
	drawTestStates(intermediateVectorsRect, operations, "State after Operation");
};


var drawGateSet = function() {
    var r = makeRect(2, 2, gateSet.length*75+25, 100);
    drawRect(r, "gray");
    drawCenteredString(r.x + r.w/2, 15, "Toolbox (drag gates onto circuit)", 12);
    for (var i = 0; i < gateSet.length; i++) {
        drawToolboxGate(i*75 + 50, 65, gateSet[i], true);
    }
};

var redraw = function () {
    ctx.rect(0,0,800,800);
    ctx.fillStyle = "white";
    ctx.fill();

    var focusedOperationIndex = rectContainsMouse(circuitRect) ? operationXToIndex(latestMouseX) : null;
    if (focusedOperationIndex != null) {
        if (heldOperation !== null) {
            focusedOperationIndex = Math.min(circuitOperations.length, focusedOperationIndex);
        } else if (focusedOperationIndex >= circuitOperations.length) {
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
        ctx.beginPath();
        var x1 = operationIndexToX(focusedOperationIndex-0.5);
        var x2 = operationIndexToX(focusedOperationIndex+0.5)
        ctx.rect(x1, circuitRect.y, x2 - x1, circuitRect.h);
        ctx.fillStyle = heldOperation === null ? "yellow" : "orange";
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x2, circuitRect.y);
        ctx.lineTo(x2, circuitRect.y+circuitRect.h);
        ctx.strokeStyle = "gray";
        ctx.stroke();
        
        for (var i = 0; i < 4; i++) {
            var opRect = makeRect(operationIndexToX(focusedOperationIndex)-10, wireIndexToY(i)-10, 20, 20);
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
        drawCenteredString(operationMatrixRect.x+operationMatrixRect.w/2, operationMatrixRect.y+10, "Effect of Selected Operation");
        var m = matrixForOperation(ops[focusedOperationIndex]);
        drawMatrix(makeRect(operationMatrixRect.x, operationMatrixRect.y+20, operationMatrixRect.w, operationMatrixRect.h-20), m);
	} else {
		drawInputVectors();
	}
    
    drawOutputVectors(ops);
    
    drawGateSet();

    if (heldOperation !== null && focusedOperationIndex === null) {
        drawFloatingGate(latestMouseX, latestMouseY, heldOperation.gate);
    }
    if (hoverComplex !== null) {
        ctx.globalAlpha = 0.9;
        drawComplex(hoverComplex.r, hoverComplex.v);
        ctx.globalAlpha = 1;
        hoverComplex = null;
    }
};

canvas.onmousemove = function(p) {
    latestMouseX = p.offsetX;
    latestMouseY = p.offsetY;
    wasTapping = isTapping;
    redraw();
};
canvas.onmousedown = function(p) {
    latestMouseX = p.offsetX;
    latestMouseY = p.offsetY;
    isTapping = true;
    wasTapping = false;
    heldOperation = null;
    redraw();
    wasTapping = isTapping;
    redraw();
};
canvas.onmouseup = function(p) {
    latestMouseX = p.offsetX;
    latestMouseY = p.offsetY;
    isTapping = false;
    wasTapping = true;
    redraw();
    heldOperation = null;
    wasTapping = isTapping;
    redraw();
};

redraw();
