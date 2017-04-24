import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

let ExponentiatingGates = {};

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

ExponentiatingGates.XForward = new GateBuilder().
    setSerializedIdAndSymbol("e^-iXt").
    setTitle("X-Exponentiating Gate (forward)").
    setBlurb("Right-hand rotation around the X axis.\nPasses through ±iX instead of X.").
    setDrawer(GatePainting.makeCycleDrawer(1, 1, 2)).
    setEffectToTimeVaryingMatrix(XExp).
    promiseEffectIsUnitary().
    gate;

ExponentiatingGates.XBackward = new GateBuilder().
    setSerializedIdAndSymbol("e^iXt").
    setTitle("X-Exponentiating Gate (backward)").
    setBlurb("Left-hand rotation around the X axis.\nPasses through ±iX instead of X.").
    setDrawer(GatePainting.makeCycleDrawer(-1, 1, 2)).
    setEffectToTimeVaryingMatrix(t => XExp(-t)).
    promiseEffectIsUnitary().
    gate;

ExponentiatingGates.YForward = new GateBuilder().
    setSerializedIdAndSymbol("e^-iYt").
    setTitle("Y-Exponentiating Gate (forward)").
    setBlurb("Right-hand rotation around the Y axis.\nPasses through ±iY instead of Y.").
    setDrawer(GatePainting.makeCycleDrawer(0.5, 1, 2)).
    setEffectToTimeVaryingMatrix(YExp).
    promiseEffectIsUnitary().
    gate;

ExponentiatingGates.YBackward = new GateBuilder().
    setSerializedIdAndSymbol("e^iYt").
    setTitle("Y-Exponentiating Gate (backward)").
    setBlurb("Left-hand rotation around the Y axis.\nPasses through ±iY instead of Y.").
    setDrawer(GatePainting.makeCycleDrawer(-0.5, 1, 2)).
    setEffectToTimeVaryingMatrix(t => YExp(-t)).
    promiseEffectIsUnitary().
    gate;

ExponentiatingGates.ZForward = new GateBuilder().
    setSerializedIdAndSymbol("e^-iZt").
    setTitle("Z-Exponentiating Gate (forward)").
    setBlurb("Right-hand rotation around the Z axis.\nPasses through ±iZ instead of Z.").
    setDrawer(GatePainting.makeCycleDrawer(1, 0.5, 2)).
    setEffectToTimeVaryingMatrix(ZExp).
    promiseEffectOnlyPhases().
    gate;

ExponentiatingGates.ZBackward = new GateBuilder().
    setSerializedIdAndSymbol("e^iZt").
    setTitle("Z-Exponentiating Gate (backward)").
    setBlurb("Left-hand rotation around the Z axis.\nPasses through ±iZ instead of Z.").
    setDrawer(GatePainting.makeCycleDrawer(-1, 0.5, 2)).
    setEffectToTimeVaryingMatrix(t => ZExp(-t)).
    promiseEffectOnlyPhases().
    gate;

ExponentiatingGates.all = [
    ExponentiatingGates.XBackward,
    ExponentiatingGates.YBackward,
    ExponentiatingGates.ZBackward,
    ExponentiatingGates.XForward,
    ExponentiatingGates.YForward,
    ExponentiatingGates.ZForward
];

export {ExponentiatingGates}
