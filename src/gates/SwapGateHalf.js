import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"
import {Rect} from "src/math/Rect.js"
import {Seq} from "src/base/Seq.js"

// Note: there is special code to handle swaps sprinkled everywhere, since it's the only gate with two paired sides.

/** @type {!Gate} */
let SwapGateHalf = new GateBuilder().
    setSerializedIdAndSymbol("Swap").
    setTitle("Swap Gate [Half]").
    setBlurb("Swaps the values of two qubits.\n(Place two in the same column.)").
    setKnownEffectToMatrix(Matrix.square(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1)).
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        // A swap gate half is shown as a small X (joined by a line to the other half; that's handled elsewhere).
        let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
        args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
        args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
    }).
    setExtraDisableReasonFinder(args => {
        let col = args.innerColumn;
        let swapRows = Seq.range(col.gates.length).filter(row => col.gates[row] === SwapGateHalf);
        let n = swapRows.count();
        if (n === 1) {
            return "need\nother\nswap";
        }
        if (n > 2) {
            return "too\nmany\nswap";
        }

        let affectsMeasured = swapRows.any(r => (args.measuredMask & (1 << r)) !== 0);
        let affectsUnmeasured = swapRows.any(r => (args.measuredMask & (1 << r)) === 0);
        if (affectsMeasured && col.hasCoherentControl(args.measuredMask)) {
            return "no\nremix\n(sorry)";
        }
        if (affectsMeasured && affectsUnmeasured && col.hasControl()) {
            return "no\nremix\n(sorry)";
        }

        return undefined;
    }).
    gate;

export {SwapGateHalf}
