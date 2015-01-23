#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 textureSize;
uniform sampler2D stateTexture;
uniform sampler2D accumulatorTexture;
uniform float stepPower;

vec2 stateToPixelUv(float state) {
    float c = state + 0.5;
    float r = mod(c, textureSize.x);
    float d = floor(c / textureSize.x) + 0.5;
    return vec2(r, d) / textureSize.xy;
}

void main() {
    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
    vec2 pixelUv = gl_FragCoord.xy / textureSize;
    float state = pixelXy.y * textureSize.x + pixelXy.x;
    float stateCount = textureSize.x * textureSize.y;

    if (state * 2.0 < stateCount) {
        // Summing area.
        vec2 summand_uv1 = stateToPixelUv(state * 2.0);
        vec2 summand_uv2 = stateToPixelUv(state * 2.0 + 1.0);
        vec4 summand_1 = texture2D(accumulatorTexture, summand_uv1);
        vec4 summand_2 = texture2D(accumulatorTexture, summand_uv2);
        gl_FragColor = summand_1 + summand_2;
    } else if (stepPower < stateCount) {
        // Loading area.
        float below = mod(state, stepPower);
        float above = state - below;
        float shift = above * 2.0 + below - stateCount;
        vec4 offAmplitude = texture2D(stateTexture, stateToPixelUv(shift));
        gl_FragColor = vec4(dot(offAmplitude, offAmplitude), 0, 0, 0);
    } else {
        // Queueing area.
        float dx = 1.0/textureSize.x;
        vec2 quv;
        if (pixelXy.x == 0.0) {
            quv = vec2(dx*1.5, 0);
        } else {
            quv = pixelUv - vec2(dx, 0);
        }
        gl_FragColor = texture2D(accumulatorTexture, quv);
    }
}
