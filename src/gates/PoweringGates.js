import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Matrix from "src/math/Matrix.js"

let PoweringGates = {};
export default PoweringGates;

const τ = Math.PI * 2;
const XPow = t => {
    let c = Math.cos(τ * t) / 2;
    let s = Math.sin(τ * t) / 2;
    return new Matrix(2, 2, new Float32Array([0.5+c, s, 0.5-c, -s, 0.5-c, -s, 0.5+c, s]));
};
const YPow = t => {
    let c = Math.cos(τ * t) / 2;
    let s = Math.sin(τ * t) / 2;
    return new Matrix(2, 2, new Float32Array([0.5+c, s, -s, c-0.5, s, 0.5-c, 0.5+c, s]));
};
const ZPow = t => {
    let c = Math.cos(τ * t);
    let s = Math.sin(τ * t);
    return new Matrix(2, 2, new Float32Array([1, 0, 0, 0, 0, 0, c, s]));
};

PoweringGates.XForward = Gate.fromVaryingMatrix(
    "X^t",
    XPow,
    "X-Raising Gate (forward)",
    "A continuous right-handed cycle between the X gate and no-op.").
    withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER);

PoweringGates.XBackward = Gate.fromVaryingMatrix(
    "X^-t",
    t => XPow(-t),
    "X-Raising Gate (backward)",
    "A continuous left-handed cycle between the X gate and no-op.").
    withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER);

PoweringGates.YForward = Gate.fromVaryingMatrix(
    "Y^t",
    YPow,
    "Y-Raising Gate (forward)",
    "A continuous right-handed cycle between the Y gate and no-op.").
    withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER);

PoweringGates.YBackward = Gate.fromVaryingMatrix(
    "Y^-t",
    t => YPow(-t),
    "Y-Raising Gate (backward)",
    "A continuous left-handed cycle between the Y gate and no-op.").
    withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER);

PoweringGates.ZForward = Gate.fromVaryingMatrix(
    "Z^t",
    ZPow,
    "Z-Raising Gate (forward)",
    "A continuous right-handed cycle between the Z gate and no-op.",
    false,
    false).
    withCustomDrawer(GatePainting.CLOCKWISE_CYCLE_DRAWER);

PoweringGates.ZBackward = Gate.fromVaryingMatrix(
    "Z^-t",
    t => ZPow(-t),
    "Z-Raising Gate (backward)",
    "A continuous left-handed cycle between the Z gate and no-op.",
    false,
    false).
    withCustomDrawer(GatePainting.MATHWISE_CYCLE_DRAWER);
