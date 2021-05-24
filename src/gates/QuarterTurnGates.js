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

import {Gate, GateBuilder} from "../circuit/Gate.js"
import {Matrix} from "../math/Matrix.js"

let QuarterTurnGates = {};

/** @type {!Gate} */
QuarterTurnGates.SqrtXForward = new GateBuilder().
    setSerializedIdAndSymbol('X^½').
    setTitle("√X Gate").
    setBlurb("Principle square root of Not.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0.25, 0, 0)).
    gate;

/** @type {!Gate} */
QuarterTurnGates.SqrtXBackward = new GateBuilder().
    setAlternate(QuarterTurnGates.SqrtXForward).
    setSerializedIdAndSymbol('X^-½').
    setTitle("X^-½ Gate").
    setBlurb("Adjoint square root of Not.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0.75, 0, 0)).
    gate;

/** @type {!Gate} */
QuarterTurnGates.SqrtYForward = new GateBuilder().
    setSerializedIdAndSymbol('Y^½').
    setTitle("√Y Gate").
    setBlurb("Principle square root of Y.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0, 0.25, 0)).
    gate;

/** @type {!Gate} */
QuarterTurnGates.SqrtYBackward = new GateBuilder().
    setAlternate(QuarterTurnGates.SqrtYForward).
    setSerializedIdAndSymbol('Y^-½').
    setTitle("Y^-½ Gate").
    setBlurb("Adjoint square root of Y.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0, 0.75, 0)).
    gate;

/** @type {!Gate} */
QuarterTurnGates.SqrtZForward = new GateBuilder().
    setSerializedId('Z^½').
    setSymbol('S').
    setTitle("√Z Gate").
    setBlurb("Principle square root of Z.\nAlso known as the 'S' gate.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0, 0, 0.25)).
    gate;

/** @type {!Gate} */
QuarterTurnGates.SqrtZBackward = new GateBuilder().
    setAlternate(QuarterTurnGates.SqrtZForward).
    setSerializedId('Z^-½').
    setSymbol('S^-1').
    setTitle("Z^-½ Gate").
    setBlurb("Adjoint square root of Z.").
    setKnownEffectToMatrix(Matrix.fromPauliRotation(0, 0, 0.75)).
    gate;

QuarterTurnGates.all = [
    QuarterTurnGates.SqrtXForward,
    QuarterTurnGates.SqrtYForward,
    QuarterTurnGates.SqrtZForward,
    QuarterTurnGates.SqrtXBackward,
    QuarterTurnGates.SqrtYBackward,
    QuarterTurnGates.SqrtZBackward
];

export {QuarterTurnGates}
