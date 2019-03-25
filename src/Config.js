// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Configuration parameters for quantum circuit visualizer.
 */
class Config {}

Config.EMPTY_CIRCUIT_TITLE = 'Quirk: Quantum Circuit Simulator';

// Each qubit (when actually used) doubles the cost of simulating each gate applied to the circuit.
// Also each qubit tends to increase the amount of accuracy required.
// I see obvious errors when I set this to 20, and things get pretty laggy past 16.
// Beware setting it too high.
Config.MAX_WIRE_COUNT = 16;
Config.SIMPLE_SUPERPOSITION_DRAWING_WIRE_THRESHOLD = 14;

Config.MIN_WIRE_COUNT = 2;
Config.MIN_COL_COUNT = 5;
Config.URL_CIRCUIT_PARAM_KEY = 'circuit';

// Gate background colors.
Config.GATE_FILL_COLOR = 'white';
Config.HIGHLIGHTED_GATE_FILL_COLOR = '#FB7';
Config.TIME_DEPENDENT_HIGHLIGHT_COLOR = '#FFC';

// Mixed-state displays are green.
Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR = '#4F4';
Config.DISPLAY_GATE_BACK_COLOR = '#EFE';
Config.DISPLAY_GATE_FORE_COLOR = '#3F3';

// Changes are yellow.
Config.OPERATION_BACK_COLOR = '#FFE';
Config.OPERATION_FORE_COLOR = '#FF0';

// Pure-state displays are cyan.
Config.SUPERPOSITION_BACK_COLOR = '#EFF';
Config.SUPERPOSITION_MID_COLOR = '#8FF';
Config.SUPERPOSITION_FORE_COLOR = '#0BB';

// Time constants.
Config.CYCLE_DURATION_MS = 8000; // How long it takes for evolving gates to cycle, in milliseconds.
Config.TIME_CACHE_GRANULARITY = 196; // The number of buckets the cycle is divided into.
Config.REDRAW_COOLDOWN_MILLIS = 10; // Milliseconds. Rate-limit on redraws. Long draws pad this limit.

/** Half of the span of a drawn gate, width-wise and height-wise.
* @type {!number} */
Config.GATE_RADIUS = 20;
Config.WIRE_SPACING = 50;

Config.BACKGROUND_COLOR = 'white';
Config.BACKGROUND_COLOR_CIRCUIT = 'white';

// Toolbox layout.
Config.BACKGROUND_COLOR_TOOLBOX = '#CCC';
Config.TOOLBOX_GATE_SPACING = 2;
Config.TOOLBOX_GROUP_SPACING = 24 - Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GATE_SPAN = Config.GATE_RADIUS * 2 + Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GROUP_SPAN = Config.TOOLBOX_GATE_SPAN * 2 + Config.TOOLBOX_GROUP_SPACING;
Config.TOOLBOX_MARGIN_X = 35;
Config.TOOLBOX_MARGIN_Y = 18;

/**
 * Some tooltips end up looking terrible without available vertical space.
 * (e.g. the error box might not fit, or the gate tips might get squashed)
 * @type {number}
 */
Config.MINIMUM_CANVAS_HEIGHT = 400;

Config.SUPPRESSED_GLSL_WARNING_PATTERNS = [];

// Draw constants.
Config.DEFAULT_FILL_COLOR = 'white';
Config.DEFAULT_STROKE_COLOR = 'black';
Config.DEFAULT_TEXT_COLOR = 'black';
Config.DEFAULT_FONT_SIZE = 12;
Config.DEFAULT_FONT_FAMILY = 'sans-serif';
Config.DEFAULT_STROKE_THICKNESS = 1;

// Calling WebGLRenderingContext.getError forces a CPU/GPU sync. It's very expensive.
Config.CHECK_WEB_GL_ERRORS_EVEN_ON_HOT_PATHS = false;
Config.SEMI_STABLE_RANDOM_VALUE_LIFETIME_MILLIS = 300;

Config.IGNORED_WEBGL_INFO_TERMS = [];

export {Config}
