import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import Matrix from "src/math/Matrix.js"

let ExponentiatingGates = {};
export default ExponentiatingGates;

const τ = Math.PI * 2;
const XExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, 0, 0, -s, 0, -s, c, 0]));
};
const YExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, 0, -s, 0, s, 0, c, 0]));
};
const ZExp = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([c, -s, 0, 0, 0, 0, c, s]));
};

ExponentiatingGates.XForward = Gate.fromVaryingMatrix(
    "e^-iXt",
    XExp,
    "X-Exponentiating Gate (forward)",
    "A continuous right-handed rotation around the X axis.\nPasses through ±iX instead of X.").
    withCustomDrawer(GatePainting.makeCycleDrawer(0.5, 1, 2));

ExponentiatingGates.XBackward = Gate.fromVaryingMatrix(
    "e^iXt",
    t => XExp(-t),
    "X-Exponentiating Gate (backward)",
    "A continuous left-handed rotation around the X axis.\nPasses through ±iX instead of X.").
    withCustomDrawer(GatePainting.makeCycleDrawer(-0.5, 1, 2));

ExponentiatingGates.YForward = Gate.fromVaryingMatrix(
    "e^-iYt",
    YExp,
    "Y-Exponentiating Gate (forward)",
    "A continuous right-handed rotation around the Y axis.\nPasses through ±iY instead of Y.").
    withCustomDrawer(GatePainting.makeCycleDrawer(-1, 1, 2));

ExponentiatingGates.YBackward = Gate.fromVaryingMatrix(
    "e^iYt",
    t => YExp(-t),
    "Y-Exponentiating Gate (backward)",
    "A continuous left-handed rotation around the Y axis.\nPasses through ±iY instead of Y.").
    withCustomDrawer(GatePainting.makeCycleDrawer(1, 1, 2));

ExponentiatingGates.ZForward = Gate.fromVaryingMatrix(
    "e^-iZt",
    ZExp,
    "Z-Exponentiating Gate (forward)",
    "A continuous right-handed rotation around the Z axis.\nPasses through ±iZ instead of Z.").
    markedAsOnlyPhasing().
    withCustomDrawer(GatePainting.makeCycleDrawer(1, 0.5, 2));

ExponentiatingGates.ZBackward = Gate.fromVaryingMatrix(
    "e^iZt",
    t => ZExp(-t),
    "Z-Exponentiating Gate (backward)",
    "A continuous left-handed rotation around the Z axis.\nPasses through ±iZ instead of Z.").
    markedAsOnlyPhasing().
    withCustomDrawer(GatePainting.makeCycleDrawer(-1, 0.5, 2));

ExponentiatingGates.all = [
    ExponentiatingGates.XBackward,
    ExponentiatingGates.YBackward,
    ExponentiatingGates.ZBackward,
    ExponentiatingGates.XForward,
    ExponentiatingGates.YForward,
    ExponentiatingGates.ZForward
];
