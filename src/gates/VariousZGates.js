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

let VariousZGates = {};

VariousZGates.Z3 = Gate.fromKnownMatrix(
    "Z^⅓",
    Matrix.fromPauliRotation(0, 0, 1 / 6),
    "Z^⅓ Gate",
    "Principle third root of Z.");
VariousZGates.Z3i = Gate.fromKnownMatrix(
    "Z^-⅓",
    Matrix.fromPauliRotation(0, 0, -1 / 6),
    "Z^-⅓ Gate",
    "Adjoint third root of Z.",
    undefined,
    VariousZGates.Z3);
VariousZGates.Z4 = Gate.fromKnownMatrix(
    "T",
    Matrix.fromPauliRotation(0, 0, 1 / 8),
    "Z^¼ Gate",
    "Principle fourth root of Z.",
    "Z^¼");
VariousZGates.Z4i = Gate.fromKnownMatrix(
    "T^-1",
    Matrix.fromPauliRotation(0, 0, -1 / 8),
    "Z^-¼ Gate",
    "Adjoint fourth root of Z.",
    "Z^-¼",
    VariousZGates.Z4);
VariousZGates.Z8 = Gate.fromKnownMatrix(
    "Z^⅛",
    Matrix.fromPauliRotation(0, 0, 1 / 16),
    "Z^⅛ Gate",
    "Principle eighth root of Z.");
VariousZGates.Z8i = Gate.fromKnownMatrix(
    "Z^-⅛",
    Matrix.fromPauliRotation(0, 0, -1 / 16),
    "Z^-⅛ Gate",
    "Adjoint eighth root of Z.",
    undefined,
    VariousZGates.Z8);
VariousZGates.Z16 = Gate.fromKnownMatrix(
    "Z^⅟₁₆",
    Matrix.fromPauliRotation(0, 0, 1 / 32),
    "Z^⅟₁₆ Gate",
    "Principle 16'th root of Z.");
VariousZGates.Z16i = Gate.fromKnownMatrix(
    "Z^-⅟₁₆",
    Matrix.fromPauliRotation(0, 0, -1 / 32),
    "Z^-⅟₁₆ Gate",
    "Adjoint 16'th root of Z.",
    undefined,
    VariousZGates.Z16);

VariousZGates.Z32 = Gate.fromKnownMatrix(
    "Z^⅟₃₂",
    Matrix.fromPauliRotation(0, 0, 1 / 64),
    "Z^⅟₃₂ Gate",
    "Principle 32'nd root of Z.");
VariousZGates.Z64 = Gate.fromKnownMatrix(
    "Z^⅟₆₄",
    Matrix.fromPauliRotation(0, 0, 1 / 128),
    "Z^⅟₆₄ Gate",
    "Principle 64'th root of Z.");
VariousZGates.Z128 = Gate.fromKnownMatrix(
    "Z^⅟₁₂₈",
    Matrix.fromPauliRotation(0, 0, 1 / 256),
    "Z^⅟₁₂₈ Gate",
    "Principle 128'th root of Z.");

VariousZGates.all =[
    VariousZGates.Z3,
    VariousZGates.Z4,
    VariousZGates.Z8,
    VariousZGates.Z16,
    VariousZGates.Z32,
    VariousZGates.Z64,
    VariousZGates.Z128,
    VariousZGates.Z3i,
    VariousZGates.Z4i,
    VariousZGates.Z8i,
    VariousZGates.Z16i
];

export {VariousZGates}
