import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {ketArgs, ketShader, ketShaderPermute} from "src/circuit/KetShaderUtil.js"

/**
 * Gates that correspond to 180 degree rotations around the Bloch sphere, so they're their own inverses.
 */
let HalfTurnGates = {};

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

let xShader = ketShaderPermute('', 'return 1.0-out_id;', 1);
HalfTurnGates.X = Gate.fromKnownMatrix(
    "X",
    Matrix.PAULI_X,
    "Pauli X Gate",
    "The NOT gate.\nToggles between ON and OFF.").
    withCustomDrawer(NOT_DRAWER).
    withCustomShader(args => xShader.withArgs(...ketArgs(args)));

let yShader = ketShader('', 'vec2 v = inp(1.0-out_id); return (out_id*2.0 - 1.0)*vec2(-v.y, v.x);', 1);
HalfTurnGates.Y = Gate.fromKnownMatrix(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "A combination of the X and Z gates.").
    withCustomShader(args => yShader.withArgs(...ketArgs(args)));

let zShader = ketShader('', 'return amp*(1.0 - out_id*2.0);', 1);
HalfTurnGates.Z = Gate.fromKnownMatrix(
    "Z",
    Matrix.PAULI_Z,
    "Pauli Z Gate",
    "The phase flip gate.\nNegates phases when the qubit is ON.").
    withCustomShader(args => zShader.withArgs(...ketArgs(args)));

let hShader = ketShader('', 'return 0.7071067811865476*(amp*(1.0-2.0*out_id) + inp(1.0-out_id));', 1);
HalfTurnGates.H = Gate.fromKnownMatrix(
    "H",
    Matrix.HADAMARD,
    "Hadamard Gate",
    "Creates simple superpositions.\n" +
    "Maps ON to ON + OFF.\n" +
    "Maps OFF to ON - OFF.").
    withCustomShader(args => hShader.withArgs(...ketArgs(args)));

HalfTurnGates.all = [
    HalfTurnGates.X,
    HalfTurnGates.Y,
    HalfTurnGates.Z,
    HalfTurnGates.H
];

export {HalfTurnGates}
