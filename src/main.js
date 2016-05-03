import {} from "src/fallback.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CooldownThrottle from "src/base/CooldownThrottle.js"
import Config from "src/Config.js"
import CycleCircuitStats from "src/circuit/CycleCircuitStats.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"
import { initializedWglContext } from "src/webgl/WglContext.js"
import { watchDrags, isMiddleClicking, eventPosRelativeTo } from "src/widgets/MouseUtil.js"
import { notifyAboutRecoveryFromUnexpectedError } from "src/fallback.js"

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
let wantToPushStateIfDiffersFrom = undefined;

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(
    Config.MIN_WIRE_COUNT,
    new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));

let historyFallback = false;
/** @param {!string} jsonText */
const updateCircuitLink = jsonText => {
    let title = `Quirk: ${inspector.circuitWidget.circuitDefinition.readableHash()}`;
    let hashComponent = Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    let urlToCurrentCircuit = "#" + hashComponent;
    if (historyFallback) {
        document.location.hash = hashComponent;
        document.title = title;
        return;
    }

    //noinspection UnusedCatchParameterJS
    try {
        if (wantToPushStateIfDiffersFrom !== undefined && jsonText !== wantToPushStateIfDiffersFrom) {
            // We moved away from the original state the user was linked to. Keep it in the history.
            // I'm not sure if this is the correct thing to do. It makes the user press back twice to escape.
            // On the other hand, it allows them to get back to where they expect when they go back then forward.
            history.pushState(jsonText, document.title, urlToCurrentCircuit);
            wantToPushStateIfDiffersFrom = undefined;
        } else {
            // Intermediate states are too numerous to put in the history. (Users should use ctrl+Z instead.)
            history.replaceState(jsonText, document.title, urlToCurrentCircuit);
        }
        document.title = title;
    } catch (ex) {
        console.warn("Touching 'history.replaceState' caused an error. Falling back to setting location.hash.", ex);
        historyFallback = true;
        document.location.hash = hashComponent;
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
    new CycleCircuitStats(inspector.circuitWidget.circuitDefinition, Config.TIME_CACHE_GRANULARITY);

let desiredCanvasSize = () => {
    return {
        w: Math.max(canvasDiv.clientWidth, inspector.desiredWidth()),
        h: InspectorWidget.defaultHeight(inspector.circuitWidget.circuitDefinition.numWires)
    };
};

/**
 * @param {!InspectorWidget} ins
 * @returns {!InspectorWidget}
 */
const syncArea = ins => {
    let size = desiredCanvasSize();
    ins.updateArea(new Rect(0, 0, size.w, size.h));
    return ins;
};

/** @type {!CooldownThrottle} */
let redrawThrottle;
const scheduleRedraw = () => redrawThrottle.trigger();
const redrawNow = () => {
    if (!haveLoaded) {
        // Don't draw while loading. It's a huge source of false-positive circuit-load-failed errors during development.
        return;
    }

    let shown = syncArea(inspector).previewDrop();
    if (!currentCircuitStatsCache.circuitDefinition.isEqualTo(shown.circuitWidget.circuitDefinition)) {
        // Maybe this fresh new circuit isn't failing. Clear the error tint.
        let errDivStyle = document.getElementById('error-div').style;
        errDivStyle.opacity *= 0.9;
        if (errDivStyle.opacity < 0.06) {
            errDivStyle.display = 'None'
        }

        currentCircuitStatsCache =
            new CycleCircuitStats(shown.circuitWidget.circuitDefinition, Config.TIME_CACHE_GRANULARITY);
    }
    let stats = currentCircuitStatsCache.statsAtApproximateTime(getCircuitCycleTime());

    let size = desiredCanvasSize();
    canvas.width = size.w;
    canvas.height = size.h;
    let painter = new Painter(canvas);
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

// Pull initial circuit out of URL '#x=y' arguments.
const getHashParameters = () => {
    let hashText = document.location.hash.substr(1);
    let paramsObject = {};
    if (hashText !== "") {
        for (let keyVal of hashText.split("&")) {
            let eq = keyVal.indexOf("=");
            if (eq === -1) {
                continue;
            }
            let key = keyVal.substring(0, eq);
            let val = decodeURIComponent(keyVal.substring(eq + 1));
            paramsObject[key] = val;
        }
    }
    return paramsObject;
};
const loadCircuitFromUrl = () => {
    wantToPushStateIfDiffersFrom = undefined;
    try {
        let params = getHashParameters();
        if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
            let json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
            let circuitDef = Serializer.fromJson(CircuitDefinition, json);
            useInspector(inspector.withCircuitDefinition(circuitDef), true);
            let state = snapshot();
            revision = new Revision(state);
            wantToPushStateIfDiffersFrom = circuitDef.columns.length > 0 ? state : undefined;
        }
    } catch (ex) {
        notifyAboutRecoveryFromUnexpectedError(
            "Failed to understand circuit from URL. Defaulted to an empty circuit.",
            {document_location_hash: document.location.hash},
            ex);
    }
    scheduleRedraw();
};

window.onpopstate = () => loadCircuitFromUrl(false);
loadCircuitFromUrl(true);
haveLoaded = true;
redrawNow();
