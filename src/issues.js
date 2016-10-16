import {notifyAboutKnownIssue} from "src/fallback.js"

let canvas = document.createElement('canvas');
let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

/** @returns {!boolean} */
function detectWebGlNotSupported() {
    return gl === null || gl === undefined;
}

/** @returns {!boolean} */
function detectFloatTexturesNotSupported() {
    return gl.getExtension('OES_texture_float') === null;
}

if (detectWebGlNotSupported()) {
    notifyAboutKnownIssue(
        "Can't simulate circuits. Your browser doesn't support WebGL, or has it disabled.",
        "https://github.com/Strilanc/Quirk/issues/168",
        [/Computing circuit values failed/, /Error creating WebGL context./])
} else if (detectFloatTexturesNotSupported()) {
    notifyAboutKnownIssue(
        "Can't simulate circuits. Your browser/GPU doesn't support creating floating point textures.",
        "https://github.com/Strilanc/Quirk/issues/156",
        [/Computing circuit values failed/])
}

canvas = undefined;
gl = undefined;
