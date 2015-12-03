import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Config from "src/Config.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"
import describe from "src/base/Describe.js"

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

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(
    Config.NUM_INITIAL_WIRES,
    new Rect(0, 0, canvas.clientWidth, canvas.clientHeight));

let snapshot = () => JSON.stringify(Serializer.toJson(inspector.circuitWidget.circuitDefinition), null, 0);
let restore = jsonText => {
    inspector = inspector.withCircuitDefinition(Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText)));
    currentCircuitLink.href = "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
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
            let elapsed = (t - tickerPrevTime) / 10000;
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

redraw = function () {
    canvas.width = canvasDiv.clientWidth;
    canvas.height = InspectorWidget.defaultHeight(inspector.circuitWidget.circuitDefinition.numWires);
    let painter = new Painter(canvas);
    let shown = inspector.previewDrop();
    let statsFunc = shown.circuitWidget.circuitDefinition.numWires > Config.MAX_LIVE_UPDATE_WIRE_COUNT
        ? CircuitStats.emptyAtTime
        : CircuitStats.fromCircuitAtTime;
    let stats = statsFunc(shown.circuitWidget.circuitDefinition, circuitTime);

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

let useInspector = (newInspector, keepInHistory) => {
    if (inspector.isEqualTo(newInspector)) {
        return false;
    }
    inspector = newInspector;
    let jsonText = snapshot();
    currentCircuitLink.href = "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    if (keepInHistory) {
        revision.update(jsonText);
    }

    redraw();
    return true;
};

let grabbingPointerId = undefined;
let grabTime = window.performance.now();
const ALLOW_REGRAB_WATCHDOG_TIME = 5000; // milliseconds

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

    let newHand = inspector.hand.withPos(pt);
    let newInspector = inspector.withHand(newHand).afterGrabbing(shift);
    if (!useInspector(newInspector, false) || !newInspector.hand.isBusy()) {
        return false;
    }

    revision.startingUpdate();
    grabbingPointerId = id;
    grabTime = window.performance.now();
    return true;
};
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
/**
 * @param {!Point} pt
 * @param {*} id
 * @param {!boolean} shift
 * @returns {!boolean} Whether or not we dropped something.
 */
let tryDropAtWith = (pt, id, shift) => {
    if (grabbingPointerId !== id || !inspector.hand.isBusy()) {
        return false;
    }

    let newHand = inspector.hand.withPos(pt);
    let newInspector = inspector.withHand(newHand).afterDropping().afterTidyingUp();
    let clearHand = newInspector.hand.withPos(null);
    let clearInspector = newInspector.withHand(clearHand);
    useInspector(clearInspector, true);
    grabbingPointerId = undefined;
    return true;
};
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

    restore(revision.cancel());
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

canvas.addEventListener('mousedown', ev => handleMouseEventWith(ev, tryGrabAtWith));
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
        useInspector(inspector.withCircuitDefinition(circuitDef), false);
        revision = new Revision(snapshot())
    } catch (ex) {
        alert("Failed to load circuit: " + ex);
    }
}

redraw();
