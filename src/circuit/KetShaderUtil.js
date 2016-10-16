import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {workingShaderCoder, makePseudoShaderWithInputsAndOutputAndCode} from "src/webgl/ShaderCoders.js"

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 * @return {!{withArgs: !function(args: ...!WglArg) : !WglConfiguredShader}}
 */
const ketShader = (head, body, span=null) => ({withArgs: makePseudoShaderWithInputsAndOutputAndCode(
    [
        workingShaderCoder.vec2Input('ketgen_ket'),
        workingShaderCoder.boolInput('ketgen_control')
    ],
    workingShaderCoder.vec2Output,
    `
    uniform float _ketgen_step;
    ${span === null ? 'uniform float span;' : ''}
    float _ketgen_off;
    float full_out_id;

    ${body.match(/\bcmul\b/) ? 'vec2 cmul(vec2 c1, vec2 c2) { return mat2(c1.x, c1.y, -c1.y, c1.x) * c2; }' : ''}
    ${body.match(/\binp\b/) ? 'vec2 inp(float k) { return read_ketgen_ket(_ketgen_off + _ketgen_step*k); }' : ''}

    ${head}

    vec2 _ketgen_output_for(float out_id, vec2 amp) {
        ${body}
    }

    vec2 outputFor(float k) {
        full_out_id = k;

        float relevant_out_id = mod(floor(full_out_id / _ketgen_step), ${span === null ? 'span' : (1<<span)+'.0'});
        _ketgen_off = full_out_id - relevant_out_id*_ketgen_step;

        float c = read_ketgen_control(full_out_id);
        vec2 vc = read_ketgen_ket(full_out_id);
        vec2 vt = _ketgen_output_for(relevant_out_id, vc);
        return (1.0-c)*vc + c*vt;
    }`)});

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPermute = (head, body, span=null) => ketShader(
    head + `float _ketgen_input_for(float out_id) { ${body} }`,
    'return inp(_ketgen_input_for(out_id));',
    span);

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPhase = (head, body, span=null) => ketShader(
    head + `vec2 _ketgen_phase_for(float out_id) { ${body} }`,
    'return cmul(amp, _ketgen_phase_for(out_id));',
    span);

/**
 * @param {!CircuitEvalArgs} args
 * @param {undefined|!int=undefined} span
 * @returns {!Array.<!WglArg>}
 */
function ketArgs(args, span=undefined) {
    let result = [
        args.stateTrader.currentTexture,
        args.controlsTexture,
        WglArg.float("_ketgen_step", 1 << args.row)
    ];
    if (span !== undefined) {
        result.push(WglArg.float('span', 1 << span));
    }
    return result;
}

export {ketArgs, ketShader, ketShaderPermute, ketShaderPhase}
