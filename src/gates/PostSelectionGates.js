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

let PostSelectionGates = {};

let POST_SELECT_DRAWER = args => {
    if (args.isInToolbox  || args.isHighlighted) {
        GatePainting.DEFAULT_DRAWER(args);
    } else {
        args.painter.fillRect(args.rect, 'white');
        GatePainting.paintGateSymbol(args);
    }

    if (!args.isInToolbox) {
        let {x, y, w, h} = args.rect;
        args.painter.print("post-", x + w / 2, y, 'center', 'hanging', 'red', '10px sans-serif', w, h / 2);
        args.painter.print("select", x + w / 2, y + h, 'center', 'bottom', 'red', '10px sans-serif', w, h / 2);
    }
};

/** @type {!Gate} */
PostSelectionGates.PostSelectOff = new GateBuilder().
    setSerializedIdAndSymbol("|0⟩⟨0|").
    setTitle("Postselect Off").
    setBlurb("Keeps OFF states, discards/retries ON states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(1, 0, 0, 0)).
    gate;

/** @type {!Gate} */
PostSelectionGates.PostSelectOn = new GateBuilder().
    setAlternate(PostSelectionGates.PostSelectOff).
    setSerializedIdAndSymbol("|1⟩⟨1|").
    setTitle("Postselect On").
    setBlurb("Keeps On states, discards/retries Off states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(0, 0, 0, 1)).
    gate;

/** @type {!Gate} */
PostSelectionGates.PostSelectAntiX = new GateBuilder().
    setSerializedId("|+⟩⟨+|").  // The +/- drawing convention was switched, but the serialized id must stay the same.
    setSymbol("|+⟩⟨+|").
    setTitle("Postselect X-Off").
    setBlurb("Keeps ON+OFF states, discards/retries ON-OFF states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(1, 1, 1, 1).times(0.5)).
    gate;

/** @type {!Gate} */
PostSelectionGates.PostSelectX = new GateBuilder().
    setAlternate(PostSelectionGates.PostSelectAntiX).
    setSerializedId("|-⟩⟨-|").  // The +/- drawing convention was switched, but the serialized id must stay the same.
    setSymbol("|-⟩⟨-|").
    setTitle("Postselect X-On").
    setBlurb("Keeps ON-OFF states, discards/retries ON+OFF states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(1, -1, -1, 1).times(0.5)).
    gate;

/** @type {!Gate} */
PostSelectionGates.PostSelectAntiY = new GateBuilder().
    setSerializedId("|X⟩⟨X|").  // The cross/slash convention was switched, but the serialized id must stay the same.
    setSymbol("|i⟩⟨i|").
    setTitle("Postselect Y-Off").
    setBlurb("Keeps ON+iOFF states, discards ON-iOFF states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(1, Complex.I.neg(), Complex.I, 1).times(0.5)).
    gate;

/** @type {!Gate} */
PostSelectionGates.PostSelectY = new GateBuilder().
    setAlternate(PostSelectionGates.PostSelectAntiY).
    setSerializedId("|/⟩⟨/|").  // The cross/slash convention was switched, but the serialized id must stay the same.
    setSymbol("|-i⟩⟨-i|").
    setTitle("Postselect Y-On").
    setBlurb("Keeps ON-iOFF states, discards/retries ON+iOFF states.").
    setDrawer(POST_SELECT_DRAWER).
    setKnownEffectToMatrix(Matrix.square(1, Complex.I, Complex.I.neg(), 1).times(0.5)).
    gate;

PostSelectionGates.all = [
    PostSelectionGates.PostSelectOff,
    PostSelectionGates.PostSelectOn,
    PostSelectionGates.PostSelectAntiX,
    PostSelectionGates.PostSelectX,
    PostSelectionGates.PostSelectAntiY,
    PostSelectionGates.PostSelectY
];

export {PostSelectionGates}
