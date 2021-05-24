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

/** @type {!Gate} */
const ZeroGate = new GateBuilder().
    setSerializedIdAndSymbol("0").
    setTitle("Nothing Gate").
    setBlurb("Destroys the universe.").
    setDrawer(GatePainting.makeLocationIndependentGateDrawer('#666')).
    setKnownEffectToMatrix(Matrix.square(0, 0, 0, 0)).
    gate;

export {ZeroGate}
