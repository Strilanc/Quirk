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

import {notifyAboutKnownIssue} from "./fallback.js"

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
