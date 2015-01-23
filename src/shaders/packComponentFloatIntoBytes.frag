#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 resolution;
uniform int selector;
uniform sampler2D texture;

vec4 encode_float(float val) {
    // Zero? Avoid log(0).
    if (val == 0.0) {
        return vec4(0, 0, 0, 0);
    }

    // Extract sign chunks.
    float s1 = float(val < 0.0) * 128.0;
    val = abs(val);

    // Extract exponent chunks.
    float exponent = floor(log(val) / log(2.0));
    float e1 = floor(exponent/2.0 + 32.0);
    float e2 = mod(exponent, 2.0) * 128.0;

    // Extract mantissa chunks.
    float mantissa = val / pow(2.0, exponent) - 1.0;
    mantissa *= 128.0;
    float m1 = floor(mantissa);
    mantissa -= m1;
    mantissa *= 256.0;
    float m2 = floor(mantissa);
    mantissa -= m2;
    mantissa *= 256.0;
    float m3 = floor(mantissa);

    // Pack into bytes as IEEE single-precision float.
    return vec4(m3, m2, e2 + m1, s1 + e1) / 255.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data = texture2D(texture, uv);
    float f;
    if (selector == 0) {
        f = data.r;
    } else if (selector == 1) {
        f = data.g;
    } else if (selector == 2) {
        f = data.b;
    } else {
        f = data.a;
    }
    gl_FragColor = encode_float(f);
}
