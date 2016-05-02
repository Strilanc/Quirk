import {} from "src/fallback.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CooldownThrottle from "src/base/CooldownThrottle.js"
import Config from "src/Config.js"
import CycleCircuitStats from "src/circuit/CycleCircuitStats.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import { initializedWglContext } from "src/webgl/WglContext.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"
import { watchDrags, isMiddleClicking, eventPosRelativeTo } from "src/widgets/MouseUtil.js"

const canvasDiv = document.getElementById("canvasDiv");

//noinspection JSValidateTypes
/** @type {!HTMLCanvasElement} */
const canvas = document.getElementById("drawCanvas");
//noinspection JSValidateTypes
if (canvas === null) {
    throw new Error("Couldn't find 'drawCanvas'");
}
canvas.width = canvasDiv.clientWidth;
canvas.height = window.innerHeight;
let haveLoaded = false;

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
const inspectorDiv = document.getElementById("inspectorDiv");

/** @type {null|!string} */
let wantToPushStateIfDiffersFrom = null;

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(
    Config.MIN_WIRE_COUNT,
    new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));

let historyFallback = false;
/** @param {!string} jsonText */
const updateCircuitLink = jsonText => {
    let title = `Quirk: ${inspector.circuitWidget.circuitDefinition.readableHash()}`;
    let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    if (historyFallback) {
        document.location.hash = urlHash;
        document.title = title;
        return;
    }

    //noinspection UnusedCatchParameterJS
    try {
        if (wantToPushStateIfDiffersFrom !== null && jsonText !== wantToPushStateIfDiffersFrom) {
            // We moved away from the original state the user was linked to. Keep it in the history.
            // I'm not sure if this is the correct thing to do. It makes the user press back twice to escape.
            // On the other hand, it allows them to get back to where they expect when they go back then forward.
            history.pushState(jsonText, document.title, urlHash);
            wantToPushStateIfDiffersFrom = null;
        } else {
            // Intermediate states are too numerous to put in the history. (Users should use ctrl+Z instead.)
            history.replaceState(jsonText, document.title, urlHash);
        }
        document.title = title;
    } catch (ex) {
        console.warn("Touching 'history.replaceState' caused an error. Falling back to setting location.hash.", ex);
        historyFallback = true;
        document.location.hash = urlHash;
    }
};

initializedWglContext().onContextRestored = () => redrawThrottle.trigger();

const snapshot = () => JSON.stringify(Serializer.toJson(inspector.circuitWidget.circuitDefinition), null, 0);
const restore = jsonText => {
    inspector = inspector.withCircuitDefinition(Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText)));
    updateCircuitLink(jsonText);
    redrawThrottle.trigger();
};
/** @type {!Revision} */
let revision = new Revision(snapshot());

/** @type {!number} */
let circuitTime = 0;
/**
 * Milliseconds.
 * @type {!number}
 */
let prevAdvanceTime = performance.now();
const advanceCircuitTime = () => {
    let t = performance.now();
    let elapsed = (t - prevAdvanceTime) / Config.CYCLE_DURATION_MS;
    circuitTime += elapsed;
    circuitTime %= 1;
    prevAdvanceTime = t;
};
let currentCircuitStatsCache =
    new CycleCircuitStats(inspector.circuitWidget.circuitDefinition, Config.TIME_CACHE_GRANULARITY);

/**
 * @param {!InspectorWidget} ins
 * @returns {!InspectorWidget}
 */
const syncArea = ins => {
    ins.updateArea(
        new Rect(
            0,
            0,
            canvasDiv.clientWidth,
            InspectorWidget.defaultHeight(ins.circuitWidget.circuitDefinition.numWires)));
    return ins;
};

/** @type {!CooldownThrottle} */
let redrawThrottle;
const scheduleRedraw = () => redrawThrottle.trigger();
const redrawNow = () => {
    canvas.width = Math.max(canvasDiv.clientWidth, inspector.desiredWidth());
    canvas.height = InspectorWidget.defaultHeight(inspector.circuitWidget.circuitDefinition.numWires);
    if (!haveLoaded) {
        // Don't draw while loading. It's a huge source of false-positive circuit-load-failed errors during development.
        return;
    }

    let painter = new Painter(canvas);
    let shown = syncArea(inspector).previewDrop();
    if (!currentCircuitStatsCache.circuitDefinition.isEqualTo(shown.circuitWidget.circuitDefinition)) {
        // Maybe this fresh new circuit isn't failing. Clear the error tint.
        let errDivStyle = document.getElementById('errorDiv').style;
        errDivStyle.opacity *= 0.9;
        if (errDivStyle.opacity < 0.06) {
            errDivStyle.display = 'None'
        }

        currentCircuitStatsCache =
            new CycleCircuitStats(shown.circuitWidget.circuitDefinition, Config.TIME_CACHE_GRANULARITY);
    }
    advanceCircuitTime();
    let stats = currentCircuitStatsCache.statsAtApproximateTime(circuitTime);

    shown.updateArea(painter.paintableArea());
    shown.paint(painter, stats);
    painter.paintDeferred();

    if (inspector.needsContinuousRedraw()) {
        window.requestAnimationFrame(scheduleRedraw);
    }
};
redrawThrottle = new CooldownThrottle(redrawNow, Config.REDRAW_COOLDOWN_MS);

const useInspector = (newInspector, keepInHistory) => {
    if (inspector.isEqualTo(newInspector)) {
        return false;
    }
    inspector = newInspector;
    let jsonText = snapshot();
    if (keepInHistory) {
        updateCircuitLink(jsonText);
        revision.commit(jsonText);
    }

    scheduleRedraw();
    return true;
};

watchDrags(canvas,
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
     * @param {?Point} pt
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
canvas.addEventListener('mousedown', ev => {
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
canvas.addEventListener('mousemove', ev => {
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

// Pull initial circuit out of URL '?x=y' arguments.
const getHashParameters = () => {
    let paramsText = document.location.hash.substr(1);
    let paramsObject = {};
    if (paramsText !== null && paramsText !== "") {
        let paramsKeyVal = paramsText.split("&");
        for (let i = 0; i < paramsKeyVal.length; i++) {
            let keyVal = paramsKeyVal[i];
            let eq = keyVal.indexOf("=");
            if (eq === -1) {
                continue;
            }
            let key = decodeURIComponent(keyVal.substring(0, eq));
            paramsObject[key] = decodeURIComponent(keyVal.substring(eq + 1));
        }
    }
    return paramsObject;
};
const loadCircuitFromUrl = () => {
    wantToPushStateIfDiffersFrom = null;
    let params = getHashParameters();
    if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
        try {
            let json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
            let circuitDef = Serializer.fromJson(CircuitDefinition, json);
            useInspector(inspector.withCircuitDefinition(circuitDef), true);
            let state = snapshot();
            revision = new Revision(state);
            wantToPushStateIfDiffersFrom = circuitDef.columns.length > 0 ? state : null;
        } catch (ex) {
            alert("Failed to load circuit: " + ex);
        }
    }
    scheduleRedraw();
};

window.onpopstate = () => loadCircuitFromUrl(false);
loadCircuitFromUrl(true);
haveLoaded = true;
redrawNow();
