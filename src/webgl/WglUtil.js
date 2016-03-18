export default class WglUtil {
    /**
     * Checks if the given code is an error or not, and throws a descriptive message if so.
     * @param {!number} code
     * @param {!string} previousOperationDescription
     */
    static checkErrorCode(code, previousOperationDescription) {
        var s = WebGLRenderingContext;
        if (code === s.NO_ERROR) {
            return;
        }
        var m = {
            [s.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
            [s.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
            [s.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
            [s.INVALID_ENUM]: "INVALID_ENUM",
            [s.INVALID_VALUE]: "INVALID_VALUE",
            [s.INVALID_OPERATION]: "INVALID_OPERATION",
            [s.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION"
        };
        var d = m[code] !== undefined ? m[code] : "?";
        throw new Error(`gl.getError() returned ${code} (${d}) after ${previousOperationDescription}.`);
    }

    static checkFrameBufferStatusCode(code) {
        var s = WebGLRenderingContext;
        if (code === s.FRAMEBUFFER_COMPLETE) {
            return;
        }
        var m = {
            [0]: "Argument wasn't a frame buffer",
            [s.INVALID_ENUM]: "INVALID_ENUM",
            [s.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
            [s.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
            [s.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
            [s.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
        };
        var d = m[code] !== undefined ? m[code] : "?";
        throw new Error(`checkFramebufferStatus() returned ${code} (${d}).`);
    }
}
