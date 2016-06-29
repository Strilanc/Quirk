// It's important that the polyfills and error fallback get loaded first!
import {} from "src/browser/Polyfills.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"
import {} from "src/issues.js"

import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CooldownThrottle from "src/base/CooldownThrottle.js"
import Config from "src/Config.js"
import CycleCircuitStats from "src/circuit/CycleCircuitStats.js"
import DisplayedInspector from "src/widgets/DisplayedInspector.js"
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
import { selectAndCopyToClipboard } from "src/browser/Clipboard.js"
import { saveFile } from "src/browser/SaveFile.js"
import { Observable, ObservableValue } from "src/base/Obs.js"

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
let semiStableRng = {cur: new RestartableRng()};
let cycleRng;
cycleRng = () => {
    semiStableRng.cur = new RestartableRng();
    //noinspection DynamicallyGeneratedCodeJS
    setTimeout(cycleRng, Config.SEMI_STABLE_RANDOM_VALUE_LIFETIME_MILLIS*0.99);
};
cycleRng();

//noinspection JSValidateTypes
/** @type {!HTMLDivElement} */
const inspectorDiv = document.getElementById("inspectorDiv");

/** @type {ObservableValue.<!DisplayedInspector>} */
const inspector = new ObservableValue(DisplayedInspector.empty(new Rect(0, 0, canvas.clientWidth, canvas.clientHeight)));

/** @type {!Revision} */
let revision = Revision.startingAt(inspector.get().snapshot());

// Undo / redo.
(() => {
    const undoButton = /** @type {!HTMLButtonElement} */ document.getElementById('undo-button');
    const redoButton = /** @type {!HTMLButtonElement} */ document.getElementById('redo-button');
    revision.changes().subscribe(() => {
        undoButton.disabled = revision.isAtBeginningOfHistory();
        redoButton.disabled = revision.isAtEndOfHistory();
    });

    undoButton.addEventListener('click', () => restore(revision.undo()));
    redoButton.addEventListener('click', () => restore(revision.redo()));

    document.addEventListener("keydown", e => {
        const Y_KEY = 89;
        const Z_KEY = 90;
        let isUndo = e.keyCode === Z_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
        let isRedo1 = e.keyCode === Z_KEY && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey;
        let isRedo2 = e.keyCode === Y_KEY && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
        if (isUndo) {
            restore(revision.undo());
            e.preventDefault();
        }
        if (isRedo1 || isRedo2) {
            restore(revision.redo());
            e.preventDefault();
        }
    });
})();

// Show/hide exports.
(() => {
    const exportButton = /** @type {!HTMLButtonElement} */ document.getElementById('export-button');
    const exportOverlay = /** @type {!HTMLDivElement} */ document.getElementById('export-overlay');
    const exportDiv = /** @type {HTMLDivElement} */ document.getElementById('export-div');
    exportButton.addEventListener('click', () => { exportDiv.style.display = 'block'; });
    exportOverlay.addEventListener('click', () => { exportDiv.style.display = 'none'; });
    document.addEventListener('keydown', e => {
        const ESC_KEY = 27;
        if (e.keyCode === ESC_KEY) {
            exportDiv.style.display = 'none';
        }
    });
})();

/**
 * @param {!HTMLButtonElement} button
 * @param {!HTMLElement} contentElement
 * @param {!HTMLElement} resultElement
 */
let setupButtonElementCopyToClipboard = (button, contentElement, resultElement) => button.addEventListener('click', () => {
    //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
    try {
        selectAndCopyToClipboard(contentElement);
        resultElement.innerText = "Done!";
    } catch (ex) {
        resultElement.innerText = "It didn't work...";
        console.warn('Clipboard copy failed.', ex);
    }
    button.disabled = true;
    setTimeout(() => { resultElement.innerText = ""; button.disabled = false; }, 1000);
});

// Export escaped link.
(() => {
    const exportLinkCopyButton = /** @type {HTMLButtonElement} */ document.getElementById('export-link-copy-button');
    const exportLinkCopyResult = /** @type {HTMLElement} */ document.getElementById('export-link-copy-result');
    const exportEscapedLinkAnchor = /** @type {HTMLAnchorElement} */ document.getElementById('export-escaped-anchor');
    setupButtonElementCopyToClipboard(exportLinkCopyButton, exportEscapedLinkAnchor, exportLinkCopyResult);
    revision.latestActiveCommit().subscribe(jsonText => {
        let escapedUrlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + encodeURIComponent(jsonText);
        exportEscapedLinkAnchor.href = escapedUrlHash;
        exportEscapedLinkAnchor.innerText = document.location.href.split("#")[0] + escapedUrlHash;
    });
})();

// Export JSON.
(() => {
    const exportJsonCopyButton = /** @type {HTMLButtonElement} */ document.getElementById('export-json-copy-button');
    const exportCircuitJsonElement = /** @type {HTMLPreElement} */ document.getElementById('export-circuit-json-pre');
    const exportJsonCopyResult = /** @type {HTMLElement} */ document.getElementById('export-json-copy-result');
    setupButtonElementCopyToClipboard(exportJsonCopyButton, exportCircuitJsonElement, exportJsonCopyResult);
    revision.latestActiveCommit().subscribe(jsonText => {
        //noinspection UnusedCatchParameterJS
        try {
            let val = JSON.parse(jsonText);
            exportCircuitJsonElement.innerText = JSON.stringify(val, null, '  ');
        } catch (_) {
            exportCircuitJsonElement.innerText = jsonText;
        }
    });
})();

// Export offline copy.
(() => {
    const downloadButton = /** @type {HTMLButtonElement} */ document.getElementById('download-offline-copy-button');

    const fileNameForState = jsonText => {
        //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
        try {
            let circuitDef = Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText));
            if (!circuitDef.isEmpty()) {
                return `Quirk with Circuit - ${circuitDef.readableHash()}.html`;
            }
        } catch (_) {
        }
        return 'Quirk.html';
    };

    revision.latestActiveCommit().subscribe(jsonText => {
        downloadButton.innerText = `Download "${fileNameForState(jsonText)}"`;
    });

    downloadButton.addEventListener('click', () => {
        downloadButton.disabled = true;
        setTimeout(() => {
            downloadButton.disabled = false;
        }, 1000);
        let originalHtml = document.QUIRK_QUINE_ALL_HTML_ORIGINAL;

        // Inject default circuit.
        let startDefaultTag = '//DEFAULT_CIRCUIT_START\n';
        let endDefaultTag = '//DEFAULT_CIRCUIT_END\n';
        let modStart = originalHtml.indexOf(startDefaultTag);
        let modStop = originalHtml.indexOf(endDefaultTag, modStart);
        let moddedHtml =
            originalHtml.substring(0, modStart) +
            startDefaultTag +
            'document.DEFAULT_CIRCUIT = ' + JSON.stringify(inspector.get().snapshot()) + ';\n' +
            originalHtml.substring(modStop);

        // Strip analytics.
        let anaStartTag = '<!-- Start Analytics -->\n';
        let anaStart = moddedHtml.indexOf(anaStartTag);
        if (anaStart !== -1) {
            let anaStopTag = '<!-- End Analytics -->\n';
            let anaStop = moddedHtml.indexOf(anaStopTag, anaStart);
            if (anaStop !== -1) {
                moddedHtml =
                    moddedHtml.substring(0, anaStart) +
                    anaStartTag +
                    moddedHtml.substring(anaStop);
            }
        }

        saveFile(fileNameForState(inspector.get()), moddedHtml);
    });
})();

// Title of page.
(() => {
    const titleForState = jsonText => {
        //noinspection UnusedCatchParameterJS,EmptyCatchBlockJS
        try {
            let circuitDef = Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText));
            if (!circuitDef.isEmpty()) {
                return `Quirk: ${circuitDef.readableHash()}`;
            }
        } catch (_) {
        }
        return 'Quirk: Toy Quantum Circuit Simulator';
    };

    revision.latestActiveCommit().subscribe(jsonText => {
        // Add a slight delay, so that history changes use the old title.
        setTimeout(() => { document.title = titleForState(jsonText); }, 0);
    });
})();

/**
 * @param {undefined|!string} jsonText
 */
const restore = jsonText => {
    if (jsonText === undefined) {
        return;
    }
    let circuitDef = Serializer.fromJson(CircuitDefinition, JSON.parse(jsonText));
    let newInspector = inspector.get().withCircuitDefinition(circuitDef);
    inspector.set(newInspector);
};

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
    new CycleCircuitStats(inspector.get().displayedCircuit.circuitDefinition, Config.TIME_CACHE_GRANULARITY);

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

let scrollBlocker = new TouchScrollBlocker(canvasDiv);

let isShiftHeld = false;
Observable.of(Observable.elementEvent(document, 'keydown'), Observable.elementEvent(document, 'keyup')).
    flatten().
    map(e => e.shiftKey).
    subscribe(e => { isShiftHeld = e.shiftKey; });

/** @type {!CooldownThrottle} */
let redrawThrottle;
const redrawNow = () => {
    if (!haveLoaded) {
        // Don't draw while loading. It's a huge source of false-positive circuit-load-failed errors during development.
        return;
    }

    let shown = syncArea(inspector.get()).previewDrop();
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
    let painter = new Painter(canvas, semiStableRng.cur.restarted());
    shown.updateArea(painter.paintableArea());
    shown.paint(painter, stats, isShiftHeld);
    painter.paintDeferred();

    inspector.get().hand.paintCursor(painter);
    scrollBlocker.setBlockers(painter.touchBlockers, painter.desiredCursorStyle);
    canvas.style.cursor = painter.desiredCursorStyle || 'auto';

    let dt = inspector.get().stableDuration();
    if (dt < Infinity) {
        window.requestAnimationFrame(() => redrawThrottle.trigger());
    }
};
redrawThrottle = new CooldownThrottle(redrawNow, Config.REDRAW_COOLDOWN_MILLIS);
window.addEventListener('resize', () => redrawThrottle.trigger(), false);
inspector.observable().subscribe(() => redrawThrottle.trigger());

const useInspector = (newInspector, keepInHistory) => {
    if (inspector.get().isEqualTo(newInspector)) {
        return false;
    }

    let jsonText = newInspector.snapshot();
    if (keepInHistory) {
        revision.commit(jsonText);
    }
    inspector.set(newInspector);

    return true;
};

watchDrags(canvasDiv,
    /**
     * Grab
     * @param {!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        let oldInspector = inspector.get();
        let newHand = oldInspector.hand.withPos(pt);
        let newInspector = syncArea(oldInspector.withHand(newHand)).afterGrabbing(ev.shiftKey);
        if (inspector.get().isEqualTo(newInspector) || !newInspector.hand.isBusy()) {
            return;
        }

        // Add extra wire temporarily.
        revision.startedWorkingOnCommit();
        useInspector(syncArea(oldInspector.withHand(newHand).withJustEnoughWires(newInspector.hand, 1)).
            afterGrabbing(ev.shiftKey), false);

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
        if (!inspector.get().hand.isBusy()) {
            return;
        }

        let newHand = inspector.get().hand.withPos(pt);
        let newInspector = inspector.get().withHand(newHand);
        useInspector(newInspector, false);
        ev.preventDefault();
    },
    /**
     * Drop
     * @param {undefined|!Point} pt
     * @param {!MouseEvent|!TouchEvent} ev
     */
    (pt, ev) => {
        if (!inspector.get().hand.isBusy()) {
            return;
        }

        let newHand = inspector.get().hand.withPos(pt);
        let newInspector = syncArea(inspector.get()).withHand(newHand).afterDropping().afterTidyingUp();
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
    let newHand = inspector.get().hand.withPos(eventPosRelativeTo(ev, canvas));
    let newInspector = syncArea(inspector.get()).
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
document.addEventListener('mousemove', ev => {
    if (!inspector.get().hand.isBusy()) {
        let newHand = inspector.get().hand.withPos(eventPosRelativeTo(ev, canvas));
        let newInspector = inspector.get().withHand(newHand);
        useInspector(newInspector, false);
    }
});
document.addEventListener('mouseleave', () => {
    if (!inspector.get().hand.isBusy()) {
        let newHand = inspector.get().hand.withPos(undefined);
        let newInspector = inspector.get().withHand(newHand);
        useInspector(newInspector, false);
    }
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
            let def = document.DEFAULT_CIRCUIT || JSON.stringify(Serializer.toJson(CircuitDefinition.EMPTY));
            params.set(Config.URL_CIRCUIT_PARAM_KEY, def);
        }

        let jsonText = params.get(Config.URL_CIRCUIT_PARAM_KEY);
        historyPusher.currentStateIsMemorableAndEqualTo(jsonText);
        let json = JSON.parse(jsonText);
        let circuitDef = Serializer.fromJson(CircuitDefinition, json);
        useInspector(inspector.get().withCircuitDefinition(circuitDef), true);
        revision.clear(inspector.get().snapshot());
        if (circuitDef.isEmpty() && params.size === 1) {
            historyPusher.currentStateIsNotMemorable();
        } else {
            let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
            historyPusher.stateChange(jsonText, urlHash);
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

revision.changes().subscribe(jsonText => {
    if (jsonText !== undefined) {
        let urlHash = "#" + Config.URL_CIRCUIT_PARAM_KEY + "=" + jsonText;
        historyPusher.stateChange(jsonText, urlHash);
    }
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
