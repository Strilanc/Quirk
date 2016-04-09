import Config from "src/Config.js"

/**
 * Checks if the given code, returned by gl.getError, is an error or not.
 * Throws an error with a descriptive message if the code represents an error.
 * @param {!WebGLRenderingContext} gl
 * @param {!string} previousOperationDescription
 * @param {!boolean} isOnHotPath
 */
export function checkGetErrorResult(gl, previousOperationDescription, isOnHotPath = false) {
    if (isOnHotPath && !Config.CHECK_WEB_GL_ERRORS_EVEN_ON_HOT_PATHS) {
        return;
    }

    let code = gl.getError();
    const GL = WebGLRenderingContext;
    if (code === GL.NO_ERROR) {
        return;
    }
    const msgs = {
        [GL.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
        [GL.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
        [GL.INVALID_ENUM]: "INVALID_ENUM",
        [GL.INVALID_VALUE]: "INVALID_VALUE",
        [GL.INVALID_OPERATION]: "INVALID_OPERATION",
        [GL.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION"
    };
    let d = msgs[code] !== undefined ? msgs[code] : "?";
    throw new Error(`gl.getError() returned ${code} (${d}) after ${previousOperationDescription}.`);
}

/**
 * Checks if the given code, returned by gl.checkFramebufferStatus, is an error or not.
 * Throws an error with a descriptive message if the code represents an error.
 * @param {!WebGLRenderingContext} gl
 * @param {!boolean} isOnHotPath
 */
export function checkFrameBufferStatusResult(gl, isOnHotPath = false) {
    if (isOnHotPath && !Config.CHECK_WEB_GL_ERRORS_EVEN_ON_HOT_PATHS) {
        return;
    }

    const GL = WebGLRenderingContext;
    let code = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
    if (code === GL.FRAMEBUFFER_COMPLETE) {
        return;
    }
    const msgs = {
        [0]: "Argument wasn't a frame buffer",
        [GL.INVALID_ENUM]: "INVALID_ENUM",
        [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
        [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
        [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
        [GL.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
    };
    let d = msgs[code] !== undefined ? msgs[code] : "?";
    throw new Error(`checkFramebufferStatus() returned ${code} (${d}).`);
}
