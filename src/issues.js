import {notifyAboutKnownIssue} from "src/fallback.js"

/** @returns {!boolean} */
function detectWebGlNotSupported() {
    let canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl === null || gl === undefined;
}

/** @returns {!boolean} */
function detectFloatTexturesNotSupported() {
    let canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl.getExtension('OES_texture_float') === null;
}

/** @returns {!boolean} */
function detectFloatRenderingNotSupported() {
    let canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    gl.getExtension('OES_texture_float');
    let texture = gl.createTexture();
    let frameBuffer = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE;
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
} else if (detectFloatRenderingNotSupported()) {
    notifyAboutKnownIssue(
        "Can't simulate circuits. Unable to bind a floating point texture.",
        "https://github.com/Strilanc/Quirk/issues/157",
        [/FRAMEBUFFER_INCOMPLETE_ATTACHMENT/])
}
