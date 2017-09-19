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

import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {HalfTurnGates} from "src/gates/HalfTurnGates.js"
import {QuarterTurnGates} from "src/gates/QuarterTurnGates.js"

let Controls = {};

Controls.Control = new GateBuilder().
    setSerializedIdAndSymbol("•").
    setTitle("Control").
    setBlurb("Conditions on a qubit being ON.\nGates in the same column only apply to states meeting the condition.").
    promiseHasNoNetEffectOnStateVector().
    markAsControlExpecting(true).
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    }).
    gate;

Controls.AntiControl = new GateBuilder().
    setSerializedIdAndSymbol("◦").
    setTitle("Anti-Control").
    setBlurb("Conditions on a qubit being OFF.\nGates in the same column only apply to states meeting the condition.").
    promiseHasNoNetEffectOnStateVector().
    markAsControlExpecting(false).
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    }).
    gate;

Controls.XAntiControl = new GateBuilder().
    setSerializedId("⊕").  // The drawn +/- convention was changed, but the serialized id must stay the same.
    setSymbol("⊖").
    setTitle("X-Axis Anti-Control").
    setBlurb("Conditions on a qubit being ON+OFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markAsControlExpecting(false).
    setSetupCleanupEffectToUpdateFunc(
        HalfTurnGates.H.customOperation,
        HalfTurnGates.H.customOperation).
    setActualEffectToUpdateFunc(() => {}).
    promiseEffectIsStable().
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    }).
    gate;

Controls.XControl = new GateBuilder().
    setSerializedId("⊖").  // The drawn +/- convention was changed, but the serialized id must stay the same.
    setSymbol("⊕").
    setTitle("X-Axis Control").
    setBlurb("Conditions on a qubit being ON-OFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markAsControlExpecting(true).
    setSetupCleanupEffectToUpdateFunc(
        HalfTurnGates.H.customOperation,
        HalfTurnGates.H.customOperation).
    setActualEffectToUpdateFunc(() => {}).
    promiseEffectIsStable().
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(0, -5), p.offsetBy(0, +5));
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    }).
    gate;

Controls.YAntiControl = new GateBuilder().
    setSerializedId("⊗").  // The drawn cross/slash convention was changed, but the serialized id must stay the same.
    setSymbol("(/)").
    setTitle("Y-Axis Anti-Control").
    setBlurb("Conditions on a qubit being ON+iOFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markAsControlExpecting(false).
    setSetupCleanupEffectToUpdateFunc(
        ctx => GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXForward._knownMatrix),
        ctx => GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXBackward._knownMatrix)).
    setActualEffectToUpdateFunc(() => {}).
    promiseEffectIsStable().
    setDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        let r = 5*Math.sqrt(0.5)*1.1;
        args.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
        }
    }).
    gate;

Controls.YControl = new GateBuilder().
    setSerializedId("(/)").  // The drawn cross/slash convention was changed, but the serialized id must stay the same.
    setSymbol("⊗").
    setTitle("Y-Axis Control").
    setBlurb("Conditions on a qubit being ON-iOFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markAsControlExpecting(true).
    setSetupCleanupEffectToUpdateFunc(
        ctx => GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXForward._knownMatrix),
        ctx => GateShaders.applyMatrixOperation(ctx, QuarterTurnGates.SqrtXBackward._knownMatrix)).
    setActualEffectToUpdateFunc(() => {}).
    promiseEffectIsStable().
    setDrawer(ctx => {
        if (ctx.isInToolbox || ctx.isHighlighted) {
            GatePainting.paintBackground(ctx);
            GatePainting.paintOutline(ctx);
        }
        let p = ctx.rect.center();
        ctx.painter.fillCircle(p, 5);
        ctx.painter.strokeCircle(p, 5);
        let r = 5*Math.sqrt(0.5);
        ctx.painter.strokeLine(p.offsetBy(+r, +r), p.offsetBy(-r, -r));
        ctx.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
        if (ctx.isInToolbox || ctx.isHighlighted) {
            GatePainting.paintOutline(ctx);
        }
    }).
    gate;

Controls.all = [
    Controls.Control,
    Controls.AntiControl,
    Controls.XAntiControl,
    Controls.XControl,
    Controls.YAntiControl,
    Controls.YControl
];

export {Controls}
