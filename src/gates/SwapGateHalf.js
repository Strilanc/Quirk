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
import {Rect} from "../math/Rect.js"
import {Seq} from "../base/Seq.js"

// Note: there is special code to handle swaps sprinkled everywhere, since it's the only gate with two paired sides.

/** @type {!Gate} */
let SwapGateHalf = new GateBuilder().
    setSerializedIdAndSymbol("Swap").
    setTitle("Swap Gate [Half]").
    setBlurb("Swaps the values of two qubits.\n(Place two in the same column.)").
    setKnownEffectToMatrix(Matrix.square(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1)).
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
            return;
        }

        // A swap gate half is shown as a small X (joined by a line to the other half; that's handled elsewhere).
        let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
        args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
        args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
    }).
    setExtraDisableReasonFinder(args => {
        let col = args.innerColumn;
        let swapRows = Seq.range(col.gates.length).filter(row => col.gates[row] === SwapGateHalf);
        let n = swapRows.count();
        if (n === 1) {
            return "need\nother\nswap";
        }
        if (n > 2) {
            return "too\nmany\nswap";
        }

        let affectsMeasured = swapRows.any(r => (args.measuredMask & (1 << r)) !== 0);
        let affectsUnmeasured = swapRows.any(r => (args.measuredMask & (1 << r)) === 0);
        if (affectsMeasured && col.hasCoherentControl(args.measuredMask)) {
            return "no\nremix\n(sorry)";
        }
        if (affectsMeasured && affectsUnmeasured && col.hasControl()) {
            return "no\nremix\n(sorry)";
        }

        return undefined;
    }).
    gate;

export {SwapGateHalf}
