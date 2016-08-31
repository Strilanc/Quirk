import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import Matrix from "src/math/Matrix.js"

let MysteryGateSymbol = "?";

let MysteryGateMakerWithMatrix = matrix => Gate.fromKnownMatrix(
    MysteryGateSymbol,
    matrix,
    "Mystery Gate",
    "Different every time.\n(Use shift+drag to copy circuit gates.)").
    withCustomDrawer(GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX);

let MysteryGateMaker = () => MysteryGateMakerWithMatrix(Matrix.square(
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5)
).closestUnitary());

export {MysteryGateSymbol, MysteryGateMaker, MysteryGateMakerWithMatrix};
