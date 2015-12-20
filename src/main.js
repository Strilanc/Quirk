import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Config from "src/Config.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"

let canvasDiv = document.getElementById("canvasDiv");

//noinspection JSValidateTypes
/** @type {!HTMLCanvasElement} */
let canvas = document.getElementById("drawCanvas");
//noinspection JSValidateTypes
if (canvas === null) {
    throw new Error("Couldn't find 'drawCanvas'");
}

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
let inspectorDiv = document.getElementById("inspectorDiv");

//noinspection JSValidateTypes
/** @type {!HTMLAnchorElement} */
let currentCircuitLink = document.getElementById("currentCircuitLink");
let updateCircuitLink = jsonText => {
    currentCircuitLink.href = "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    currentCircuitLink.textContent = "Link to Current Circuit: " + jsonText;
};

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(
    Config.MIN_WIRE_COUNT,
    new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));

let grabbingPointerId = undefined;
let grabTime = window.performance.now();
const ALLOW_REGRAB_WATCHDOG_TIME = 5000; // milliseconds

let snapshot = () => JSON.stringify(Serializer.toJson(inspector.circuitWidget.circuitDefinition), null, 0);
let restore = jsonText => {
    grabbingPointerId = undefined;
    inspector = inspector.withCircuitDefinition(Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText)));
    updateCircuitLink(jsonText);
    redraw();
};
let revision = new Revision(snapshot());

/** @type {!number} */
let circuitTime = 0;
/** @type {!number|null} */
let ticker = null;
/**
 * Milliseconds.
 * @type {!number}
 */
let tickerPrevTime = 0;
/** @type {!function(void) : void} */
let redraw;

let tickWhenAppropriate = () => {
    let shouldBeTicking = inspector.needsContinuousRedraw();

    let isTicking = ticker !== null;
    if (isTicking === shouldBeTicking) {
        return;
    }
    if (shouldBeTicking) {
        tickerPrevTime = performance.now();
        ticker = window.setInterval(function() {
            let t = performance.now();
            let elapsed = (t - tickerPrevTime) / Config.CYCLE_DURATION_MS;
            circuitTime += elapsed;
            circuitTime %= 1;
            tickerPrevTime = t;
            redraw();
        }, 10);
    } else {
        window.clearInterval(ticker);
        ticker = null;
    }
};

/**
 * @param {!InspectorWidget} ins
 * @returns {!InspectorWidget}
 */
let syncArea = ins => {
    ins.updateArea(
        new Rect(
            0,
            0,
            canvasDiv.clientWidth,
            InspectorWidget.defaultHeight(ins.circuitWidget.circuitDefinition.numWires)));
    return ins;
};

redraw = () => {
    canvas.width = canvasDiv.clientWidth;
    canvas.height = InspectorWidget.defaultHeight(inspector.circuitWidget.circuitDefinition.numWires);
    let painter = new Painter(canvas);
    let shown = syncArea(inspector).previewDrop();
    let stats = CircuitStats.fromCircuitAtTime(shown.circuitWidget.circuitDefinition, circuitTime);

    shown.updateArea(painter.paintableArea());
    shown.paint(painter, stats);
    painter.paintDeferred();

    tickWhenAppropriate();
};

/** @param {!MouseEvent|!Touch} ev */
let eventPosRelativeToCanvas = ev => {
    let b = canvas.getBoundingClientRect();
    return new Point(ev.clientX - b.left, ev.clientY - b.top);
};

/** @param {!MouseEvent} ev */
let isLeftClicking = ev => ev.which === 1;
/** @param {!MouseEvent} ev */
let isMiddleClicking = ev => ev.which === 2;

let useInspector = (newInspector, keepInHistory) => {
    if (inspector.isEqualTo(newInspector)) {
        return false;
    }
    inspector = newInspector;
    let jsonText = snapshot();
    if (keepInHistory) {
        updateCircuitLink(jsonText);
        revision.commit(jsonText);
    }

    redraw();
    return true;
};

/**
 * @param {!Point} pt
 * @param {*} id
 * @param {!boolean} shift
 * @returns {!boolean} Whether or not we grabbed something.
 */
let tryGrabAtWith = (pt, id, shift) => {
    if (grabbingPointerId !== undefined && window.performance.now() < grabTime + ALLOW_REGRAB_WATCHDOG_TIME) {
        return false;
    }

    let oldInspector = inspector;
    let newHand = oldInspector.hand.withPos(pt);
    let newInspector = syncArea(oldInspector.withHand(newHand)).afterGrabbing(shift);
    if (!useInspector(newInspector, false) || !newInspector.hand.isBusy()) {
        return false;
    }

    // Add extra wire temporarily.
    useInspector(syncArea(oldInspector.withHand(newHand).withJustEnoughWires(1)).afterGrabbing(shift), false);

    revision.startedWorkingOnCommit();
    grabbingPointerId = id;
    grabTime = window.performance.now();
    return true;
};
//noinspection JSUnusedLocalSymbols
/**
 * @param {!Point} pt
 * @param {*} id
 * @param {!boolean} shift
 * @returns {!boolean} Whether or not we dragged something.
 */
let tryDragAtWith = (pt, id, shift) => {
    if (grabbingPointerId !== id || !inspector.hand.isBusy()) {
        return false;
    }

    grabTime = window.performance.now();
    let newHand = inspector.hand.withPos(pt);
    let newInspector = inspector.withHand(newHand);
    useInspector(newInspector, false);
    return true;
};
//noinspection JSUnusedLocalSymbols
/**
 * @param {!Point} pt
 * @param {*} id
 * @param {!boolean} shift
 * @returns {!boolean} Whether or not we dropped something.
 */
let tryDropAtWith = (pt, id, shift) => {
    if (grabbingPointerId !== id) {
        return false;
    }
    grabbingPointerId = undefined;
    if (!inspector.hand.isBusy()) {
        return false;
    }

    let newHand = inspector.hand.withPos(pt);
    let newInspector = syncArea(inspector).withHand(newHand).afterDropping().afterTidyingUp();
    let clearHand = newInspector.hand.withPos(null);
    let clearInspector = newInspector.withHand(clearHand).withJustEnoughWires(0);
    useInspector(clearInspector, true);
    return true;
};
//noinspection JSUnusedLocalSymbols
/**
 * @param {!Point} pt
 * @param {*} id
 * @param {!boolean} shift
 * @returns {!boolean} Whether or not we cancelled.
 */
let tryCancelAtWith = (pt, id, shift) => {
    if (grabbingPointerId !== id) {
        return false;
    }

    restore(revision.cancelCommitBeingWorkedOn());
    grabbingPointerId = undefined;
    return true;
};

/**
 * @param {!TouchEvent} ev
 * @param {!function(!Point, *, !boolean) : !boolean} handler
 */
let handleTouchEventWith = (ev, handler) => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
        let touch = ev.changedTouches[i];
        if (handler(eventPosRelativeToCanvas(touch), touch.identifier, ev.shiftKey)) {
            ev.preventDefault();
            return;
        }
    }
};

/**
 * @param {!MouseEvent} ev
 * @param {!function(!Point, *) : !boolean} handler
 */
let handleMouseEventWith = (ev, handler) => {
    if (isLeftClicking(ev) && handler(eventPosRelativeToCanvas(ev), "mouse!", ev.shiftKey)) {
        ev.preventDefault();
    }
};

canvas.addEventListener('mousedown', ev => {
    if (isMiddleClicking(ev)) {
        let newHand = inspector.hand.withPos(eventPosRelativeToCanvas(ev));
        let newInspector = syncArea(inspector).
            withHand(newHand).
            afterGrabbing(false). // Grab the gate.
            withHand(newHand). // Lose the gate.
            afterTidyingUp().
            withJustEnoughWires(0);
        if (useInspector(newInspector, true)) {
            ev.preventDefault();
        }
        return;
    }
    handleMouseEventWith(ev, tryGrabAtWith);
});
document.addEventListener('mousemove', ev => {
    if (inspector.hand.isBusy()) {
        handleMouseEventWith(ev, tryDragAtWith);
    } else {
        ev.preventDefault();
        let newHand = inspector.hand.withPos(eventPosRelativeToCanvas(ev));
        let newInspector = inspector.withHand(newHand);
        useInspector(newInspector, false);
    }
});
document.addEventListener('mouseup', ev => handleMouseEventWith(ev, tryDropAtWith));
canvas.addEventListener('mouseleave', ev => handleMouseEventWith(ev, tryDropAtWith));

canvas.addEventListener('touchstart', ev => handleTouchEventWith(ev, tryGrabAtWith));
document.addEventListener('touchmove', ev => handleTouchEventWith(ev, tryDragAtWith));
document.addEventListener('touchend', ev => handleTouchEventWith(ev, tryDropAtWith));
document.addEventListener('touchcancel', ev => handleTouchEventWith(ev, tryCancelAtWith));

window.addEventListener('resize', redraw, false);

document.addEventListener("keydown", e => {
    const Y_KEY = 89;
    const Z_KEY = 90;
    let isUndo = e.keyCode == Z_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    let isRedo1 = e.keyCode == Z_KEY && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey;
    let isRedo2 = e.keyCode == Y_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    if (isUndo) {
        restore(revision.undo());
    }
    if (isRedo1 || isRedo2) {
        restore(revision.redo());
    }
});

let getSearchParameters = () => {
    let paramsText = window.location.search.substr(1);
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
let params = getSearchParameters();
if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
    try {
        let json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
        let circuitDef = Serializer.fromJson(CircuitDefinition, json);
        useInspector(inspector.withCircuitDefinition(circuitDef), true);
        revision = new Revision(snapshot())
    } catch (ex) {
        alert("Failed to load circuit: " + ex);
    }
}

redraw();
