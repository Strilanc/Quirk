/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Config} from "../Config.js"

/**
 * Checks if the given code, returned by gl.getError, is an error or not.
 * Throws an error with a descriptive message if the code represents an error.
 * @param {!WebGLRenderingContext} gl
 * @param {!string} previousOperationDescription
 * @param {!boolean} isOnHotPath
 */
function checkGetErrorResult(gl, previousOperationDescription, isOnHotPath = false) {
    if (isOnHotPath && !Config.CHECK_WEB_GL_ERRORS_EVEN_ON_HOT_PATHS) {
        return;
    }

    let code = gl.getError();
    const GL = WebGLRenderingContext;
    if (code === GL.NO_ERROR) {
        return;
    }
    const msgs = {
        [0x0500]: "INVALID_ENUM [+constant not found]",
        [0x0501]: "INVALID_VALUE [+constant not found]",
        [0x0502]: "INVALID_OPERATION [+constant not found]",
        // 0x503 and 0x504 are GL_STACK_OVERFLOW and GL_STACK_UNDERFLOW but not present in webgl.
        [0x0505]: "OUT_OF_MEMORY [+constant not found]",
        [0x0506]: "INVALID_FRAMEBUFFER_OPERATION [+constant not found]",
        [0x9242]: "CONTEXT_LOST_WEBGL [+constant not found]",

        [GL.INVALID_ENUM]: "INVALID_ENUM",
        [GL.INVALID_VALUE]: "INVALID_VALUE",
        [GL.INVALID_OPERATION]: "INVALID_OPERATION",
        [GL.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
        [GL.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION",
        [GL.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL"
    };
    let d = msgs[code] !== undefined ? msgs[code] : "?";
    throw new Error(`gl.getError() returned 0x${code.toString(16)} (${d}) after ${previousOperationDescription}.`);
}

/**
 * Checks if the given code, returned by gl.checkFramebufferStatus, is an error or not.
 * Throws an error with a descriptive message if the code represents an error.
 * @param {!WebGLRenderingContext} gl
 * @param {!boolean} isOnHotPath
 */
function checkFrameBufferStatusResult(gl, isOnHotPath = false) {
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

        [0x0500]: "INVALID_ENUM [+constant not found]",
        [0x8CD6]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT [+constant not found]",
        [0x8CD7]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT [+constant not found]",
        [0x8CD9]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS [+constant not found]",
        [0x8CDD]: "FRAMEBUFFER_UNSUPPORTED [+constant not found]",

        [GL.INVALID_ENUM]: "INVALID_ENUM",
        [GL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
        [GL.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
        [GL.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
        [GL.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED"
    };
    let d = msgs[code] !== undefined ? msgs[code] : "?";
    throw new Error(`gl.checkFramebufferStatus() returned 0x${code.toString(16)} (${d}).`);
}

export {checkGetErrorResult, checkFrameBufferStatusResult}
