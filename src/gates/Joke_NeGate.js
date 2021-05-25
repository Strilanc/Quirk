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
import {Matrix} from "../math/Matrix.js"
import {Point} from "../math/Point.js"
import {GatePainting} from "../draw/GatePainting.js"

const NeGate = new GateBuilder().
    setSerializedId("NeGate").
    setTitle("Ne-Gate").
    setBlurb("Negates all amplitudes.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        let {x, y} = args.rect.center();
        args.painter.strokeLine(new Point(x - 6, y), new Point(x + 6, y), 'black', 2);
    }).
    setKnownEffectToMatrix(Matrix.square(-1, 0, 0, -1)).
    gate;

export {NeGate}
