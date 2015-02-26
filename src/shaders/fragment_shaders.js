let FRAGMENT_SHADER_SRCS = {};
let FRAGMENT_SHADER_FUNCS = {};

export { FRAGMENT_SHADER_SRCS, FRAGMENT_SHADER_FUNCS };

FRAGMENT_SHADER_FUNCS.FILTER_BIT = [
    /**
     * Does a bitwise-and of the given integer value against a single-bit bit mask.
     * @param value The (approximate) integer to extract a bit from.
     * @param singleBitMask A power of two corresponding to the bit to retain (all others get masked out).
     */
    "float filterBit(float value, float bit) {",
    "    value += 0.5;",
    "    return mod(value, bit * 2.0) - mod(value, bit);",
    "}"
].join("\n");

FRAGMENT_SHADER_FUNCS.TOGGLE_BIT = [
    /**
     * Does a bitwise-xor of the given integer value against a single-bit bit mask.
     * @param value The (approximate) integer to toggle a bit in.
     * @param singleBitMask A power of two corresponding to the bit to toggle (all others get left alone).
     */
    "float toggleBit(float value, float bit) {",
    "    float hasBit = filterBit(value, bit);",
    "    return value + bit - 2.0 * hasBit;",
    "}"
].join("\n");

FRAGMENT_SHADER_FUNCS.STATE_TO_PIXEL_UV = [
    /**
     * Converts the index of a classical state to the XY coordinate of the pixel storing its amplitude.
     * @param state The classical state's index, where the index in binary is a list of the qubit values.
     */
    "vec2 stateToPixelUv(float state) {",
    "    float c = state + 0.5;",
    "    float r = mod(c, textureSize.x);",
    "    float d = floor(c / textureSize.x) + 0.5;",
    "    return vec2(r, d) / textureSize.xy;",
    "}"
].join("\n");

/**
 * Renders the result of applying a custom optionally-controlled single-qubit operation to a superposition.
 */
FRAGMENT_SHADER_SRCS.APPLY_CUSTOM_QUBIT_OPERATION = [
    /**
     * A texture holding the complex coefficients of the superposition to operate on.
     * The real components are in the red component, and the imaginary components are in the green component.
     */
    "uniform sampler2D inputTexture;",

    /**
     * A texture with flags that determine which states get affected by the operation.
     * The red component is 1 for states that should participate, and 0 otherwise.
     */
    "uniform sampler2D controlTexture;",

    /**
     * The width and height of the textures being operated on.
     */
    "uniform vec2 textureSize;",

    /**
     * A power of two (2^n) with the exponent n determined by the index of the qubit to operate on.
     */
    "uniform float qubitIndexMask;",

    /**
     * The row-wise complex coefficients of the matrix to apply. Laid out normally, they would be:
     * M = |a b|
     *     |c d|
     */
    "uniform vec2 matrix_a, matrix_b, matrix_c, matrix_d;",

    FRAGMENT_SHADER_FUNCS.FILTER_BIT,
    FRAGMENT_SHADER_FUNCS.TOGGLE_BIT,
    FRAGMENT_SHADER_FUNCS.STATE_TO_PIXEL_UV,

    "void main() {",

    // Which part of the multiplication are we doing?
    "    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);",
    "    vec2 pixelUv = gl_FragCoord.xy / textureSize;",
    "    float state = pixelXy.y * textureSize.x + pixelXy.x;",
    "    float opposingState = toggleBit(state, qubitIndexMask);",
    "    vec2 opposingPixelUv = stateToPixelUv(opposingState);",
    "    bool targetBitIsOff = state < opposingState;",

    // Does this part of the superposition match the controls?
    "    bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;",
    "    if (blockedByControls) {",
    "        gl_FragColor = texture2D(inputTexture, pixelUv);",
    "        return;",
    "    }",

    // The row we operate against is determined by the output pixel's operated-on-bit's value
    "    vec2 c1, c2;",
    "    if (targetBitIsOff) {",
    "        c1 = matrix_a;",
    "        c2 = matrix_b;",
    "    } else {",
    "        c1 = matrix_d;",
    "        c2 = matrix_c;",
    "    }",

    // Do (our part of) the matrix multiplication
    "    vec4 amplitudeCombo = vec4(texture2D(inputTexture, pixelUv).xy,",
    "                               texture2D(inputTexture, opposingPixelUv).xy);",
    "    vec4 dotReal = vec4(c1.x, -c1.y,",
    "                        c2.x, -c2.y);",
    "    vec4 dotImag = vec4(c1.y, c1.x,",
    "                        c2.y, c2.x);",
    "    vec2 outputAmplitude = vec2(dot(amplitudeCombo, dotReal),",
    "                                dot(amplitudeCombo, dotImag));",

    "    gl_FragColor = vec4(outputAmplitude, 0, 0);",

    "}"
].join("\n");

/**
 * Renders a control texture that prevents operations in states where the given bit is equal to the given value.
 */
FRAGMENT_SHADER_SRCS.INIT_SINGLE_CONTROL = [
    /**
     * The width and height of the textures being operated on.
     */
    "uniform vec2 textureSize;",

    /**
     * A power of two (2^n) with the exponent n determined by the index of the qubit acting as a control.
     */
    "uniform float qubitIndexMask;",

    /**
     * The value that the qubit must have for the control to be satisfied.
     */
    "uniform float targetValue;",

    "void main() {",
    "    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);",
    "    float state = pixelXy.y * textureSize.x + pixelXy.x;",
    "    bool targetBitIsOn = mod(state, qubitIndexMask * 2.0) > qubitIndexMask - 0.5;",

    "    float match = mod(float(targetBitIsOn) + targetValue + 1.0, 2.0);",
    "    gl_FragColor = vec4(match, 0, 0, 0);",
    "}"
].join("\n");

/**
 * Encodes the red, green, blue, or alpha floating point component of the texture;s pixels so that, when read as bytes,
 * the output holds (roughly) IEEE single-precision float data.
 */
FRAGMENT_SHADER_SRCS.PACK_COMPONENT_FLOAT_INTO_BYTES = [
    "uniform vec2 textureSize;",
    "uniform int selector;",
    "uniform sampler2D texture;",

    "vec4 encode_float(float val) {",
    // Zero? Avoid log(0).
    "    if (val == 0.0) {",
    "        return vec4(0, 0, 0, 0);",
    "    }",

    // Extract sign chunks.
    "    float s1 = float(val < 0.0) * 128.0;",
    "    val = abs(val);",

    // Extract exponent chunks.
    "    float exponent = floor(log(val) / log(2.0));",
    "    float e1 = floor(exponent/2.0 + 32.0);",
    "    float e2 = mod(exponent, 2.0) * 128.0;",

    // Extract mantissa chunks.
    "    float mantissa = val / pow(2.0, exponent) - 1.0;",
    "    mantissa *= 128.0;",
    "    float m1 = floor(mantissa);",
    "    mantissa -= m1;",
    "    mantissa *= 256.0;",
    "    float m2 = floor(mantissa);",
    "    mantissa -= m2;",
    "    mantissa *= 256.0;",
    "    float m3 = floor(mantissa);",

    // Pack into bytes as IEEE single-precision float.
    "    return vec4(m3, m2, e2 + m1, s1 + e1) / 255.0;",
    "}",

    "void main() {",
    "    vec2 uv = gl_FragCoord.xy / textureSize.xy;",
    "    vec4 data = texture2D(texture, uv);",
    "    float f;",
    "    if (selector == 0) {",
    "        f = data.r;",
    "    } else if (selector == 1) {",
    "        f = data.g;",
    "    } else if (selector == 2) {",
    "        f = data.b;",
    "    } else {",
    "        f = data.a;",
    "    }",
    "    gl_FragColor = encode_float(f);",
    "}"
].join("\n");

/**
 * Renders a texture storing the same data as a given texture.
 */
FRAGMENT_SHADER_SRCS.PASS_THROUGH = [
    "uniform vec2 textureSize;",
    "uniform sampler2D inputTexture;",

    "void main() {",
    "    vec2 uv = gl_FragCoord.xy / textureSize.xy;",
    "    gl_FragColor = texture2D(inputTexture, uv);",
    "}"
].join("\n");

/**
 * Renders a texture storing the same data as a given texture.
 */
FRAGMENT_SHADER_SRCS.OVERLAY = [
    "uniform vec2 backgroundTextureSize;",
    "uniform vec2 foregroundTextureSize;",
    "uniform sampler2D backgroundTexture;",
    "uniform sampler2D foregroundTexture;",
    "uniform vec2 xy;",

    "void main() {",
    "    vec2 uv = (gl_FragCoord.xy - xy) / foregroundTextureSize.xy;",
    "    if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x < 1.0 && uv.y < 1.0) {",
    "      gl_FragColor = texture2D(foregroundTexture, uv);",
    "    } else {",
    "      uv = gl_FragCoord.xy / backgroundTextureSize;",
    "      gl_FragColor = texture2D(backgroundTexture, uv);",
    "    }",
    "}"
].join("\n");

/**
 * Renders a control texture equal to the intersection of two input control textures. The output texture prevents any
 * operation prevented by either of the input textures.
 */
FRAGMENT_SHADER_SRCS.COMBINE_CONTROLS = [
    /**
     * The width and height of the textures being operated on.
     */
    "uniform vec2 textureSize;",

    /**
     * A texture with flags that determine which states get affected by operations.
     * The red component is 1 for states that should participate, and 0 otherwise.
     */
    "uniform sampler2D controlTexture1;",
    /**
     * Another texture with flags that determine which states get affected by operations.
     * The red component is 1 for states that should participate, and 0 otherwise.
     */
    "uniform sampler2D controlTexture2;",

    "void main() {",
    "    vec2 uv = gl_FragCoord.xy / textureSize.xy;",
    "    float c1 = texture2D(controlTexture1, uv).x;",
    "    float c2 = texture2D(controlTexture2, uv).x;",
    "    gl_FragColor = vec4(c1 * c2, 0, 0, 0);",
    "}"
].join("\n");

/**
 * Turns the amplitude stored at each pixel into a probability.
 */
FRAGMENT_SHADER_SRCS.FROM_AMPLITUDES_TO_PROBABILITIES = [
    "uniform vec2 textureSize;",
    "uniform sampler2D inputTexture;",

    "void main() {",
    "    vec2 uv = gl_FragCoord.xy / textureSize.xy;",
    "    vec4 amps = texture2D(inputTexture, uv);",
    "    float p = dot(amps, amps);",
    "    gl_FragColor = vec4(p, 0, 0, 0);",
    "}"
].join("\n");

/**
 * Incrementally combines probabilities so that each pixel ends up corresponding to a mask and their value is the sum
 * of all probabilities matching the mask.
 */
FRAGMENT_SHADER_SRCS.CONDITIONAL_PROBABILITIES_PIPELINE = [
    "uniform vec2 textureSize;",
    "uniform sampler2D inputTexture;",
    "uniform float stepPower;",
    "uniform bool conditionValue;",

    FRAGMENT_SHADER_FUNCS.STATE_TO_PIXEL_UV,
    FRAGMENT_SHADER_FUNCS.FILTER_BIT,

    "void main() {",
    "    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);",
    "    vec2 pixelUv = gl_FragCoord.xy / textureSize;",
    "    float state = pixelXy.y * textureSize.x + pixelXy.x;",

    "    float hasBit = filterBit(state, stepPower);",
    "    vec4 probability = texture2D(inputTexture, pixelUv);",
    "    if ((hasBit == 0.0) == conditionValue) {",
    "        float toggleSign = float(conditionValue)*2.0 - 1.0;",
    "        probability += texture2D(inputTexture, stateToPixelUv(state + stepPower * toggleSign));",
    "    }",
    "    gl_FragColor = probability;",
    "}"
].join("\n");
