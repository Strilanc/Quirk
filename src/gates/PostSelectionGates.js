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
    "Postselect Off",
    "Keeps OFF states, discards/retries ON states.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectOn = Gate.fromKnownMatrix(
    "|1⟩⟨1|",
    Matrix.square(0, 0, 0, 1),
    "Postselect On",
    "Keeps ON states, discards/retries OFF states.").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectPlus = Gate.fromKnownMatrix(
    "|-⟩⟨-|",
    Matrix.square(1, 1, 1, 1).times(0.5),
    "Postselect X-axis Negative",
    "Keeps ON+OFF states, discards/retries ON-OFF states.").
    withSerializedId("|+⟩⟨+|").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectMinus = Gate.fromKnownMatrix(
    "|+⟩⟨+|",
    Matrix.square(1, -1, -1, 1).times(0.5),
    "Postselect X-axis Positive",
    "Keeps ON-OFF states, discards/retries ON+OFF states.").
    withSerializedId("|-⟩⟨-|").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectCross = Gate.fromKnownMatrix(
    "|/⟩⟨/|",
    Matrix.square(1, Complex.I.neg(), Complex.I, 1).times(0.5),
    "Postselect Y-axis Negative",
    "Keeps ON+iOFF states, discards ON-iOFF states.").
    withSerializedId("|X⟩⟨X|").
    withCustomDrawer(POST_SELECT_DRAWER);

PostSelectionGates.PostSelectAntiCross = Gate.fromKnownMatrix(
    "|X⟩⟨X|",
    Matrix.square(1, Complex.I, Complex.I.neg(), 1).times(0.5),
    "Postselect Y-axis Positive",
    "Keeps ON-iOFF states, discards/retries ON+iOFF states.").
    withSerializedId("|/⟩⟨/|").
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
