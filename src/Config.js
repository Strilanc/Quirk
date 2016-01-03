/**
 * Configuration parameters for quantum circuit visualizer.
 */
export default class Config {}

Config.MIN_WIRE_COUNT = 2;
Config.MAX_WIRE_COUNT = 12; // Note: at 14 I start hitting the pixel limit for textures. And 13 is slow.
Config.URL_CIRCUIT_PARAM_KEY = 'initialCircuit';

Config.CHART_COLORS = [
    '#3366CC',
    '#dc3912',
    '#ff9900',
    '#109618',
    '#990099',
    '#0099c6',
    '#dd4477',
    '#66aa00',
    '#b82e2e',
    '#316395',
    '#994499',
    '#22aa99',
    '#aaaa11',
    '#6633cc',
    '#e67300',
    '#8b0707'
];

Config.DEFAULT_FILL_COLOR = 'white';
Config.DEFAULT_STROKE_COLOR = 'black';
Config.DEFAULT_TEXT_COLOR = 'black';
Config.DEFAULT_FONT_SIZE = 12;
Config.DEFAULT_FONT_FAMILY = 'Helvetica';
Config.DEFAULT_STROKE_THICKNESS = 1;

// Gate background colors.
Config.GATE_FILL_COLOR = Config.DEFAULT_FILL_COLOR;
Config.HIGHLIGHTED_GATE_FILL_COLOR = 'orange';
Config.NON_UNITARY_GATE_FILL_COLOR = 'pink';
Config.IMPORTANT_GATE_IN_TOOLBOX_FILL_COLOR = '#FF8';
Config.INFO_GATE_IN_TOOLBOX_FILL_COLOR = '#4F4';
Config.PEEK_GATE_OFF_FILL_COLOR = '#EFD';
Config.PEEK_GATE_ON_FILL_COLOR = Config.INFO_GATE_IN_TOOLBOX_FILL_COLOR;

Config.BINARY_TREE_LABEL_EDGE_COLOR = 'gray';
Config.PAINT_MATRIX_GRID_COLOR_OR_NULL = null;
Config.CYCLE_DURATION_MS = 10000; // How long it takes for evolving gates to cycle, in milliseconds.
Config.TIME_CACHE_GRANULARITY = 200;
Config.REFRESH_DURATION_MS = 50;

Config.AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL = '#CCC';
Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR = '#555';
Config.AMPLITUDE_CIRCLE_STROKE_COLOR = Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR;

/** Half of the span of a drawn gate, width-wise and height-wise.
* @type {!number} */
Config.GATE_RADIUS = 20;

Config.BACKGROUND_COLOR = 'white';
Config.BACKGROUND_COLOR_CIRCUIT = 'white';
Config.BACKGROUND_COLOR_TOOLBOX = '#CCC';

Config.TOOLBOX_GATE_SPACING = 2;
Config.TOOLBOX_GROUP_SPACING = 24 - Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GATE_SPAN = Config.GATE_RADIUS * 2 + Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GROUP_SPAN = Config.TOOLBOX_GATE_SPAN * 2 + Config.TOOLBOX_GROUP_SPACING;
Config.TOOLBOX_MARGIN_X = 35;
Config.TOOLBOX_MARGIN_Y = 18;

Config.STATE_VIEWING_AREA_HEIGHT = 250;
