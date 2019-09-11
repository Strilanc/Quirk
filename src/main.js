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

// It's important that the polyfills and error fallback get loaded first!
import {} from "src/browser/Polyfills.js"
import {hookErrorHandler} from "src/fallback.js"
hookErrorHandler();
import {doDetectIssues} from "src/issues.js"
doDetectIssues();

import {CircuitStats} from "src/circuit/CircuitStats.js"
import {CooldownThrottle} from "src/base/CooldownThrottle.js"
import {Config} from "src/Config.js"
import {DisplayedInspector} from "src/ui/DisplayedInspector.js"
import {Painter} from "src/draw/Painter.js"
import {Rect} from "src/math/Rect.js"
import {RestartableRng} from "src/base/RestartableRng.js"
import {Revision} from "src/base/Revision.js"
import {initSerializer, fromJsonText_CircuitDefinition} from "src/circuit/Serializer.js"
import {TouchScrollBlocker} from "src/browser/TouchScrollBlocker.js"
import {Util} from "src/base/Util.js"
import {initializedWglContext} from "src/webgl/WglContext.js"
import {watchDrags, isMiddleClicking, eventPosRelativeTo} from "src/browser/MouseWatcher.js"
import {ObservableValue, ObservableSource} from "src/base/Obs.js"
import {initExports, obsExportsIsShowing} from "src/ui/exports.js"
import {initForge, obsForgeIsShowing} from "src/ui/forge.js"
import {initMenu, obsMenuIsShowing, closeMenu} from "src/ui/menu.js"
import {initUndoRedo} from "src/ui/undo.js"
import {initClear} from "src/ui/clear.js"
import {initUrlCircuitSync} from "src/ui/url.js"
import {initTitleSync} from "src/ui/title.js"
import {simulate} from "src/ui/sim.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {GATE_CIRCUIT_DRAWER} from "src/ui/DisplayedCircuit.js"
import {GateColumn} from "src/circuit/GateColumn.js";
import {Point} from "src/math/Point.js";
initSerializer(
    GatePainting.LABEL_DRAWER,
    GatePainting.MATRIX_DRAWER,
    GATE_CIRCUIT_DRAWER,
    GatePainting.LOCATION_INDEPENDENT_GATE_DRAWER);

const canvasDiv = document.getElementById("canvasDiv");

//noinspection JSValidateTypes
/** @type {!HTMLCanvasElement} */
const canvas = document.getElementById("drawCanvas");
//noinspection JSValidateTypes
if (!canvas) {
    throw new Error("Couldn't find 'drawCanvas'");
}
canvas.width = canvasDiv.clientWidth;
canvas.height = window.innerHeight*0.9;
let haveLoaded = false;
const semiStableRng = (() => {
    const target = {cur: new RestartableRng()};
    let cycleRng;
    cycleRng = () => {
        target.cur = new RestartableRng();
        //noinspection DynamicallyGeneratedCodeJS
        setTimeout(cycleRng, Config.SEMI_STABLE_RANDOM_VALUE_LIFETIME_MILLIS*0.99);
    };
    cycleRng();
    return target;
})();

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
const inspectorDiv = document.getElementById("inspectorDiv");

/** @type {ObservableValue.<!DisplayedInspector>} */
const displayed = new ObservableValue(
    DisplayedInspector.empty(new Rect(0, 0, canvas.clientWidth, canvas.clientHeight)));
const mostRecentStats = new ObservableValue(CircuitStats.EMPTY);
/** @type {!Revision} */
let revision = Revision.startingAt(displayed.get().snapshot());

revision.latestActiveCommit().subscribe(jsonText => {
    let circuitDef = fromJsonText_CircuitDefinition(jsonText);
    let newInspector = displayed.get().withCircuitDefinition(circuitDef);
    displayed.set(newInspector);
});

/**
 * @param {!DisplayedInspector} curInspector
 * @returns {{w: number, h: !number}}
 */
let desiredCanvasSizeFor = curInspector => {
    return {
        w: Math.max(canvasDiv.clientWidth, curInspector.desiredWidth()),
        h: curInspector.desiredHeight()
    };
};

/**
 * @param {!DisplayedInspector} ins
 * @returns {!DisplayedInspector}
 */
const syncArea = ins => {
    let size = desiredCanvasSizeFor(ins);
    ins.updateArea(new Rect(0, 0, size.w, size.h));
    return ins;
};

// Gradually fade out old errors as user manipulates circuit.
displayed.observable().
    map(e => e.displayedCircuit.circuitDefinition).
    whenDifferent(Util.CUSTOM_IS_EQUAL_TO_EQUALITY).
    subscribe(() => {
        let errDivStyle = document.getElementById('error-div').style;
        errDivStyle.opacity *= 0.9;
        if (errDivStyle.opacity < 0.06) {
            errDivStyle.display = 'None'
        }
    });

/** @type {!CooldownThrottle} */
let redrawThrottle;
const scrollBlocker = new TouchScrollBlocker(canvasDiv);
const redrawNow = () => {
    if (!haveLoaded) {
        // Don't draw while loading. It's a huge source of false-positive circuit-load-failed errors during development.
        return;
    }

    let shown = syncArea(displayed.get()).previewDrop();
    if (displayed.get().hand.isHoldingSomething() && !shown.hand.isHoldingSomething()) {
        shown = shown.withHand(shown.hand.withHeldGateColumn(new GateColumn([]), new Point(0, 0)))
    }
    let stats = simulate(shown.displayedCircuit.circuitDefinition);
    mostRecentStats.set(stats);

    let size = desiredCanvasSizeFor(shown);
    canvas.width = size.w;
    canvas.height = size.h;
    let painter = new Painter(canvas, semiStableRng.cur.restarted());
    shown.updateArea(painter.paintableArea());
    shown.paint(painter, stats);
    painter.paintDeferred();

    displayed.get().hand.paintCursor(painter);
    scrollBlocker.setBlockers(painter.touchBlockers, painter.desiredCursorStyle);
    canvas.style.cursor = painter.desiredCursorStyle || 'auto';

    let dt = displayed.get().stableDuration();
    if (dt < Infinity) {
        window.requestAnimationFrame(() => redrawThrottle.trigger());
    }
};

redrawThrottle = new CooldownThrottle(redrawNow, Config.REDRAW_COOLDOWN_MILLIS, 0.1, true);
window.addEventListener('resize', () => redrawThrottle.trigger(), false);
displayed.observable().subscribe(() => redrawThrottle.trigger());

/** @type {undefined|!string} */
let clickDownGateButtonKey = undefined;
canvasDiv.addEventListener('click', ev => {
    let pt = eventPosRelativeTo(ev, canvasDiv);
    let curInspector = displayed.get();
    if (curInspector.tryGetHandOverButtonKey() !== clickDownGateButtonKey) {
        return;
    }
    let clicked = syncArea(curInspector.withHand(curInspector.hand.withPos(pt))).tryClick();
    if (clicked !== undefined) {
        revision.commit(clicked.afterTidyingUp().snapshot());
    }
});

watchDrags(canvasDiv,
    /**
     * Grab
     * @param {!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        let oldInspector = displayed.get();
        let newHand = oldInspector.hand.withPos(pt);
        let newInspector = syncArea(oldInspector.withHand(newHand));
        clickDownGateButtonKey = (
            ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey ? undefined : newInspector.tryGetHandOverButtonKey());
        if (clickDownGateButtonKey !== undefined) {
            displayed.set(newInspector);
            return;
        }

        newInspector = newInspector.afterGrabbing(ev.shiftKey, ev.ctrlKey || ev.metaKey);
        if (displayed.get().isEqualTo(newInspector) || !newInspector.hand.isBusy()) {
            return;
        }

        // Add extra wire temporarily.
        revision.startedWorkingOnCommit();
        displayed.set(
            syncArea(oldInspector.withHand(newHand).withJustEnoughWires(newInspector.hand, 1)).
                afterGrabbing(ev.shiftKey, ev.ctrlKey || ev.metaKey, false, ev.altKey));

        ev.preventDefault();
    },
    /**
     * Cancel
     * @param {!MouseEvent|!TouchEvent} ev
     */
    ev => {
        revision.cancelCommitBeingWorkedOn();
        ev.preventDefault();
    },
    /**
     * Drag
     * @param {undefined|!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        if (!displayed.get().hand.isBusy()) {
            return;
        }

        let newHand = displayed.get().hand.withPos(pt);
        let newInspector = displayed.get().withHand(newHand);
        displayed.set(newInspector);
        ev.preventDefault();
    },
    /**
     * Drop
     * @param {undefined|!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        if (!displayed.get().hand.isBusy()) {
            return;
        }

        let newHand = displayed.get().hand.withPos(pt);
        let newInspector = syncArea(displayed.get()).withHand(newHand).afterDropping().afterTidyingUp();
        let clearHand = newInspector.hand.withPos(undefined);
        let clearInspector = newInspector.withJustEnoughWires(clearHand, 0);
        revision.commit(clearInspector.snapshot());
        ev.preventDefault();
    });

// Middle-click to delete a gate.
canvasDiv.addEventListener('mousedown', ev => {
    if (!isMiddleClicking(ev)) {
        return;
    }
    let cur = syncArea(displayed.get());
    let initOver = cur.tryGetHandOverButtonKey();
    let newHand = cur.hand.withPos(eventPosRelativeTo(ev, canvas));
    let newInspector;
    if (initOver !== undefined && initOver.startsWith('wire-init-')) {
        let newCircuit = cur.displayedCircuit.circuitDefinition.withSwitchedInitialStateOn(
            parseInt(initOver.substr(10)), 0);
        newInspector = cur.withCircuitDefinition(newCircuit).withHand(newHand).afterTidyingUp();
    } else {
        newInspector = cur.
            withHand(newHand).
            afterGrabbing(false, false, true, false). // Grab the gate.
            withHand(newHand). // Lose the gate.
            afterTidyingUp().
            withJustEnoughWires(newHand, 0);
    }
    if (!displayed.get().isEqualTo(newInspector)) {
        revision.commit(newInspector.snapshot());
        ev.preventDefault();
    }
});

// When mouse moves without dragging, track it (for showing hints and things).
canvasDiv.addEventListener('mousemove', ev => {
    if (!displayed.get().hand.isBusy()) {
        let newHand = displayed.get().hand.withPos(eventPosRelativeTo(ev, canvas));
        let newInspector = displayed.get().withHand(newHand);
        displayed.set(newInspector);
    }
});
canvasDiv.addEventListener('mouseleave', () => {
    if (!displayed.get().hand.isBusy()) {
        let newHand = displayed.get().hand.withPos(undefined);
        let newInspector = displayed.get().withHand(newHand);
        displayed.set(newInspector);
    }
});

let obsIsAnyOverlayShowing = new ObservableSource();
initUrlCircuitSync(revision);
initExports(revision, mostRecentStats, obsIsAnyOverlayShowing.observable());
initForge(revision, obsIsAnyOverlayShowing.observable());
initUndoRedo(revision, obsIsAnyOverlayShowing.observable());
initClear(revision, obsIsAnyOverlayShowing.observable());
initMenu(revision, obsIsAnyOverlayShowing.observable());
initTitleSync(revision);
obsForgeIsShowing.
    zipLatest(obsExportsIsShowing, (e1, e2) => e1 || e2).
    zipLatest(obsMenuIsShowing, (e1, e2) => e1 || e2).
    whenDifferent().
    subscribe(e => {
        obsIsAnyOverlayShowing.send(e);
        canvasDiv.tabIndex = e ? -1 : 0;
    });

// If the webgl initialization is going to fail, don't fail during the module loading phase.
haveLoaded = true;
setTimeout(() => {
    inspectorDiv.style.display = 'block';
    redrawNow();
    document.getElementById("loading-div").style.display = 'none';
    document.getElementById("close-menu-button").style.display = 'block';
    if (!displayed.get().displayedCircuit.circuitDefinition.isEmpty()) {
        closeMenu();
    }

    try {
        initializedWglContext().onContextRestored = () => redrawThrottle.trigger();
    } catch (ex) {
        // If that failed, the user is already getting warnings about WebGL not being supported.
        // Just silently log it.
        console.error(ex);
    }
}, 0);
