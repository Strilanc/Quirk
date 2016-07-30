import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import Matrix from "src/math/Matrix.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"

let SwapGateHalf = Gate.fromKnownMatrix(
    "Swap",
    Matrix.square(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1),
    "Swap Gate [Half]",
    "Swaps the values of two qubits.\n(Place two in the same column.)").
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        // A swap gate half is shown as a small X (joined by a line to the other half; that's handled elsewhere).
        let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
        args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
        args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
    }).
    withCustomDisableReasonFinder((col, qubit, inputMeasureMask) => {
        let swapRows = Seq.range(col.gates.length).filter(row => col.gates[row] === SwapGateHalf);
        let n = swapRows.count();
        if (n === 1) {
            return "need\nother\nswap";
        }
        if (n > 2) {
            return "too\nmany\nswap";
        }

        let affectsMeasured = swapRows.any(r => (inputMeasureMask & (1 << r)) !== 0);
        let affectsUnmeasured = swapRows.any(r => (inputMeasureMask & (1 << r)) === 0);
        if (affectsMeasured && col.hasCoherentControl(inputMeasureMask)) {
            return "no\nremix\n(sorry)";
        }
        if (affectsMeasured && affectsUnmeasured && col.hasControl()) {
            return "no\nremix\n(sorry)";
        }

        return undefined;
    });

export default SwapGateHalf;
