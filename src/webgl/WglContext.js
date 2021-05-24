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

import {canvasCreatedForTesting, webglContextCreatedForTesting} from "../issues.js"

/**
 * A WebGLRenderingContext wrapped with metadata helpers, lifetime information, and utility methods.
 */
class WglContext {
    /**
     * Creates and wraps a WebGLRenderingContext.
     * @param {!HTMLCanvasElement} canvas
     * @param {!WebGLRenderingContext} context
     */
    constructor(canvas=undefined, context=undefined) {
        if (canvas === undefined) {
            canvas = /** @type {!HTMLCanvasElement} */ document.createElement('canvas');
            context = undefined;
        }
        if (context === undefined) {
            context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }

        /**
         * A hidden canvas backing the WglContext.
         * @type {!HTMLCanvasElement}
         */
        this.canvas = canvas;

        /**
         * The WebGLRenderingContext instance associated with the WglContext.
         * @type {!WebGLRenderingContext}
         */
        this.gl = context;

        if ((/** @type {null|!WebGLRenderingContext} */ this.gl) === null) {
            throw new Error('Error creating WebGL context.');
        }
        if (this.gl.getExtension('OES_texture_float') === undefined) {
            // We'll just fall back to using byte coding of intermediate values.
            console.warn("OES_texture_float webgl extension not present.");
        }
        if (this.gl.getExtension('WEBGL_color_buffer_float') === undefined) {
            // We'll just fall back to using byte coding of intermediate values.
            console.warn("WEBGL_color_buffer_float webgl extension not present.");
        }

        /** @type {!function():void} */
        this.onContextRestored = undefined;

        /**
         * Changed when the wrapped WebGLRenderingContext is lost/restored and things need to be re-created.
         * @type {!int}
         */
        this.lifetimeCounter = 0;

        // Wire lifetime updates.
        this.canvas.addEventListener(
            "webglcontextrestored",
            event => {
                event.preventDefault();
                this.recomputeProperties();
                if (this.onContextRestored !== undefined) {
                    this.onContextRestored();
                }
            },
            false);
        this.canvas.addEventListener(
            'webglcontextlost',
            event => {
                event.preventDefault();
                this.lifetimeCounter++;
            },
            false);

        this.recomputeProperties();
    }

    invalidateExistingResources() {
        this.lifetimeCounter++;
    }

    /**
     * @private
     */
    recomputeProperties() {
        this.lifetimeCounter++;
        /** @type {Number} */
        this.maxTextureUnits = this.gl.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
        /** @type {Number} */
        this.maxTextureSize = this.gl.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);
        /** @type {!string} */
        this.maximumShaderFloatPrecision = this._getMaximumShaderFloatPrecision();
    }

    /**
     * @returns {!string}
     * @private
     */
    _getMaximumShaderFloatPrecision() {
        let gl = this.gl;
        const GL = WebGLRenderingContext;
        let check = (shaderType, precisionType) => {
            let format = gl.getShaderPrecisionFormat(shaderType, precisionType);
            return gl.getError() === GL.NO_ERROR && format !== undefined && format !== null && format.precision > 0;
        };

        let hasHighPrecision = check(GL.VERTEX_SHADER, GL.HIGH_FLOAT) && check(GL.FRAGMENT_SHADER, GL.HIGH_FLOAT);
        if (hasHighPrecision) {
            return 'highp';
        }

        console.warn('WebGL high precision not available.');
        let hasMediumPrecision = check(GL.VERTEX_SHADER, GL.MEDIUM_FLOAT) && check(GL.FRAGMENT_SHADER, GL.MEDIUM_FLOAT);
        if (hasMediumPrecision) {
            return 'mediump';
        }

        console.warn('WebGL medium precision not available.');
        return 'lowp';
    }
}

// We really only ever want one instance to exist.
// Having more of them just causes problems (e.g. eventually tests start failing).
let __sharedInstance = undefined;
function initializedWglContext() {
    if (__sharedInstance === undefined) {
        __sharedInstance = new WglContext(canvasCreatedForTesting, webglContextCreatedForTesting);
    }
    return __sharedInstance;
}

export {initializedWglContext}
