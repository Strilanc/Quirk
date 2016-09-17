import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

let PoweringGates = {};

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
    "Right-handed cycle from no-op to X.").
    withCustomDrawer(GatePainting.makeCycleDrawer(0.5, 1));

PoweringGates.XBackward = Gate.fromVaryingMatrix(
    "X^-t",
    t => XPow(-t),
    "X-Raising Gate (backward)",
    "Left-handed cycle from no-op to X.").
    withCustomDrawer(GatePainting.makeCycleDrawer(-0.5, 1));

PoweringGates.YForward = Gate.fromVaryingMatrix(
    "Y^t",
    YPow,
    "Y-Raising Gate (forward)",
    "Right-handed cycle from no-op to Y.").
    withCustomDrawer(GatePainting.makeCycleDrawer(-1, 1));

PoweringGates.YBackward = Gate.fromVaryingMatrix(
    "Y^-t",
    t => YPow(-t),
    "Y-Raising Gate (backward)",
    "Left-handed cycle from no-op to Y.").
    withCustomDrawer(GatePainting.makeCycleDrawer(1, 1));

PoweringGates.ZForward = Gate.fromVaryingMatrix(
    "Z^t",
    ZPow,
    "Z-Raising Gate (forward)",
    "Right-handed cycle from no-op to Z.").
    markedAsOnlyPhasing().
    withCustomDrawer(GatePainting.makeCycleDrawer(1, 0.5));

PoweringGates.ZBackward = Gate.fromVaryingMatrix(
    "Z^-t",
    t => ZPow(-t),
    "Z-Raising Gate (backward)",
    "Left-handed cycle from no-op to Z.").
    markedAsOnlyPhasing().
    withCustomDrawer(GatePainting.makeCycleDrawer(-1, 0.5));

PoweringGates.all = [
    PoweringGates.XForward,
    PoweringGates.YForward,
    PoweringGates.ZForward,
    PoweringGates.XBackward,
    PoweringGates.YBackward,
    PoweringGates.ZBackward
];

export {PoweringGates}
