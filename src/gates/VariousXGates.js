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

import {Gate} from "../circuit/Gate.js"
import {Matrix} from "../math/Matrix.js"

let VariousXGates = {};

VariousXGates.X3 = Gate.fromKnownMatrix(
    "X^⅓",
    Matrix.fromPauliRotation(1 / 6, 0, 0),
    "X^⅓ Gate",
    "Principle third root of X.");
VariousXGates.X3i = Gate.fromKnownMatrix(
    "X^-⅓",
    Matrix.fromPauliRotation(-1 / 6, 0, 0),
    "X^-⅓ Gate",
    "Adjoint third root of X.",
    undefined,
    VariousXGates.X3);
VariousXGates.X4 = Gate.fromKnownMatrix(
    "X^¼",
    Matrix.fromPauliRotation(1 / 8, 0, 0),
    "X^¼ Gate",
    "Principle fourth root of X.");
VariousXGates.X4i = Gate.fromKnownMatrix(
    "X^-¼",
    Matrix.fromPauliRotation(-1 / 8, 0, 0),
    "X^-¼ Gate",
    "Adjoint fourth root of X.",
    undefined,
    VariousXGates.X4);
VariousXGates.X8 = Gate.fromKnownMatrix(
    "X^⅛",
    Matrix.fromPauliRotation(1 / 16, 0, 0),
    "X^⅛ Gate",
    "Principle eighth root of X.");
VariousXGates.X8i = Gate.fromKnownMatrix(
    "X^-⅛",
    Matrix.fromPauliRotation(-1 / 16, 0, 0),
    "X^-⅛ Gate",
    "Adjoint eighth root of X.",
    undefined,
    VariousXGates.X8);
VariousXGates.X16 = Gate.fromKnownMatrix(
    "X^⅟₁₆",
    Matrix.fromPauliRotation(1 / 32, 0, 0),
    "X^⅟₁₆ Gate",
    "Principle sixteenth root of X.");
VariousXGates.X16i = Gate.fromKnownMatrix(
    "X^-⅟₁₆",
    Matrix.fromPauliRotation(-1 / 32, 0, 0),
    "X^-⅟₁₆ Gate",
    "Adjoint sixteenth root of X.",
    undefined,
    VariousXGates.X16);
VariousXGates.X32 = Gate.fromKnownMatrix(
    "X^⅟₃₂",
    Matrix.fromPauliRotation(1 / 64, 0, 0),
    "X^⅟₃₂ Gate",
    "Principle 32'nd root of X.");
VariousXGates.X32i = Gate.fromKnownMatrix(
    "X^-⅟₃₂",
    Matrix.fromPauliRotation(-1 / 64, 0, 0),
    "X^-⅟₃₂ Gate",
    "Adjoint 32'nd root of X.",
    undefined,
    VariousXGates.X32);

VariousXGates.all =[
    VariousXGates.X3,
    VariousXGates.X4,
    VariousXGates.X8,
    VariousXGates.X16,
    VariousXGates.X32,
    VariousXGates.X3i,
    VariousXGates.X4i,
    VariousXGates.X8i,
    VariousXGates.X16i,
    VariousXGates.X32i,
];

export {VariousXGates}
