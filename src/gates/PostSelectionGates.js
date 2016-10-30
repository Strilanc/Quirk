import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

let PostSelectionGates = {};

let POST_SELECT_DRAWER = args => {
    if (args.isInToolbox  || args.isHighlighted) {
        GatePainting.DEFAULT_DRAWER(args);
    } else {
        args.painter.fillRect(args.rect, 'white');
        GatePainting.paintGateSymbol(args);
    }

    if (!args.isInToolbox) {
        let {x, y, w, h} = args.rect;
        args.painter.print("post-", x + w / 2, y, 'center', 'hanging', 'red', '10px sans-serif', w, h / 2);
        args.painter.print("select", x + w / 2, y + h, 'center', 'bottom', 'red', '10px sans-serif', w, h / 2);
    }
};

PostSelectionGates.PostSelectOff = Gate.fromKnownMatrix(
    "|0⟩⟨0|",
    Matrix.square(1, 0, 0, 0),
    "Post-selection Gate [Off]",
    "Keeps OFF states, discards ON states.\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectOn = Gate.fromKnownMatrix(
    "|1⟩⟨1|",
    Matrix.square(0, 0, 0, 1),
    "Post-selection Gate [On]",
    "Keeps ON states, discards OFF states.\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectPlus = Gate.fromKnownMatrix(
    "|+⟩⟨+|",
    Matrix.square(1, 1, 1, 1).times(0.5),
    "Post-selection Gate [Plus]",
    "Keeps ON+OFF states, discards ON-OFF states.\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectMinus = Gate.fromKnownMatrix(
    "|-⟩⟨-|",
    Matrix.square(1, -1, -1, 1).times(0.5),
    "Post-selection Gate [Minus]",
    "Keeps ON-OFF states, discards ON+OFF states\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectCross = Gate.fromKnownMatrix(
    "|X⟩⟨X|",
    Matrix.square(1, Complex.I.neg(), Complex.I, 1).times(0.5),
    "Post-selection Gate [Cross]",
    "Keeps ON+iOFF states, discards ON-iOFF states.\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectAntiCross = Gate.fromKnownMatrix(
    "|/⟩⟨/|",
    Matrix.square(1, Complex.I, Complex.I.neg(), 1).times(0.5),
    "Post-selection Gate [Cross]",
    "Keeps ON-iOFF states, discards ON+iOFF states.\n" +
        "Means 'restart until satisfied'.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.all = [
    PostSelectionGates.PostSelectOff,
    PostSelectionGates.PostSelectOn,
    PostSelectionGates.PostSelectPlus,
    PostSelectionGates.PostSelectMinus,
    PostSelectionGates.PostSelectCross,
    PostSelectionGates.PostSelectAntiCross
];

export {PostSelectionGates}
