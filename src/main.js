// It's important that the polyfills and error fallback get loaded first!
import {} from "src/browser/Polyfills.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CooldownThrottle from "src/base/CooldownThrottle.js"
import Config from "src/Config.js"
import CycleCircuitStats from "src/circuit/CycleCircuitStats.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import HistoryPusher from "src/browser/HistoryPusher.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import RestartableRng from "src/base/RestartableRng.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"
import TouchScrollBlocker from "src/browser/TouchScrollBlocker.js"
import { initializedWglContext } from "src/webgl/WglContext.js"
import { watchDrags, isMiddleClicking, eventPosRelativeTo } from "src/browser/MouseWatcher.js"

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
let historyPusher = new HistoryPusher();
let semiStableRng = new RestartableRng();
setInterval(() => {
    semiStableRng = new RestartableRng();
}, Config.SEMI_STABLE_RANDOM_VALUE_LIFETIME_MILLIS*0.95);

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
const inspectorDiv = document.getElementById("inspectorDiv");

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));

const importantStateChangeHappened = jsonText => {
    let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    historyPusher.stateChange(jsonText, urlHash);
    document.title = `Quirk: ${inspector.displayedCircuit.circuitDefinition.readableHash()}`;
};

const snapshot = () => JSON.stringify(Serializer.toJson(inspector.displayedCircuit.circuitDefinition), null, 0);
/**
 * @param {undefined|!string} jsonText
 */
const restore = jsonText => {
    if (jsonText === undefined) {
        return;
    }
    importantStateChangeHappened(jsonText);
    inspector = inspector.withCircuitDefinition(Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText)));
    redrawThrottle.trigger();
};
/** @type {!Revision} */
let revision = Revision.startingAt(snapshot());

const getCircuitCycleTime = (() => {
    /**
     * Milliseconds.
     * @type {!number}
     */
    let _circuitCycleTime = 0;
    /**
     * Milliseconds.
     * @type {!number}
     */
    let _prevRealTime = performance.now();

    return () => {
        let nextRealTime = performance.now();
        let elapsed = (nextRealTime - _prevRealTime) / Config.CYCLE_DURATION_MS;
        _circuitCycleTime += elapsed;
        _circuitCycleTime %= 1;
        _prevRealTime = nextRealTime;
        return _circuitCycleTime;
    };
})();

let currentCircuitStatsCache =
    new CycleCircuitStats(inspector.displayedCircuit.circuitDefinition, Config.TIME_CACHE_GRANULARITY);

let desiredCanvasSizeFor = curInspector => {
    return {
        w: Math.max(canvasDiv.clientWidth, curInspector.desiredWidth()),
        h: InspectorWidget.defaultHeight(curInspector.displayedCircuit.circuitDefinition.numWires)
    };
};

/**
 * @param {!InspectorWidget} ins
 * @returns {!InspectorWidget}
 */
const syncArea = ins => {
    let size = desiredCanvasSizeFor(ins);
    ins.updateArea(new Rect(0, 0, size.w, size.h));
    return ins;
};

let scrollBlocker = new TouchScrollBlocker(canvasDiv);

/** @type {!CooldownThrottle} */
let redrawThrottle;
const scheduleRedraw = () => redrawThrottle.trigger();
let isShiftHeld = false;
const setShiftHeld = newShift => {
    if (newShift === isShiftHeld) {
        return;
    }
    isShiftHeld = newShift;
    scheduleRedraw();
};
const redrawNow = () => {
    if (!haveLoaded) {
        // Don't draw while loading. It's a huge source of false-positive circuit-load-failed errors during development.
        return;
    }

    let shown = syncArea(inspector).previewDrop();
    if (!currentCircuitStatsCache.circuitDefinition.isEqualTo(shown.displayedCircuit.circuitDefinition)) {
        // Maybe this fresh new circuit isn't failing. Clear the error tint.
        let errDivStyle = document.getElementById('error-div').style;
        errDivStyle.opacity *= 0.9;
        if (errDivStyle.opacity < 0.06) {
            errDivStyle.display = 'None'
        }

        currentCircuitStatsCache =
            new CycleCircuitStats(shown.displayedCircuit.circuitDefinition, Config.TIME_CACHE_GRANULARITY);
    }
    let stats = currentCircuitStatsCache.statsAtApproximateTime(getCircuitCycleTime());

    let size = desiredCanvasSizeFor(shown);
    canvas.width = size.w;
    canvas.height = size.h;
    let painter = new Painter(canvas, semiStableRng.restarted());
    shown.updateArea(painter.paintableArea());
    shown.paint(painter, stats, isShiftHeld);
    painter.paintDeferred();

    inspector.hand.paintCursor(painter);
    scrollBlocker.setBlockers(painter.touchBlockers, painter.desiredCursorStyle);
    canvas.style.cursor = painter.desiredCursorStyle || 'auto';

    let dt = inspector.stableDuration();
    if (dt < Infinity) {
        window.requestAnimationFrame(scheduleRedraw);
    }
};
redrawThrottle = new CooldownThrottle(redrawNow, Config.REDRAW_COOLDOWN_MILLIS);

const useInspector = (newInspector, keepInHistory) => {
    if (inspector.isEqualTo(newInspector)) {
        return false;
    }
    inspector = newInspector;
    let jsonText = snapshot();
    if (keepInHistory) {
        revision.commit(jsonText);
        importantStateChangeHappened(jsonText);
    }

    scheduleRedraw();
    return true;
};

watchDrags(canvasDiv,
    /**
     * Grab
     * @param {!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        let oldInspector = inspector;
        let newHand = oldInspector.hand.withPos(pt);
        let newInspector = syncArea(oldInspector.withHand(newHand)).afterGrabbing(ev.shiftKey);
        if (!useInspector(newInspector, false) || !newInspector.hand.isBusy()) {
            return;
        }

        // Add extra wire temporarily.
        useInspector(syncArea(oldInspector.withHand(newHand).withJustEnoughWires(newInspector.hand, 1)).
            afterGrabbing(ev.shiftKey), false);

        revision.startedWorkingOnCommit();
        ev.preventDefault();
    },
    /**
     * Cancel
     * @param {!MouseEvent|!TouchEvent} ev
     */
    ev => {
        restore(revision.cancelCommitBeingWorkedOn());
        ev.preventDefault();
    },
    /**
     * Drag
     * @param {?Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        if (!inspector.hand.isBusy()) {
            return;
        }

        let newHand = inspector.hand.withPos(pt);
        let newInspector = inspector.withHand(newHand);
        useInspector(newInspector, false);
        ev.preventDefault();
    },
    /**
     * Drop
     * @param {undefined|!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        if (!inspector.hand.isBusy()) {
            return;
        }

        let newHand = inspector.hand.withPos(pt);
        let newInspector = syncArea(inspector).withHand(newHand).afterDropping().afterTidyingUp();
        let clearHand = newInspector.hand.withPos(undefined);
        let clearInspector = newInspector.withHand(clearHand).withJustEnoughWires(clearHand, 0);
        useInspector(clearInspector, true);
        ev.preventDefault();
    });

// Middle-click to delete a gate.
canvasDiv.addEventListener('mousedown', ev => {
    if (!isMiddleClicking(ev)) {
        return;
    }
    let newHand = inspector.hand.withPos(eventPosRelativeTo(ev, canvas));
    let newInspector = syncArea(inspector).
        withHand(newHand).
        afterGrabbing(false). // Grab the gate.
        withHand(newHand). // Lose the gate.
        afterTidyingUp().
        withJustEnoughWires(newHand, 0);
    if (useInspector(newInspector, true)) {
        ev.preventDefault();
    }
});

// When mouse moves without dragging, track it (for showing hints and things).
canvasDiv.addEventListener('mousemove', ev => {
    if (!inspector.hand.isBusy()) {
        ev.preventDefault();
        let newHand = inspector.hand.withPos(eventPosRelativeTo(ev, canvas));
        let newInspector = inspector.withHand(newHand);
        useInspector(newInspector, false);
    }
});

// Resize drawn circuit as window size changes.
window.addEventListener('resize', scheduleRedraw, false);

// Keyboard shortcuts (undo, redo).
document.addEventListener("keydown", e => {
    setShiftHeld(e.shiftKey);
    const Y_KEY = 89;
    const Z_KEY = 90;
    let isUndo = e.keyCode === Z_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    let isRedo1 = e.keyCode === Z_KEY && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey;
    let isRedo2 = e.keyCode === Y_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    if (isUndo) {
        restore(revision.undo());
    }
    if (isRedo1 || isRedo2) {
        restore(revision.redo());
    }
});
document.addEventListener("keyup", e => {
    setShiftHeld(e.shiftKey);
});

// Pull initial circuit out of URL '#x=y' arguments.
const getHashParameters = () => {
    let hashText = document.location.hash.substr(1);
    let paramsMap = new Map();
    if (hashText !== "") {
        for (let keyVal of hashText.split("&")) {
            let eq = keyVal.indexOf("=");
            if (eq === -1) {
                continue;
            }
            let key = keyVal.substring(0, eq);
            let val = decodeURIComponent(keyVal.substring(eq + 1));
            paramsMap.set(key, val);
        }
    }
    return paramsMap;
};

const loadCircuitFromUrl = () => {
    try {
        historyPusher.currentStateIsMemorableButUnknown();
        let params = getHashParameters();
        if (!params.has(Config.URL_CIRCUIT_PARAM_KEY)) {
            params.set(Config.URL_CIRCUIT_PARAM_KEY, JSON.stringify(Serializer.toJson(CircuitDefinition.EMPTY)));
        }

        let jsonText = params.get(Config.URL_CIRCUIT_PARAM_KEY);
        historyPusher.currentStateIsMemorableAndEqualTo(jsonText);
        let json = JSON.parse(jsonText);
        let circuitDef = Serializer.fromJson(CircuitDefinition, json);
        useInspector(inspector.withCircuitDefinition(circuitDef), true);
        revision.clear(snapshot());
        if (circuitDef.columns.length === 0 && params.size === 1) {
            historyPusher.currentStateIsNotMemorable();
        } else {
            importantStateChangeHappened(jsonText);
        }
    } catch (ex) {
        notifyAboutRecoveryFromUnexpectedError(
            "Defaulted to an empty circuit. Failed to understand circuit from URL.",
            {document_location_hash: document.location.hash},
            ex);
    }
};

window.onpopstate = () => loadCircuitFromUrl(false);
loadCircuitFromUrl();

// If the webgl initialization is going to fail, don't fail during the module loading phase.
haveLoaded = true;
setTimeout(() => {
    initializedWglContext().onContextRestored = () => redrawThrottle.trigger();
    redrawNow();
    document.getElementById("loading-div").style.display = 'none';
}, 0);
