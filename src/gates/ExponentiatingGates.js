/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GateBuilder} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {Matrix} from "../math/Matrix.js"

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
    setAlternate(ExponentiatingGates.XForward).
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
    setAlternate(ExponentiatingGates.YForward).
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
    setDrawer(GatePainting.makeCycleDrawer(-1, -0.5, 2)).
    setEffectToTimeVaryingMatrix(ZExp).
    promiseEffectOnlyPhases().
    gate;

ExponentiatingGates.ZBackward = new GateBuilder().
    setAlternate(ExponentiatingGates.ZForward).
    setSerializedIdAndSymbol("e^iZt").
    setTitle("Z-Exponentiating Gate (backward)").
    setBlurb("Left-hand rotation around the Z axis.\nPasses through ±iZ instead of Z.").
    setDrawer(GatePainting.makeCycleDrawer(1, -0.5, 2)).
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

export {ExponentiatingGates, XExp, YExp, ZExp}
