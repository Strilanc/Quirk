#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 resolution;
uniform int selector;
uniform sampler2D texture;

vec4 encode_float(float val) {
    if (val == 0.0) {
        return vec4(0, 0, 0, 0);
    }
    val = val * 1048576.0;
    float sign = val > 0.0 ? 0.0 : 1.0;
    val = floor(abs(val));
    float byte4 = mod(val, 256.0) / 255.0;
    val = floor(val / 256.0);
    float byte3 = mod(val, 256.0) / 255.0;
    val = floor(val / 256.0);
    float byte2 = mod(val, 256.0) / 255.0;
    float byte1 = sign / 255.0;
    return vec4(byte4, byte3, byte2, byte1);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data = texture2D(texture, uv);
    if (selector == 0) {
        gl_FragColor = encode_float(data.r);
    } else if (selector == 1) {
        gl_FragColor = encode_float(data.g);
    } else {
        gl_FragColor = encode_float(data.b);
    }
}
