/**
 * Configuration parameters for quantum circuit visualizer.
 */
export default class Config {}

Config.MIN_WIRE_COUNT = 2;
Config.MAX_WIRE_COUNT = 12; // Note: at 14 I start hitting the pixel limit for textures. And 13 is slow.
Config.URL_CIRCUIT_PARAM_KEY = 'circuit';

// Gate background colors.
Config.GATE_FILL_COLOR = 'white';
Config.HIGHLIGHTED_GATE_FILL_COLOR = 'orange';
Config.NON_UNITARY_GATE_FILL_COLOR = 'pink';

// Mixed-state displays are green.
Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR = '#4F4';
Config.DISPLAY_GATE_BACK_COLOR = '#EFE';
Config.DISPLAY_GATE_FORE_COLOR = '#4F4';

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
Config.REFRESH_DURATION_MS = 50; // How often time-driven circuits cause redraw.
Config.REDRAW_COOLDOWN_MS = 15; // How often user-driven actions can cause redraw.

/** Half of the span of a drawn gate, width-wise and height-wise.
* @type {!number} */
Config.GATE_RADIUS = 20;
Config.WIRE_SPACING = 50;

/**
 * At level N we partition the wires into groups of size 2^N and show the density matrices for all the partitions.
 * Setting to 0 will show no density matrices.
 * Setting to 1 will show all the individual state density matrices.
 * Setting to 2 adds on the paired states.
 * Setting to 3 adds on the quadruplet states, but is not very useful because of the information overload.
 * Setting to 4 breaks everything.
 */
Config.RIGHT_HAND_DENSITY_MATRIX_DISPLAY_LEVELS = 2;

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

Config.SUPPRESSED_GLSL_WARNING_PATTERNS = [
    /^\s*([^\) ]+\): warning X3595: gradient instruction used in a loop with varying iteration; partial derivatives may have undefined value\b)+\s*$/
];

// Draw constants.
Config.DEFAULT_FILL_COLOR = 'white';
Config.DEFAULT_STROKE_COLOR = 'black';
Config.DEFAULT_TEXT_COLOR = 'black';
Config.DEFAULT_FONT_SIZE = 12;
Config.DEFAULT_FONT_FAMILY = 'Helvetica';
Config.DEFAULT_STROKE_THICKNESS = 1;

// Calling WebGLRenderingContext.getError forces a CPU/GPU sync. It's very expensive.
Config.CHECK_WEB_GL_ERRORS_EVEN_ON_HOT_PATHS = false;
