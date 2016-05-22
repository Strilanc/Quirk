import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"

/**
 * Gates that correspond to 180 degree rotations around the Bloch sphere, so they're their own inverses.
 */
let HalfTurnGates = {};
export default HalfTurnGates;

/**
 * The X gate is drawn as a crossed circle when it has controls.
 * @param {!GateDrawParams} args
 */
function NOT_DRAWER(args) {
    let hasSingleWireControl =
        args.positionInCircuit !== undefined &&
        args.stats.circuitDefinition.colHasSingleWireControl(args.positionInCircuit.col);
    let hasDoubleWireControl =
        args.positionInCircuit !== undefined &&
        args.stats.circuitDefinition.colHasDoubleWireControl(args.positionInCircuit.col);
    if ((!hasSingleWireControl && !hasDoubleWireControl) || args.isHighlighted) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    let drawArea = args.rect.scaledOutwardBy(0.6);
    args.painter.fillCircle(drawArea.center(), drawArea.w / 2);
    args.painter.strokeCircle(drawArea.center(), drawArea.w / 2);
    if (hasSingleWireControl) {
        args.painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
    }
    if (hasDoubleWireControl) {
        args.painter.strokeLine(drawArea.topCenter().offsetBy(-1, 0), drawArea.bottomCenter().offsetBy(-1, 0));
        args.painter.strokeLine(drawArea.topCenter().offsetBy(+1, 0), drawArea.bottomCenter().offsetBy(+1, 0));
    }
    let isMeasured = args.stats.circuitDefinition.locIsMeasured(
        new Point(args.positionInCircuit.col, args.positionInCircuit.row));
    if (isMeasured) {
        args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, -1), drawArea.centerRight().offsetBy(0, -1));
        args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, +1), drawArea.centerRight().offsetBy(0, +1));
    } else {
        args.painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
    }
}

HalfTurnGates.X = Gate.fromKnownMatrix(
    "X",
    Matrix.PAULI_X,
    "Pauli X Gate",
    "The NOT gate.\nToggles between ON and OFF.").
    withCustomDrawer(NOT_DRAWER);

HalfTurnGates.Y = Gate.fromKnownMatrix(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "A combination of the X and Z gates.");

HalfTurnGates.Z = Gate.fromKnownMatrix(
    "Z",
    Matrix.PAULI_Z,
    "Pauli Z Gate",
    "The phase flip gate.\nNegates phases when the qubit is ON.");

HalfTurnGates.H = Gate.fromKnownMatrix(
    "H",
    Matrix.HADAMARD,
    "Hadamard Gate",
    "Creates simple superpositions.\n" +
    "Maps ON to ON + OFF.\n" +
    "Maps OFF to ON - OFF.");

HalfTurnGates.all = [
    HalfTurnGates.X,
    HalfTurnGates.Y,
    HalfTurnGates.Z,
    HalfTurnGates.H
];
