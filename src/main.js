import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Config from "src/Config.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Revision from "src/base/Revision.js"
import Serializer from "src/circuit/Serializer.js"

//noinspection JSValidateTypes
/** @type {!HTMLCanvasElement} */
let canvas = document.getElementById("drawCanvas");
//noinspection JSValidateTypes
if (canvas === null) {
    throw new Error("Couldn't find 'drawCanvas'");
}

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
let canvasDiv = document.getElementById("canvasDiv");

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
let inspectorDiv = document.getElementById("inspectorDiv");

//noinspection JSValidateTypes
/** @type {!HTMLAnchorElement} */
let currentCircuitLink = document.getElementById("currentCircuitLink");

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(Config.NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));

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
let tickerPrevTime = 0;
/** @type {!function()} */
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
    canvas.height = canvasDiv.clientHeight;
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

/**
 * @param {!MouseEvent} mouseEvent
 */
let mousePosRelativeToCanvas = mouseEvent => {
    let b = canvas.getBoundingClientRect();
    return new Point(mouseEvent.clientX - b.left, mouseEvent.clientY - b.top);
};

/**
 * @param {!MouseEvent} mouseEvent
 */
let isClicking = mouseEvent => mouseEvent.which === 1;

let useInspector = (newInspector, keepInHistory) => {
    if (inspector.isEqualTo(newInspector)) {
        return;
    }
    inspector = newInspector;
    let jsonText = snapshot();
    currentCircuitLink.href = "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
    if (keepInHistory) {
        revision.update(jsonText);
    }

    redraw();
};

//noinspection JSUnresolvedFunction
canvas.addEventListener("mousedown", ev => {
    if (!isClicking(ev)) { return; }
    ev.preventDefault();

    let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(ev));
    let newInspector = inspector.withHand(newHand).afterGrabbing();
    useInspector(newInspector, false);
    revision.startingUpdate();
});

////noinspection JSUnresolvedFunction
document.addEventListener("mouseup", ev => {
    if (!isClicking(ev) || !inspector.hand.isBusy()) {
        return;
    }
    ev.preventDefault();

    let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(ev));
    let newInspector = inspector.withHand(newHand).afterDropping().afterTidyingUp();
    useInspector(newInspector, true);
});

//noinspection JSUnresolvedFunction
document.addEventListener("mousemove", ev => {
    if (!isClicking(ev) || !inspector.hand.isBusy()) {
        // Not a drag out of the canvas; don't care.
        return;
    }
    ev.preventDefault();

    let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(ev));
    let newInspector = inspector.withHand(newHand);
    useInspector(newInspector, false);
});

//noinspection JSUnresolvedFunction
canvas.addEventListener("mousemove", ev => {
    if (isClicking(ev) && inspector.hand.isBusy()) {
        // being handled by document mouse move
        return;
    }
    ev.preventDefault();

    let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(ev));
    useInspector(inspector.withHand(newHand), false);
});

//noinspection JSUnresolvedFunction
canvas.addEventListener("mouseleave", () => {
    let newHand = inspector.hand.withPos(null);
    useInspector(inspector.withHand(newHand), false)
});

window.addEventListener('resize', redraw, false);

document.addEventListener("keydown", e => {
    let Y_KEY = 89;
    let Z_KEY = 90;
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
