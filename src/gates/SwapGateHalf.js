import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Matrix from "src/math/Matrix.js"
import Rect from "src/math/Rect.js"

let SwapGateHalf = Gate.fromKnownMatrix(
    "Swap",
    Matrix.square(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1),
    "Swap Gate [Half]",
    "Swaps the values of two qubits.\nPlace two swap gate halves in the same column to form a swap gate.").
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        // A swap gate half is shown as a small X (joined by a line to the other half; that's handled elsewhere).
        let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
        args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
        args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
    });

export default SwapGateHalf;
