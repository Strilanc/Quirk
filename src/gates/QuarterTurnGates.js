// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Gate} from "src/circuit/Gate.js"
import {Matrix} from "src/math/Matrix.js"

let QuarterTurnGates = {};

/** @type {!Gate} */
QuarterTurnGates.SqrtXForward = Gate.fromKnownMatrix(
    "X^½",
    Matrix.fromPauliRotation(0.25, 0, 0),
    "√X Gate",
    "Principle square root of Not.");

/** @type {!Gate} */
QuarterTurnGates.SqrtXBackward = Gate.fromKnownMatrix(
    "X^-½",
    Matrix.fromPauliRotation(0.75, 0, 0),
    "X^-½ Gate",
    "Adjoint square root of Not.");

/** @type {!Gate} */
QuarterTurnGates.SqrtYForward = Gate.fromKnownMatrix(
    "Y^½",
    Matrix.fromPauliRotation(0, 0.25, 0),
    "√Y Gate",
    "Principle square root of Y.");

/** @type {!Gate} */
QuarterTurnGates.SqrtYBackward = Gate.fromKnownMatrix(
    "Y^-½",
    Matrix.fromPauliRotation(0, 0.75, 0),
    "Y^-½ Gate",
    "Adjoint square root of Y.");

/** @type {!Gate} */
QuarterTurnGates.SqrtZForward = Gate.fromKnownMatrix(
    "Z^½",
    Matrix.fromPauliRotation(0, 0, 0.25),
    "√Z Gate",
    "Principle square root of Z.\nAlso known as the 'S' gate.");

/** @type {!Gate} */
QuarterTurnGates.SqrtZBackward = Gate.fromKnownMatrix(
    "Z^-½",
    Matrix.fromPauliRotation(0, 0, 0.75),
    "Z^-½ Gate",
    "Adjoint square root of Z.");

QuarterTurnGates.all = [
    QuarterTurnGates.SqrtXForward,
    QuarterTurnGates.SqrtYForward,
    QuarterTurnGates.SqrtZForward,
    QuarterTurnGates.SqrtXBackward,
    QuarterTurnGates.SqrtYBackward,
    QuarterTurnGates.SqrtZBackward
];

export {QuarterTurnGates}
