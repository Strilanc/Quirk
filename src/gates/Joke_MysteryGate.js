import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Matrix from "src/math/Matrix.js"

let MysteryGateSymbol = "?";

let MysteryGateMakerWithMatrix = matrix => Gate.fromKnownMatrix(
    MysteryGateSymbol,
    matrix,
    "Mystery Gate",
    "Every time you grab this gate out of the toolbox, it changes.\n" +
        "Duplicate gates in the circuit by holding shift before dragging.").
    withCustomDrawer(GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX);

let MysteryGateMaker = () => MysteryGateMakerWithMatrix(Matrix.square(
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5)
).closestUnitary());

export {MysteryGateSymbol, MysteryGateMaker, MysteryGateMakerWithMatrix};
