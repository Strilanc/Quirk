import Gate from "src/ui/Gate.js"
import ControlMask from "src/quantum/ControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/math/Complex.js"
import CircuitStats from "src/ui/CircuitStats.js"
import CircuitDefinition from "src/ui/CircuitDefinition.js"
import Matrix from "src/math/Matrix.js"
import PipelineNode from "src/quantum/PipelineNode.js"
import Rect from "src/base/Rect.js"
import Gates from "src/ui/Gates.js"
import GateColumn from "src/ui/GateColumn.js"
import describe from "src/base/Describe.js"
import InspectorWidget from "src/widgets/InspectorWidget.js"
import Config from "src/Config.js"
import Painter from "src/ui/Painter.js"
import Point from "src/base/Point.js"

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

//let getSearchParameters = () => {
//    let paramsText = window.location.search.substr(1);
//    let paramsObject = {};
//    if (paramsText !== null && paramsText !== "") {
//        let paramsKeyVal = paramsText.split("&");
//        for (let i = 0; i < paramsKeyVal.length; i++) {
//            let keyVal = paramsKeyVal[i];
//            let eq = keyVal.indexOf("=");
//            if (eq === -1) {
//                continue;
//            }
//            let key = decodeURIComponent(keyVal.substring(0, eq));
//            paramsObject[key] = decodeURIComponent(keyVal.substring(eq + 1));
//        }
//    }
//    return paramsObject;
//};

/** @type {!InspectorWidget} */
let inspector = InspectorWidget.empty(Config.NUM_INITIAL_WIRES, new Rect(0, 0, canvas.width, canvas.height));

//let snapshot = () => JSON.stringify(inspector.exportCircuit(), null, 0);
//let restore = jsonText => {
//    inspector = inspector.withImportedCircuit(JSON.parse(jsonText));
//    $(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
//    redraw();
//};
//let undoHistory = [];
//let undo = () => {
//    if (undoHistory.length === 0) {
//        return;
//    }
//    redoHistory.push(snapshot());
//    restore(undoHistory.pop());
//};
//let redoHistory = [];
//let redo = () => {
//    if (redoHistory.length === 0) {
//        return;
//    }
//    undoHistory.push(snapshot());
//    restore(redoHistory.pop());
//};

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
    let stats = CircuitStats.fromCircuitAtTime(shown.circuitWidget.circuitDefinition, circuitTime);

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
    //let oldSnapshot = snapshot();
    inspector = newInspector;
    //let jsonText = snapshot();
    //$(currentCircuitLink).attr("href", "?" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText);
    //if (keepInHistory && oldSnapshot !== jsonText) {
    //    undoHistory.push(oldSnapshot);
    //    redoHistory = [];
    //}

    redraw();
};

//noinspection JSUnresolvedFunction
canvas.addEventListener("mousedown", ev => {
    if (!isClicking(ev)) { return; }
    ev.preventDefault();

    let newHand = inspector.hand.withPos(mousePosRelativeToCanvas(ev));
    let newInspector = inspector.withHand(newHand).afterGrabbing();
    useInspector(newInspector, true);
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

//$(inspectorDiv).keydown(e => {
//    let isUndo = e.keyCode == 90 && e.ctrlKey && !e.shiftKey;
//    let isRedo = e.keyCode == 90 && e.ctrlKey && e.shiftKey;
//    if (isUndo) {
//        undo();
//    }
//    if (isRedo) {
//        redo();
//    }
//});

//let params = getSearchParameters();
//if (params.hasOwnProperty(Config.URL_CIRCUIT_PARAM_KEY)) {
//    try {
//        let json = JSON.parse(params[Config.URL_CIRCUIT_PARAM_KEY]);
//        update(inspector.withImportedCircuit(json), false);
//    } catch (ex) {
//        alert("Failed to load circuit: " + ex);
//    }
//}

redraw();
