export default class Config {}

Config.NUM_INITIAL_WIRES = 4;
Config.CAPTURE_BUTTON_CAPTION = "Create GIF of Animation Cycle";
Config.EXTERNAL_DIR = "external/";

Config.CHART_COLORS = [
    "#3366CC",
    "#dc3912",
    "#ff9900",
    "#109618",
    "#990099",
    "#0099c6",
    "#dd4477",
    "#66aa00",
    "#b82e2e",
    "#316395",
    "#994499",
    "#22aa99",
    "#aaaa11",
    "#6633cc",
    "#e67300",
    "#8b0707"
];

Config.DEFAULT_FILL_COLOR = "white";
Config.DEFAULT_STROKE_COLOR = "black";
Config.DEFAULT_TEXT_COLOR = "black";
Config.DEFAULT_FONT_SIZE = 12;
Config.DEFAULT_FONT_FAMILY = "Helvetica";
Config.DEFAULT_STROKE_THICKNESS = 1;

Config.BINARY_TREE_LABEL_EDGE_COLOR = "gray";
Config.PROBABILITY_BOX_SEMI_FILL_COLOR = "#DDD";
Config.PROBABILITY_BOX_FILL_UP_COLOR = "lightgray";
Config.PAINT_MATRIX_GRID_COLOR_OR_NULL = null;

Config.AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL = "#CCC";
Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR = "#555";
Config.AMPLITUDE_CIRCLE_STROKE_COLOR = Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR;

/** Half of the span of a drawn gate, width-wise and height-wise.
* @type {!number} */
Config.GATE_RADIUS = 20;

Config.BACKGROUND_COLOR = "white";
Config.BACKGROUND_COLOR_CIRCUIT = "white";
Config.BACKGROUND_COLOR_TOOLBOX = "#CCC";
Config.MAX_WIRE_COUNT = 6;

Config.TOOLBOX_GATE_SPACING = 2;
Config.TOOLBOX_GROUP_SPACING = 24 - Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GATE_SPAN = Config.GATE_RADIUS * 2 + Config.TOOLBOX_GATE_SPACING;
Config.TOOLBOX_GROUP_SPAN = Config.TOOLBOX_GATE_SPAN * 2 + Config.TOOLBOX_GROUP_SPACING;
Config.TOOLBOX_MARGIN_X = 5;
Config.TOOLBOX_MARGIN_Y = 18;

Config.WIRE_COLOR_OFF = "#CCC";
Config.WIRE_COLOR_ON = "#000";
Config.HIGHLIGHT_COLOR_GATE = "orange";
Config.GATE_FILL_COLOR = "white";
Config.BROKEN_COLOR_GATE = "red";

Config.TOOLTIP_HIGHLIGHT_STROKE_COLOR = "red";
Config.CONTROL_WIRE_ACTIVE_GLOW_ALPHA = 0.6;
Config.CONTROL_WIRE_ACTIVE_GLOW_COLOR = "gray";

Config.URL_CIRCUIT_PARAM_KEY = "initialCircuit";
