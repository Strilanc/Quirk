import {notifyAboutKnownIssue} from "src/fallback.js"

let canvasCreatedForTesting = document.createElement('canvas');
let webglContextCreatedForTesting = canvasCreatedForTesting.getContext('webgl') ||
    canvasCreatedForTesting.getContext('experimental-webgl');

/** @returns {!boolean} */
function detectWebGlNotSupported() {
    return webglContextCreatedForTesting === null || webglContextCreatedForTesting === undefined;
}

function doDetectIssues() {
    if (detectWebGlNotSupported()) {
        notifyAboutKnownIssue(
            "Can't simulate circuits. Your browser doesn't support WebGL, or has it disabled.",
            "https://github.com/Strilanc/Quirk/issues/168",
            [/Computing circuit values failed/, /Error creating WebGL context./])
    }
}

export {doDetectIssues, canvasCreatedForTesting, webglContextCreatedForTesting}
