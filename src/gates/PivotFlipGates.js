import {Gate} from 'src/circuit/Gate.js'
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from 'src/circuit/KetShaderUtil.js'
import {modulusTooBigChecker} from 'src/gates/ModularIncrementGates.js'

let PivotFlipGates = {};

const PIVOT_FLIP_SHADER = ketShaderPermute(
    `
        ${ketInputGateShaderCode('A')}
    `,
    `
        float a = read_input_A();
        return out_id >= a ? out_id : a - out_id - 1.0;
    `);

PivotFlipGates.FlipUnderA = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId('Flip<A' + span).
    setSymbol('Flip\n< A').
    setTitle('Pivot-Flip Gate').
    setBlurb('Reverses the order of states below the pivot value.').
    setRequiredContextKeys('Input Range A').
    setExtraDisableReasonFinder(modulusTooBigChecker('A', span, 'pivot')).
    setActualEffectToShaderProvider(ctx => PIVOT_FLIP_SHADER.withArgs(...ketArgs(ctx, span, ['A']))).
    setKnownEffectToParametrizedPermutation((t, a) => t >= a ? t : a - t - 1));

PivotFlipGates.all = [
    ...PivotFlipGates.FlipUnderA.all,
];

export {PivotFlipGates}
