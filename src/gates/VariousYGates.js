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

let VariousYGates = {};

VariousYGates.Y3 = Gate.fromKnownMatrix(
    "Y^⅓",
    Matrix.fromPauliRotation(0, 1 / 6, 0),
    "Y^⅓ Gate",
    "Principle third root of Y.");
VariousYGates.Y3i = Gate.fromKnownMatrix(
    "Y^-⅓",
    Matrix.fromPauliRotation(0, -1 / 6, 0),
    "Y^-⅓ Gate",
    "Adjoint third root of Y.",
    undefined,
    VariousYGates.Y3);
VariousYGates.Y4 = Gate.fromKnownMatrix(
    "Y^¼",
    Matrix.fromPauliRotation(0, 1 / 8, 0),
    "Y^¼ Gate",
    "Principle fourth root of Y.");
VariousYGates.Y4i = Gate.fromKnownMatrix(
    "Y^-¼",
    Matrix.fromPauliRotation(0, -1 / 8, 0),
    "Y^-¼ Gate",
    "Adjoint fourth root of Y.",
    undefined,
    VariousYGates.Y4);
VariousYGates.Y8 = Gate.fromKnownMatrix(
    "Y^⅛",
    Matrix.fromPauliRotation(0, 1 / 16, 0),
    "Y^⅛ Gate",
    "Principle eighth root of Y.");
VariousYGates.Y8i = Gate.fromKnownMatrix(
    "Y^-⅛",
    Matrix.fromPauliRotation(0, -1 / 16, 0),
    "Y^-⅛ Gate",
    "Adjoint eighth root of Y.",
    undefined,
    VariousYGates.Y8);
VariousYGates.Y16 = Gate.fromKnownMatrix(
    "Y^⅟₁₆",
    Matrix.fromPauliRotation(0, 1 / 32, 0),
    "Y^⅟₁₆ Gate",
    "Principle sixteenth root of Y.");
VariousYGates.Y16i = Gate.fromKnownMatrix(
    "Y^-⅟₁₆",
    Matrix.fromPauliRotation(0, -1 / 32, 0),
    "Y^-⅟₁₆ Gate",
    "Adjoint sixteenth root of Y.",
    undefined,
    VariousYGates.Y16);
VariousYGates.Y32 = Gate.fromKnownMatrix(
    "Y^⅟₃₂",
    Matrix.fromPauliRotation(0, 1 / 64, 0),
    "Y^⅟₃₂ Gate",
    "Principle 32'nd root of Y.");
VariousYGates.Y32i = Gate.fromKnownMatrix(
    "Y^-⅟₃₂",
    Matrix.fromPauliRotation(0, -1 / 64, 0),
    "Y^-⅟₃₂ Gate",
    "Adjoint 32'nd root of Y.",
    undefined,
    VariousYGates.Y32);

VariousYGates.all =[
    VariousYGates.Y3,
    VariousYGates.Y4,
    VariousYGates.Y8,
    VariousYGates.Y16,
    VariousYGates.Y32,
    VariousYGates.Y3i,
    VariousYGates.Y4i,
    VariousYGates.Y8i,
    VariousYGates.Y16i,
    VariousYGates.Y32i
];

export {VariousYGates}
