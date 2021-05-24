/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Axis} from "../math/Axis.js"
import {CircuitDefinition} from "../circuit/CircuitDefinition.js"
import {setGateBuilderEffectToCircuit} from "../circuit/CircuitComputeUtil.js"
import {Complex} from "../math/Complex.js"
import {Config} from "../Config.js"
import {DetailedError} from "../base/DetailedError.js"
import {drawCircuitTooltip} from "../ui/DisplayedCircuit.js"
import {Format} from "../base/Format.js"
import {Gate, GateBuilder} from "../circuit/Gate.js"
import {GateColumn} from "../circuit/GateColumn.js"
import {getCircuitCycleTime} from "../ui/sim.js"
import {MathPainter} from "../draw/MathPainter.js"
import {Matrix} from "../math/Matrix.js"
import {Observable, ObservableValue} from "../base/Obs.js"
import {Painter} from "../draw/Painter.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {fromJsonText_CircuitDefinition, Serializer} from "../circuit/Serializer.js"
import {seq} from "../base/Seq.js"
import {textEditObservable} from "../browser/EventUtil.js"
import {Util} from "../base/Util.js"

const forgeIsVisible = new ObservableValue(false);
const obsForgeIsShowing = forgeIsVisible.observable().whenDifferent();

/**
 * @param {!Revision} revision
 * @param {!Observable.<!boolean>} obsIsAnyOverlayShowing
 */
function initForge(revision, obsIsAnyOverlayShowing) {
    const obsOnShown = obsForgeIsShowing.filter(e => e === true);
    /** @type {!String} */
    let latestInspectorText;
    revision.latestActiveCommit().subscribe(e => { latestInspectorText = e; });

    // Show/hide forge overlay.
    (() => {
        const forgeButton = /** @type {!HTMLButtonElement} */ document.getElementById('gate-forge-button');
        const forgeOverlay = /** @type {!HTMLDivElement} */ document.getElementById('gate-forge-overlay');
        const forgeDiv = /** @type {HTMLDivElement} */ document.getElementById('gate-forge-div');
        forgeButton.addEventListener('click', () => forgeIsVisible.set(true));
        forgeOverlay.addEventListener('click', () => forgeIsVisible.set(false));
        obsIsAnyOverlayShowing.subscribe(e => { forgeButton.disabled = e; });
        document.addEventListener('keydown', e => {
            const ESC_KEY = 27;
            if (e.keyCode === ESC_KEY) {
                forgeIsVisible.set(false)
            }
        });
        obsForgeIsShowing.subscribe(showing => {
            forgeDiv.style.display = showing ? 'block' : 'none';
            if (showing) {
                document.getElementById('gate-forge-rotation-axis').focus();
            }
        });
    })();

    function computeAndPaintOp(canvas, opGetter, button) {
        button.disabled = true;
        let painter = new Painter(canvas);
        painter.clear();
        let d = Math.min((canvas.width - 5)/2, canvas.height);
        let rect1 = new Rect(0, 0, d, d);
        let rect2 = new Rect(d + 5, 0, d, d);
        try {
            let op = opGetter();
            MathPainter.paintMatrix(
                painter,
                op,
                rect1,
                Config.OPERATION_FORE_COLOR,
                'black',
                undefined,
                Config.OPERATION_BACK_COLOR,
                undefined,
                'transparent');
            if (!op.isUnitary(0.009)) {
                painter.printParagraph('NOT UNITARY', rect2, new Point(0.5, 0.5), 'red', 24);
            } else  if (op.width() !== 2) {
                painter.printParagraph('(Not a 1-qubit rotation)', rect2, new Point(0.5, 0.5), '#666', 20);
            } else {
                MathPainter.paintBlochSphereRotation(
                    painter,
                    op,
                    rect2,
                    Config.OPERATION_BACK_COLOR,
                    Config.OPERATION_FORE_COLOR);
            }
            let cx = (rect1.right() + rect2.x)/2;
            painter.strokeLine(new Point(cx, 0), new Point(cx, canvas.height), 'black', 2);
            if (!op.hasNaN()) {
                button.disabled = false;
            }
        } catch (ex) {
            painter.printParagraph(
                ex+"",
                new Rect(0, 0, canvas.width, canvas.height),
                new Point(0.5, 0.5),
                'red',
                24);
        }
    }

    /**
     * @param {!Gate} gate
     * @param {undefined|!CircuitDefinition=undefined} circuitDef
     */
    function createCustomGateAndClose(gate, circuitDef=undefined) {
        let c = circuitDef || fromJsonText_CircuitDefinition(latestInspectorText);
        revision.commit(JSON.stringify(Serializer.toJson(c.withCustomGate(gate)), null, 0));
        forgeIsVisible.set(false);
    }

    (() => {
        const rotationCanvas = /** @type {!HTMLCanvasElement} */ document.getElementById('gate-forge-rotation-canvas');
        const rotationButton = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-button');
        const txtAxis = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-axis');
        const txtAngle = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-angle');
        const txtPhase = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-phase');
        const txtName = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-name');
        obsOnShown.subscribe(() => { txtName.value = ""; });

        function parseRotationFromInputs() {
            return parseUserRotation(
                valueElsePlaceholder(txtAngle),
                valueElsePlaceholder(txtPhase),
                valueElsePlaceholder(txtAxis));
        }

        let redraw = () => computeAndPaintOp(rotationCanvas, parseRotationFromInputs, rotationButton);
        Observable.of(obsOnShown, ...[txtPhase, txtAxis, txtAngle].map(textEditObservable)).
            flatten().
            throttleLatest(100).
            subscribe(redraw);

        rotationButton.addEventListener('click', () => {
            let mat;
            try {
                mat = parseRotationFromInputs();
            } catch (ex) {
                console.warn(ex);
                return; // Button is about to be disabled, so no handling required.
            }

            let gate = new GateBuilder().
                setSerializedId('~' + Math.floor(Math.random()*(1 << 20)).toString(32)).
                setSymbol(txtName.value).
                setTitle('Custom Rotation Gate').
                setKnownEffectToMatrix(mat).
                gate;
            createCustomGateAndClose(gate);
        });
    })();

    (() => {
        const matrixCanvas = /** @type {!HTMLCanvasElement} */ document.getElementById('gate-forge-matrix-canvas');
        const txtMatrix = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix');
        const chkFix = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix-fix');
        const matrixButton = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix-button');
        const txtName = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix-name');
        obsOnShown.subscribe(() => { txtName.value = ""; });

        function parseMatrixFromInputs() {
            let text = valueElsePlaceholder(txtMatrix);
            let ensureUnitary = chkFix.checked;
            return parseUserMatrix(text, ensureUnitary);
        }

        let redraw = () => computeAndPaintOp(matrixCanvas, parseMatrixFromInputs, matrixButton);

        Observable.of(obsOnShown, textEditObservable(txtMatrix), Observable.elementEvent(chkFix, 'change')).
            flatten().
            throttleLatest(100).
            subscribe(redraw);

        matrixButton.addEventListener('click', () => {
            let mat;
            try {
                mat = parseMatrixFromInputs();
            } catch (ex) {
                console.warn(ex);
                return; // Button is about to be disabled, so no handling required.
            }

            let name = txtName.value.trim();
            let h = Math.round(Math.log2(mat.height()));
            let gate = new GateBuilder().
                setSerializedId('~' + Math.floor(Math.random()*(1 << 20)).toString(32)).
                setSymbol(name).
                setTitle('Custom Matrix Gate').
                setHeight(h).
                setWidth(name === '' ? h : 1).
                setKnownEffectToMatrix(mat).
                gate;
            createCustomGateAndClose(gate);
        });
    })();

    (() => {
        const circuitCanvas = /** @type {!HTMLCanvasElement} */ document.getElementById('gate-forge-circuit-canvas');
        const txtCols = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-circuit-cols');
        const txtRows = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-circuit-rows');
        const spanInputs = /** @type {!HTMLElement} */ document.getElementById('gate-forge-circuit-inputs');
        const spanWeight = /** @type {!HTMLElement} */ document.getElementById('gate-forge-circuit-weight');
        const circuitButton = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-circuit-button');
        const txtName = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-circuit-name');
        obsOnShown.subscribe(() => { txtName.value = ""; });

        /** @returns {{gate: !Gate, circuit: !CircuitDefinition}} */
        function parseEnteredCircuitGate() {
            let circuit = fromJsonText_CircuitDefinition(latestInspectorText);
            let gate = parseUserGateFromCircuitRange(
                circuit,
                valueElsePlaceholder(txtCols),
                valueElsePlaceholder(txtRows),
                txtName.value.trim());
            return {gate, circuit};
        }

        let latestGate = new ObservableValue(undefined);
        let drawGate = (painter, gate) => drawCircuitTooltip(
            painter,
            gate.knownCircuitNested,
            new Rect(0, 0, circuitCanvas.width, circuitCanvas.height),
            true,
            getCircuitCycleTime());

        latestGate.observable().
            zipLatest(obsForgeIsShowing, (g, s) => s ? g : undefined).
            map(e => e === undefined || e.gate.stableDuration() === Infinity ?
                Observable.of() :
                Observable.requestAnimationTicker().map(_ => e)).
            flattenLatest().
            subscribe(e => {
                let painter = new Painter(circuitCanvas);
                painter.clear();
                drawGate(painter, e.gate);
            });

        let redraw = () => {
            circuitButton.disabled = true;
            let painter = new Painter(circuitCanvas);
            painter.clear();
            try {
                let {gate} = parseEnteredCircuitGate();
                let keys = gate.getUnmetContextKeys();
                spanInputs.innerText = keys.size === 0 ?
                    "(none)" :
                    [...keys].map(e => e.replace("Input Range ", "").
                                         replace("Input NO_DEFAULT Range ", "")).join(", ");
                spanWeight.innerText = "" + gate.knownCircuit.gateWeight();
                drawGate(painter, gate);
                circuitButton.disabled = false;
                latestGate.set({gate});
            } catch (ex) {
                latestGate.set(undefined);
                spanInputs.innerText = "(err)";
                spanWeight.innerText = "(err)";
                painter.printParagraph(
                    ex+"",
                    new Rect(0, 0, circuitCanvas.width, circuitCanvas.height),
                    new Point(0.5, 0.5),
                    'red',
                    24);
            }
        };

        Observable.of(obsOnShown, textEditObservable(txtCols), textEditObservable(txtRows)).
            flatten().
            throttleLatest(100).
            subscribe(redraw);

        circuitButton.addEventListener('click', () => {
            try {
                let {gate, circuit} = parseEnteredCircuitGate();
                createCustomGateAndClose(gate, circuit);
            } catch (ex) {
                // Button is about to be disabled, so no handling required.
                console.warn(ex);
            }
        });
    })();
}

/**
 * @param {!HTMLInputElement} textBox
 * @returns {!string}
 */
function valueElsePlaceholder(textBox) {
    //noinspection JSUnresolvedVariable
    return textBox.value === '' ? textBox.placeholder : textBox.value;
}

/**
 * @param {!string} text
 * @returns {!number}
 */
function parseUserAngle(text) {
    let c = Complex.parse(text);
    if (c.imag !== 0 || isNaN(c.imag)) {
        throw new Error("You just had to make it complicated, didn't you?");
    }
    return c.real * Math.PI / 180;
}

/**
 * @param {!Matrix} matrix
 * @returns {!Matrix}
 */
function decreasePrecisionAndSerializedSize(matrix) {
    return Matrix.parse(matrix.toString(new Format(true, 0.0000001, 7, ",")))
}

/**
 * @param {!string} angleText
 * @param {!string} phaseText
 * @param {!string} axisText
 * @returns {!Matrix}
 */
function parseUserRotation(angleText, phaseText, axisText) {
    let w = parseUserAngle(angleText);
    let phase = parseUserAngle(phaseText);
    let {x, y, z} = Axis.parse(axisText);

    let len = Math.sqrt(x*x + y*y + z*z);
    x /= len;
    y /= len;
    z /= len;

    let [I, X, Y, Z] = [Matrix.identity(2), Matrix.PAULI_X, Matrix.PAULI_Y, Matrix.PAULI_Z];
    let axisMatrix = X.times(x).plus(Y.times(y)).plus(Z.times(z));

    let result = I.times(Math.cos(w/2)).
        plus(axisMatrix.times(Complex.I.neg()).times(Math.sin(w/2))).
        times(Complex.polar(1, phase));
    if (result.hasNaN()) {
        throw new DetailedError("NaN", {x, y, z, result});
    }

    return decreasePrecisionAndSerializedSize(result);
}

/**
 * @param {!string} text
 * @returns {!Matrix}
 */
function parseUserGateMatrix_noCorrection(text) {
    // If brackets are present, use the normal parse method that enforces grouping.
    if (text.match(/[\{}\[\]]/)) {
        return Matrix.parse(text.split(/[\{\[]/).join('{').split(/[}\]]/).join('}'));
    }

    // Newlines introduce a break if one isn't already present at that location and we aren't at the end.
    text = text.split(/,?\s*\n\s*(?!$)/).join(',');
    text = text.trim();
    // Ignore trailing comma.
    if (text.endsWith(',')) {
        text = text.substring(0, text.length - 1);
    }

    let parts = text.split(',').map(e => e === '' ? 0 : Complex.parse(e));

    // Expand singleton cell into a 2x2 global phase operation.
    if (parts.length === 1) {
        parts.push(0, 0, parts[0]);
    }

    // Pad with zeroes up to next size that makes sense.
    let n = Math.max(4, 1 << (2*Math.max(1, Util.floorLg2(Math.sqrt(parts.length)))));
    if (n < parts.length) {
        n <<= 2;
    }
    if (n > (1<<8)) {
        throw Error("Max custom matrix operation size is 4 qubits.")
    }
    //noinspection JSCheckFunctionSignatures
    return Matrix.square(...parts, ...new Array(n - parts.length).fill(0));
}

/**
 * @param {!string} text
 * @param {!boolean} ensureUnitary
 * @returns {!Matrix}
 */
function parseUserMatrix(text, ensureUnitary) {
    let op = parseUserGateMatrix_noCorrection(text);
    if (op.width() !== op.height() || op.width() < 2 || op.width() > 16 || !Util.isPowerOf2(op.width())) {
        throw Error("Matrix must be 2x2, 4x4, 8x8, or 16x16.")
    }
    if (ensureUnitary && !op.hasNaN()) {
        op = op.closestUnitary(0.0001);
        op = decreasePrecisionAndSerializedSize(op);
    }
    return op;
}

/**
 * @param {!string} text
 * @param {!int} maxLen
 * @returns {{start: !int, end: !int}}
 */
function parseRange(text, maxLen) {
    let parts = text.split(":").map(e => e.trim());
    if (parts.length > 2) {
        throw new Error("Too many colons.");
    }
    let infinities = [undefined, "", "∞"];
    let min = parseInt(parts[0] || "1");
    let max = infinities.indexOf(parts[1]) !== -1 ? Infinity : parseInt(parts[1]);
    if (isNaN(min)) {
        throw new Error("Not a number: " + parts[0]);
    }
    if (isNaN(max)) {
        throw new Error("Not a number: " + parts[1]);
    }

    let start = Math.min(maxLen, Math.max(0, min - 1));
    let end = Math.min(maxLen, Math.max(start, max));
    return {start, end};
}

/**
 * @param {!CircuitDefinition} circuit
 * @returns {!CircuitDefinition}
 */
function removeBrokenGates(circuit) {
    let w = circuit.columns.length;
    let h = circuit.numWires;
    return circuit.withColumns(
        seq(circuit.columns).mapWithIndex(
            (col, c) => new GateColumn(seq(col.gates).mapWithIndex(
                (gate, r) => gate === undefined || c + gate.width > w || r + gate.height > h ? undefined : gate
            ).toArray())
        ).toArray());
}

/**
 * @param {!CircuitDefinition} circuit
 * @param {!string} colRangeText
 * @param {!string} wireRangeText
 * @param {!string} nameText
 * @returns {!Gate}
 */
function parseUserGateFromCircuitRange(circuit, colRangeText, wireRangeText, nameText) {
    let colRange = parseRange(colRangeText, circuit.columns.length);
    let rowRange = parseRange(wireRangeText, circuit.numWires);
    if (rowRange.end === rowRange.start) {
        throw new Error("Empty wire range.")
    }

    let cols = circuit.columns.
        slice(colRange.start, colRange.end).
        map(col => new GateColumn(col.gates.slice(rowRange.start, rowRange.end)));
    let gateCircuit = new CircuitDefinition(rowRange.end - rowRange.start, cols);
    gateCircuit = removeBrokenGates(gateCircuit);
    gateCircuit = gateCircuit.withUncoveredColumnsRemoved();
    if (gateCircuit.columns.length === 0) {
        throw new Error("No gates in included range.");
    }

    let symbol = nameText;
    let id = '~' + Math.floor(Math.random()*(1 << 20)).toString(32);

    return setGateBuilderEffectToCircuit(new GateBuilder(), gateCircuit).
        setSerializedId(id).
        setSymbol(symbol).
        setTitle(id).
        setBlurb('A custom gate.').
        gate;
}

export {initForge, obsForgeIsShowing, parseUserRotation, parseUserMatrix, parseUserGateFromCircuitRange}
