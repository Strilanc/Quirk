import {GateBuilder} from "src/circuit/Gate.js"
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

PoweringGates.XForward = new GateBuilder().
    setSerializedIdAndSymbol("X^t").
    setTitle("X-Raising Gate (forward)").
    setBlurb("Right-handed cycle from no-op to X.").
    setDrawer(GatePainting.makeCycleDrawer(1, 1)).
    setEffectToTimeVaryingMatrix(XPow).
    promiseEffectIsUnitary().
    gate;

PoweringGates.XBackward = new GateBuilder().
    setSerializedIdAndSymbol("X^-t").
    setTitle("X-Raising Gate (backward)").
    setBlurb("Left-handed cycle from no-op to X.").
    setDrawer(GatePainting.makeCycleDrawer(-1, 1)).
    setEffectToTimeVaryingMatrix(t => XPow(-t)).
    promiseEffectIsUnitary().
    gate;

PoweringGates.YForward = new GateBuilder().
    setSerializedIdAndSymbol("Y^t").
    setTitle("Y-Raising Gate (forward)").
    setBlurb("Right-handed cycle from no-op to Y.").
    setDrawer(GatePainting.makeCycleDrawer(0.5, 1)).
    setEffectToTimeVaryingMatrix(YPow).
    promiseEffectIsUnitary().
    gate;

PoweringGates.YBackward = new GateBuilder().
    setSerializedIdAndSymbol("Y^-t").
    setTitle("Y-Raising Gate (backward)").
    setBlurb("Left-handed cycle from no-op to Y.").
    setDrawer(GatePainting.makeCycleDrawer(-0.5, 1)).
    setEffectToTimeVaryingMatrix(t => YPow(-t)).
    promiseEffectIsUnitary().
    gate;

PoweringGates.ZForward = new GateBuilder().
    setSerializedIdAndSymbol("Z^t").
    setTitle("Z-Raising Gate (forward)").
    setBlurb("Right-handed cycle from no-op to Z.").
    setDrawer(GatePainting.makeCycleDrawer(1, 0.5)).
    setEffectToTimeVaryingMatrix(ZPow).
    promiseEffectOnlyPhases().
    gate;

PoweringGates.ZBackward = new GateBuilder().
    setSerializedIdAndSymbol("Z^-t").
    setTitle("Z-Raising Gate (backward)").
    setBlurb("Left-handed cycle from no-op to Z.").
    setDrawer(GatePainting.makeCycleDrawer(-1, 0.5)).
    setEffectToTimeVaryingMatrix(t => ZPow(-t)).
    promiseEffectOnlyPhases().
    gate;

PoweringGates.all = [
    PoweringGates.XForward,
    PoweringGates.YForward,
    PoweringGates.ZForward,
    PoweringGates.XBackward,
    PoweringGates.YBackward,
    PoweringGates.ZBackward
];

export {PoweringGates}
