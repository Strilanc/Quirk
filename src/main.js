// It's important that the polyfills and error fallback get loaded first!
import {} from "src/browser/Polyfills.js"
import {hookErrorHandler} from "src/fallback.js"
hookErrorHandler();
import {} from "src/issues.js"

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
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
import {Observable, ObservableValue, ObservableSource} from "src/base/Obs.js"
import {initExports, obsExportsIsShowing} from "src/ui/exports.js"
import {initForge, obsForgeIsShowing} from "src/ui/forge.js"
import {initUndoRedo} from "src/ui/undo.js"
import {initClear} from "src/ui/clear.js"
import {initUrlCircuitSync} from "src/ui/url.js"
import {initTitleSync} from "src/ui/title.js"
import {simulate} from "src/ui/sim.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {GATE_CIRCUIT_DRAWER} from "src/ui/DisplayedCircuit.js"
initSerializer(GatePainting.MATRIX_DRAWER, GATE_CIRCUIT_DRAWER);

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
/** @type {!Revision} */
let revision = Revision.startingAt(displayed.get().snapshot());

revision.latestActiveCommit().subscribe(jsonText => {
    let circuitDef = fromJsonText_CircuitDefinition(jsonText);
    let newInspector = displayed.get().withCircuitDefinition(circuitDef);
    displayed.set(newInspector);
});

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
    let stats = simulate(shown.displayedCircuit.circuitDefinition);

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

redrawThrottle = new CooldownThrottle(redrawNow, Config.REDRAW_COOLDOWN_MILLIS, true);
window.addEventListener('resize', () => redrawThrottle.trigger(), false);
displayed.observable().subscribe(() => redrawThrottle.trigger());

watchDrags(canvasDiv,
    /**
     * Grab
     * @param {!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        let oldInspector = displayed.get();
        let newHand = oldInspector.hand.withPos(pt);
        let newInspector = syncArea(oldInspector.withHand(newHand)).afterGrabbing(ev.shiftKey, ev.ctrlKey);
        if (displayed.get().isEqualTo(newInspector) || !newInspector.hand.isBusy()) {
            return;
        }

        // Add extra wire temporarily.
        revision.startedWorkingOnCommit();
        displayed.set(
            syncArea(oldInspector.withHand(newHand).withJustEnoughWires(newInspector.hand, 1)).
                afterGrabbing(ev.shiftKey, ev.ctrlKey));

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
    let newHand = displayed.get().hand.withPos(eventPosRelativeTo(ev, canvas));
    let newInspector = syncArea(displayed.get()).
        withHand(newHand).
        afterGrabbing(false, false). // Grab the gate.
        withHand(newHand). // Lose the gate.
        afterTidyingUp().
        withJustEnoughWires(newHand, 0);
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
initExports(revision, obsIsAnyOverlayShowing.observable());
initForge(revision, obsIsAnyOverlayShowing.observable());
initUndoRedo(revision, obsIsAnyOverlayShowing.observable());
initClear(revision, obsIsAnyOverlayShowing.observable());
initTitleSync(revision);
obsForgeIsShowing.zipLatest(obsExportsIsShowing, (e1, e2) => e1 || e2).whenDifferent().subscribe(e => {
    obsIsAnyOverlayShowing.send(e);
    canvasDiv.tabIndex = e ? -1 : 0;
    document.getElementById('about-link').tabIndex = e ? -1 : undefined;
});

// If the webgl initialization is going to fail, don't fail during the module loading phase.
haveLoaded = true;
setTimeout(() => {
    inspectorDiv.style.display = 'block';
    redrawNow();
    document.getElementById("loading-div").style.display = 'none';
    try {
        initializedWglContext().onContextRestored = () => redrawThrottle.trigger();
    } catch (ex) {
        // If that failed, the user is already getting warnings about WebGL not being supported.
        // Just silently log it.
        console.error(ex);
    }
}, 0);
