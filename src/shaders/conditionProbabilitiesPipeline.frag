/**
 * Extracts probabilities.
 */

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 textureSize;
uniform sampler2D inputTexture;
uniform float stepPower;
uniform bool conditionValue;

vec2 stateToPixelUv(float state) {
    float c = state + 0.5;
    float r = mod(c, textureSize.x);
    float d = floor(c / textureSize.x) + 0.5;
    return vec2(r, d) / textureSize.xy;
}

float filterBit(float value, float bit) {
    value += 0.5;
    return mod(value, bit * 2.0) - mod(value, bit);
}

void main() {
    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
    vec2 pixelUv = gl_FragCoord.xy / textureSize;
    float state = pixelXy.y * textureSize.x + pixelXy.x;

    float hasBit = filterBit(state, stepPower);
    vec4 probability = texture2D(inputTexture, pixelUv);
    if ((hasBit == 0.0) == conditionValue) {
        float toggleSign = float(conditionValue)*2.0 - 1.0;
        probability += texture2D(inputTexture, stateToPixelUv(state + stepPower * toggleSign));
    }
    gl_FragColor = probability;
}
