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

import {Complex} from "../math/Complex.js"
import {GateBuilder} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {Matrix} from "../math/Matrix.js"

let MysteryGateSymbol = "?";

let MysteryGateMakerWithMatrix = matrix => new GateBuilder().
    setSerializedIdAndSymbol(MysteryGateSymbol).
    setTitle("Mystery Gate").
    setBlurb("Different every time.\n(Use shift+drag to copy circuit gates.)").
    setDrawer(GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX).
    setKnownEffectToMatrix(matrix).
    gate;

let MysteryGateMaker = () => MysteryGateMakerWithMatrix(Matrix.square(
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5)
).closestUnitary(0.00001));

export {MysteryGateSymbol, MysteryGateMaker, MysteryGateMakerWithMatrix};
