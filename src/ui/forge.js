import Painter from "src/draw/Painter.js"
import Config from "src/Config.js"
import MathPainter from "src/draw/MathPainter.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"
import Rect from "src/math/Rect.js"
import Point from "src/math/Point.js"
import { textEditObservable } from "src/browser/EventUtil.js"
import { Observable, ObservableSource } from "src/base/Obs.js"

/**
 * @param {!Revision} revision
 */
function initForge(revision) {
    const obsShow = new ObservableSource();

    // Show/hide exports overlay.
    (() => {
        const forgeButton = /** @type {!HTMLButtonElement} */ document.getElementById('gate-forge-button');
        const forgeOverlay = /** @type {!HTMLDivElement} */ document.getElementById('gate-forge-overlay');
        const forgeDiv = /** @type {HTMLDivElement} */ document.getElementById('gate-forge-div');
        forgeButton.addEventListener('click', () => {
            forgeDiv.style.display = 'block';
            obsShow.send(undefined);
        });
        forgeOverlay.addEventListener('click', () => {
            forgeDiv.style.display = 'none';
        });
        document.addEventListener('keydown', e => {
            const ESC_KEY = 27;
            if (e.keyCode === ESC_KEY) {
                forgeDiv.style.display = 'none';
            }
        });
    })();

    function computeAndPaintOp(canvas, opGetter) {
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
            if (op.width() === 2 && op.isUnitary(0.009)) {
                MathPainter.paintBlochSphereRotation(painter, op, rect2);
            }
        } catch (ex) {
            painter.printParagraph(
                ex+"",
                new Rect(0, 0, canvas.width, canvas.height),
                new Point(0, 0),
                'red',
                24);
        }
    }

    function addGate(gate) {

    }

    (() => {
        const rotationCanvas = /** @type {!HTMLCanvasElement} */ document.getElementById('gate-forge-rotation-canvas');
        const txtYaw = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-yaw');
        const txtPitch = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-pitch');
        const txtRoll = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-roll');
        const txtPhase = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-rotation-phase');
        let redraw = () => computeAndPaintOp(rotationCanvas, () => {
            let f = e => e.value === '' ? 0 : parseFloat(e.value) / 360;
            let op = Matrix.identity(2).times(Complex.polar(1, f(txtPhase) * Math.PI * 2));
            op = Matrix.fromPauliRotation(0, f(txtRoll), 0).times(op);
            op = Matrix.fromPauliRotation(f(txtPitch), 0, 0).times(op);
            return Matrix.fromPauliRotation(0, 0, f(txtYaw)).times(op);
        });
        Observable.of(obsShow.observable(), ...[txtPhase, txtPitch, txtRoll, txtYaw].map(textEditObservable)).
            flatten().
            subscribe(redraw);
    })();

    (() => {
        const matrixCanvas = /** @type {!HTMLCanvasElement} */ document.getElementById('gate-forge-matrix-canvas');
        const txtMatrix = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix');
        const chkFix = /** @type {!HTMLInputElement} */ document.getElementById('gate-forge-matrix-fix');

        function parseMatrix() {
            let s = txtMatrix.value;
            if (s === '') {
                s = txtMatrix.placeholder;
            }

            // If brackets are present, use the normal parse method that enforces grouping.
            if (s.match(/[\{}\[\]]/)) {
                return Matrix.parse(s.split(/[\{\[]/).join('{').split(/[}\]]/).join('}'));
            }

            // Newlines introduce a break if one isn't already present at that location and we aren't at the end.
            s = s.split(/,?\s*\n\s*(?!$)/).join(',');
            s = s.split(/\s/).join('');
            // Ignore trailing comma.
            if (s.endsWith(',')) {
                s = s.substring(0, s.length - 1);
            }

            let parts = s.split(',').map(e => e === '' ? 0 : Complex.parse(e));

            // Pad with zeroes up to next size that makes sense.
            let n = 1 << (2*Math.max(1, Math.floor(Math.log2(Math.sqrt(parts.length)))));
            if (n < parts.length) {
                n <<= 2;
            }
            if (n > (1<<8)) {
                throw Error("Max custom matrix operation size is 4 qubits.")
            }
            return Matrix.square(...parts, ...new Array(n - parts.length).fill(0));
        }

        let redraw = () => computeAndPaintOp(matrixCanvas, () => {
            let op = parseMatrix();
            if (chkFix.checked) {
                op = op.closestUnitary(0.0001);
            }
            return op;
        });

        Observable.of(obsShow.observable(), textEditObservable(txtMatrix), Observable.elementEvent(chkFix, 'change')).
            flatten().
            throttleLatest(100).
            subscribe(redraw);
    })();
}

export { initForge }
