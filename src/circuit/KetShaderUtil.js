import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShader = (head, body, span=null) => new WglShader(`
    uniform sampler2D _k_ket;
    uniform sampler2D _k_control;
    uniform vec2 _k_size;
    uniform float _k_step;
    ${span === null ? 'uniform float span;' : ''}
    float _k_off;
    float full_out_id;

    vec2 _k_toUv(float k) {
        return vec2(mod(k, _k_size.x) + 0.5, floor(k / _k_size.x) + 0.5) / _k_size;
    }
    ${body.match(/\bcmul\b/) ? 'vec2 cmul(vec2 c1, vec2 c2) { return mat2(c1.x, c1.y, -c1.y, c1.x) * c2; }' : ''}
    ${body.match(/\binp\b/) ? 'vec2 inp(float k) { return texture2D(_k_ket, _k_toUv(_k_off + _k_step*k)).xy; }' : ''}

    ${head}

    vec2 _k_output_for(float out_id, vec2 amp) {
        ${body}
    }

    vec2 _k_output() {
        float relevant_out_id = mod(floor(full_out_id / _k_step), ${span === null ? 'span' : (1<<span)+'.0'});
        _k_off = full_out_id - relevant_out_id*_k_step;

        float c = texture2D(_k_control, _k_toUv(full_out_id)).x;
        vec2 vc = texture2D(_k_ket, _k_toUv(full_out_id)).xy;
        vec2 vt = _k_output_for(relevant_out_id, vc);
        return (1.0-c)*vc + c*vt;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        full_out_id = xy.y * _k_size.x + xy.x;
        vec2 v = _k_output();
        gl_FragColor = vec4(v.x, v.y, 0.0, 0.0);
    }`);

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPermute = (head, body, span=null) => ketShader(
    head + `float _k_input_for(float out_id) { ${body} }`,
    'return inp(_k_input_for(out_id));',
    span);

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPhase = (head, body, span=null) => ketShader(
    head + `vec2 _k_phase_for(float out_id) { ${body} }`,
    'return cmul(amp, _k_phase_for(out_id));',
    span);

/**
 * @param {!CircuitEvalArgs} args
 * @param {undefined|!int=undefined} span
 * @returns {!Array.<!WglArg>}
 */
function ketArgs(args, span=undefined) {
    let result = [
        WglArg.texture("_k_ket", args.stateTexture),
        WglArg.texture("_k_control", args.controlsTexture),
        WglArg.vec2("_k_size", args.stateTexture.width, args.stateTexture.height),
        WglArg.float("_k_step", 1 << args.row)
    ];
    if (span !== undefined) {
        result.push(WglArg.float('span', 1 << span));
    }
    return result;
}

export {ketArgs, ketShader, ketShaderPermute, ketShaderPhase}
