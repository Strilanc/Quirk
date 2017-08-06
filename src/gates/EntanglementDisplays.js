import {Complex} from "src/math/Complex.js"
import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Matrix} from "src/math/Matrix.js"
import {densityDisplayStatTexture, densityPixelsToMatrix} from "src/gates/DensityMatrixDisplay.js"

let EntanglementDisplays = {};

/**
 * @param {!Painter} painter
 * @param {!number} x
 * @param {!number} y
 * @param {!number} z
 * @param {!Rect} drawArea
 * @param {!string=} fillColor
 */
function _paintBlochSphereDisplay_indicator(
    painter,
    [x, y, z],
    drawArea,
    fillColor) {
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let {dx, dy, dz} = MathPainter.coordinateSystem(u);

    let p = c.plus(dx.times(x)).plus(dy.times(y)).plus(dz.times(z));
    let r = 3.8 / (1 + drawArea.w/32 * x / 6);

    // Draw state indicators (in not-quite-correct 3d).
    painter.strokeLine(c, p, 'black', 1.5);
    painter.fillCircle(p, r, fillColor);
    painter.strokeCircle(p, r, 'black');

    // Show depth by lerping the line from overlaying to being overlayd by the ball.
    painter.ctx.save();
    painter.ctx.globalAlpha *= Math.min(1, Math.max(0, 0.5+x*5));
    painter.strokeLine(c, p, 'black', 2);
    painter.ctx.restore();
}

/**
 * @param {!Painter} painter
 * @param {!Matrix} xyz
 * @param {!Rect} drawArea
 * @param {!string} fillColor
 * @param {!string} label
 * @param scale
 * @param no_scale
 */
function _paintBlochSphereDisplay_indicator2(
        painter,
        xyz,
        drawArea,
        fillColor,
        label,
        scale=1,
        no_scale=false) {
    let x = xyz.rawBuffer()[0];
    let y = xyz.rawBuffer()[2];
    let z = xyz.rawBuffer()[4];
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let {dx, dy, dz} = MathPainter.coordinateSystem(u);

    let p = c.plus(dx.times(x)).plus(dy.times(y)).plus(dz.times(z));
    let r = 7 / (1 + drawArea.w/32 * x / 6);
    r *= (no_scale ? 1 : Math.sqrt(Math.sqrt(x*x + y*y + z*z))) * scale;

    // Draw state indicators (in not-quite-correct 3d).
    painter.strokeLine(c, p, 'black', 2);
    painter.fillCircle(p, r, fillColor);
    painter.strokeCircle(p, r, 'black');

    // Show depth by lerping the line from overlaying to being overlayd by the ball.
    painter.ctx.save();
    painter.ctx.globalAlpha *= Math.min(1, Math.max(0, 0.5 + x * 5));
    painter.strokeLine(c, p, 'black', 2);
    painter.ctx.restore();

    painter.print(label, p.x, p.y, 'center', 'middle', 'black', '36pt monospace', r*3, r*3);
}
/**
 * @param {!Painter} painter
 * @param {!Matrix} point
 * @param {!Rect} drawArea
 * @param {!string=} fillColor
 */
function _paintPoint3D(painter, point, drawArea, fillColor) {
    let x = point.cell(0, 0).real;
    let y = point.cell(0, 1).real;
    let z = point.cell(0, 2).real;
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let {dx, dy, dz} = MathPainter.coordinateSystem(u);
    let p = c.plus(dx.times(x)).plus(dy.times(y)).plus(dz.times(z));
    let r = 8 / (1 + drawArea.w/32 * x / 8);
    r *= 0.2;
    painter.fillCircle(p, r, fillColor);
}

/**
 * @param {!Painter} painter
 * @param {!Rect} drawArea
 */
function _paintBackground(painter, drawArea) {
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let {dx, dy, dz} = MathPainter.coordinateSystem(u);

    // Draw sphere and axis lines (in not-quite-proper 3d).
    painter.fillCircle(c, u, '#EFF');
    painter.trace(trace => {
        trace.circle(c.x, c.y, u);
        trace.ellipse(c.x, c.y, dy.x, dx.y);
        trace.ellipse(c.x, c.y, dx.x, dz.y);
        for (let d of [dx, dy, dz]) {
            trace.line(c.x - d.x, c.y - d.y, c.x + d.x, c.y + d.y);
        }
    }).thenStroke('#BBB');
}

/**
 * @param {!Matrix} two_qubit_density
 * @returns {!Matrix}
 */
function density_qubit_2(two_qubit_density) {
    return Matrix.square(
        two_qubit_density.cell(0, 0).plus(two_qubit_density.cell(2, 2)),
        two_qubit_density.cell(1, 0).plus(two_qubit_density.cell(3, 2)),
        two_qubit_density.cell(0, 1).plus(two_qubit_density.cell(2, 3)),
        two_qubit_density.cell(1, 1).plus(two_qubit_density.cell(3, 3)));
}

/**
 * @param {!Matrix} two_qubit_density
 * @returns {!Matrix}
 */
function density_qubit_1(two_qubit_density) {
    return Matrix.square(
        two_qubit_density.cell(0, 0).plus(two_qubit_density.cell(1, 1)),
        two_qubit_density.cell(2, 0).plus(two_qubit_density.cell(3, 1)),
        two_qubit_density.cell(0, 2).plus(two_qubit_density.cell(1, 3)),
        two_qubit_density.cell(2, 2).plus(two_qubit_density.cell(3, 3)));
}

/**
 * @param {!Matrix} two_qubit_density
 * @returns {!Matrix}
 */
function bloch_vector_of_2nd_qubit(two_qubit_density) {
    return Matrix.col(...density_qubit_2(two_qubit_density).qubitDensityMatrixToBlochVector());
}

/**
 * @param {!Matrix} two_qubit_density
 * @param {!Matrix} required_1st_qubit_amps
 * @returns {!{p: !number, ρ: !Matrix}}
 */
function density_given_1st_qubit(two_qubit_density, required_1st_qubit_amps) {
    // Normalize input.
    let u = required_1st_qubit_amps.times(1 / Math.sqrt(required_1st_qubit_amps.norm2()));

    // Project.
    let expanded_state = u.tensorProduct(Matrix.identity(2));
    let projector = expanded_state.times(expanded_state.adjoint());
    let projected_density = two_qubit_density.times(projector);

    // Normalize output.
    let p = projected_density.trace().abs();
    if (p < 0.0001) {
        return {p, ρ: Matrix.generateDiagonal(4, _ => 0.25)};
    }

    // A blatant violation of proper naming practices.
    return {p, ρ: projected_density.times(1 / p)};
}

function second_qubit_point_given_first(two_qubit_density, required_1st_qubit_amps) {
    let density_given_q1 = density_given_1st_qubit(two_qubit_density, required_1st_qubit_amps).ρ;
    return bloch_vector_of_2nd_qubit(density_given_q1);
}

function second_qubit_point_given_first_purity_scaled(two_qubit_density, required_1st_qubit_amps) {
    let projected_density = density_given_1st_qubit(two_qubit_density, required_1st_qubit_amps).ρ;
    let v_pre = bloch_vector_of_2nd_qubit(two_qubit_density);
    let v_post = bloch_vector_of_2nd_qubit(projected_density);

    let purity_pre = Math.sqrt(v_pre.norm2());
    let purity_post = Math.sqrt(v_post.norm2());
    let purity_increase = purity_post - purity_pre;

    return v_post.times(purity_increase);
}

function second_qubit_point_given_first_trace_scaled(two_qubit_density, required_1st_qubit_amps) {
    let {p, ρ} = density_given_1st_qubit(two_qubit_density, required_1st_qubit_amps);
    let v_pre = bloch_vector_of_2nd_qubit(two_qubit_density);
    let v_post = bloch_vector_of_2nd_qubit(ρ);
    return v_post.times(p).times(2).minus(v_pre);
}

function eigenDecompose(hermitian) {
    let results = [];
    while (results.length < 4 && hermitian.norm2() > 0.001) {
        let v = Matrix.generate(1, 4, () => new Complex(Math.random(), Math.random()));
        let m = hermitian;
        for (let k = 0; k < 4; k++) {
            m = m.times(m);
        }
        for (let k = 0; k < 20; k++) {
            v = m.times(v);
            v = v.times(1 / Math.sqrt(v.norm2()));
        }
        let w = hermitian.times(v).norm2();
        results.push({vec: v, val: w});
        hermitian = hermitian.minus(v.times(v.adjoint()).times(w));
    }
    return results;
}

function paintAxes1(painter, density, drawArea) {
    let amps_matrix = new Matrix(2, 2, eigenDecompose(density)[0].vec.rawBuffer());
    let {U, S, V} = amps_matrix.singularValueDecomposition();
    let s1 = S.cell(1, 1).real;
    let factored_state_1 = density_qubit_1(density);
    let factored_state_2 = density_qubit_2(density);

    let weight_entangled = 2*s1*s1;
    let entangled_state = U.times(V);

    _paintBlochSphereDisplay_indicator(painter, factored_state_1.qubitDensityMatrixToBlochVector(), drawArea, 'black');
    _paintBlochSphereDisplay_indicator(painter, factored_state_2.qubitDensityMatrixToBlochVector(), drawArea, 'white');

    let rr = drawArea.scaledOutwardBy(Math.sqrt(weight_entangled));
    let xyz = entangled_state.times(Matrix.square(1, 0, 0, 0)).times(entangled_state.adjoint()).qubitDensityMatrixToBlochVector();
    _paintBlochSphereDisplay_indicator(painter, xyz, rr, 'red');
    xyz = entangled_state.times(Matrix.square(0.5, 0.5, 0.5, 0.5)).times(entangled_state.adjoint()).qubitDensityMatrixToBlochVector();
    _paintBlochSphereDisplay_indicator(painter, xyz, rr, 'green');
    xyz = entangled_state.times(Matrix.square(0.5, new Complex(0, -0.5), new Complex(0, 0.5), 0.5)).times(entangled_state.adjoint()).qubitDensityMatrixToBlochVector();
    _paintBlochSphereDisplay_indicator(painter, xyz, rr, 'blue');
}

function paintAxes2(painter, density, drawArea) {
    let vx = Matrix.col(0, 0, 0);
    let vy = Matrix.col(0, 0, 0);
    let vz = Matrix.col(0, 0, 0);

    for (let eigen of eigenDecompose(density)) {
        let M = new Matrix(2, 2, eigen.vec.rawBuffer());
        let {U, S, V} = M.singularValueDecomposition();
        let s = S.cell(1, 1).real;
        let weight = 2*s*s;
        let E = U.times(V);
        let state_to_xyz_contribution = (...vec_raw) => {
            let vec = Matrix.col(...vec_raw);
            let unit_vec = vec.times(1 / Math.sqrt(vec.norm2()));
            let mat = unit_vec.times(unit_vec.adjoint());
            let mat2 = E.times(mat).times(E.adjoint());
            let xyz = mat2.qubitDensityMatrixToBlochVector();
            return Matrix.col(...xyz).times(weight * eigen.val);
        };
        vx = vx.plus(state_to_xyz_contribution(1, 1));
        vy = vy.plus(state_to_xyz_contribution(1, Complex.I));
        vz = vz.plus(state_to_xyz_contribution(1, 0));
    }

    _paintBlochSphereDisplay_indicator2(painter, vy, drawArea, '#AFA', 'y');
    _paintBlochSphereDisplay_indicator2(painter, vz, drawArea, '#AAF', 'z');
    _paintBlochSphereDisplay_indicator2(painter, vx, drawArea, '#FAA', 'x');
}

/**
 * @param {!Painter} painter
 * @param {!Matrix} stateDensityMatrix
 * @param {!Rect} drawArea
 * @param {!function(!Matrix, !Matrix): !Matrix} pointPicker
 */
function paintStatePointCloud(painter, stateDensityMatrix, drawArea, pointPicker) {
    for (let pitch = 0.01; pitch < Math.PI / 2; pitch += 0.15) {
        let amp0 = Math.cos(pitch);
        let amp1_abs = Math.sin(pitch);
        let c2 = ''+Math.floor(pitch / Math.PI * 2 * 80 + 10);
        let dr = 0.15 / Math.sin(pitch * 2);
        for (let yaw = 0.0001; yaw < Math.PI * 2; yaw += dr) {
            let c1 = ''+Math.floor(yaw / Math.PI / 2 * 80 + 10);
            let color = '#' + c2 + c1 + '00';
            let amp1 = Complex.polar(amp1_abs, yaw);
            let pt = pointPicker(stateDensityMatrix, Matrix.col(amp0, amp1));
            _paintPoint3D(painter, pt, drawArea, color);
        }
    }
}

function make_density_drawer(id, drawer) {
    return new GateBuilder().
        setSerializedIdAndSymbol(id).
        setWidth(2).
        setHeight(2).
        promiseHasNoNetEffectOnStateVector().
        setDrawer(GatePainting.makeDisplayDrawer(args => {
            let ρ = args.customStats || Matrix.zero(4, 4).times(NaN);
            if (ρ.hasNaN()) {
                MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
                return;
            }
            _paintBackground(args.painter, args.rect);
            drawer(args, ρ);
        })).
        setStatTexturesMaker(ctx => densityDisplayStatTexture(
            ctx.stateTrader.currentTexture, ctx.wireCount, ctx.controls, ctx.row, 2)).
        setStatPixelDataPostProcessor(densityPixelsToMatrix).
        gate;
}

EntanglementDisplays.Iteration1 = make_density_drawer("iter1", (args, ρ) =>
    paintAxes1(args.painter, ρ, args.rect));

EntanglementDisplays.Iteration2 = make_density_drawer("iter2", (args, ρ) =>
    paintAxes2(args.painter, ρ, args.rect));

EntanglementDisplays.Iteration3 = make_density_drawer("iter3", (args, ρ) =>
    paintStatePointCloud(args.painter, ρ, args.rect, second_qubit_point_given_first));

EntanglementDisplays.Iteration4 = make_density_drawer("iter4", (args, ρ) =>
    paintStatePointCloud(args.painter, ρ, args.rect, second_qubit_point_given_first_trace_scaled));

EntanglementDisplays.Iteration5 = make_density_drawer("iter5", (args, ρ) =>
    paintStatePointCloud(args.painter, ρ, args.rect, second_qubit_point_given_first_purity_scaled));

EntanglementDisplays.Iteration6 = new GateBuilder().
    setSerializedIdAndSymbol('iter6').
    setWidth(1).
    setHeight(2).
    promiseHasNoNetEffectOnStateVector().
    setDrawer(GatePainting.makeDisplayDrawer(args => {
        let ρ = args.customStats || Matrix.zero(4, 4).times(NaN);
        if (ρ.hasNaN()) {
            MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
            return;
        }

        for (let dx of [0]) {
            args.painter.strokeLine(args.rect.topHalf().center().offsetBy(dx, 0), args.rect.bottomHalf().center().offsetBy(dx, 0));
        }
        let topArea = args.rect.topHalf();
        let c = topArea.center();
        let u = Math.min(topArea.w, topArea.h) / 2;
        let {dx, dy, dz} = MathPainter.coordinateSystem(u);

        // Draw sphere and axis lines (in not-quite-proper 3d).
        args.painter.fillCircle(c, u, '#EFF');
        args.painter.trace(trace => {
            trace.circle(c.x, c.y, u);
            trace.ellipse(c.x, c.y, dy.x, dx.y);
            trace.ellipse(c.x, c.y, dx.x, dz.y);
            for (let d of [dx, dy, dz]) {
                trace.line(c.x - d.x, c.y - d.y, c.x + d.x, c.y + d.y);
            }
        }).thenStroke('#BBB');

        let vc = args.rect.bottomHalf().center();
        args.painter.fillCircle(vc, 10, '#EFF');
        args.painter.strokeCircle(vc, 10, 'black');
        args.painter.print('∀', vc.x, vc.y, 'center', 'middle', 'black', '16pt monospace', 20, 20);

        paintStatePointCloud(args.painter, ρ, topArea, second_qubit_point_given_first);

        let pts = [];
        for (let [yaw, pitch, label, color, scale] of [
            [Math.PI/2, -Math.PI/2, '', '#AFA', 0.3],
            [0, -Math.PI/2, '', '#FAA', 0.3],
            [0, Math.PI, '', '#AAF', 0.3],
            [Math.PI/2, Math.PI/2, 'Y', '#AFA', 0.7],
            [0, Math.PI/2, 'X', '#FAA', 0.7],
            [0, 0, 'Z', '#AAF', 0.7],
        ]) {
            let amp0 = Math.cos(pitch/2);
            let amp1_abs = Math.sin(pitch/2);
            let amp1 = Complex.polar(amp1_abs, yaw);
            let xyz = second_qubit_point_given_first(ρ, Matrix.col(amp0, amp1));
            if (xyz.norm2() > 0) {
                pts.push(xyz);
                _paintBlochSphereDisplay_indicator2(args.painter, xyz, topArea, color, label, scale);
            }
        }
        let [x,y,z] = density_qubit_2(ρ).qubitDensityMatrixToBlochVector();
        let m = 0;
        for (let e1 of pts) {
            for (let e2 of pts) {
                m += e1.minus(e2).norm2();
            }
        }

        args.painter.ctx.save();
        args.painter.ctx.globalAlpha *= Math.max(0, 1 - m*10);
        _paintBlochSphereDisplay_indicator2(args.painter, Matrix.col(x, y, z), topArea, 'white', '', 0.7, true);
        args.painter.ctx.restore();
    })).
    setStatTexturesMaker(ctx => densityDisplayStatTexture(
        ctx.stateTrader.currentTexture, ctx.wireCount, ctx.controls, ctx.row, 2)).
    setStatPixelDataPostProcessor(densityPixelsToMatrix).
    gate;

EntanglementDisplays.all = [
    EntanglementDisplays.Iteration1,
    EntanglementDisplays.Iteration2,
    EntanglementDisplays.Iteration3,
    EntanglementDisplays.Iteration4,
    EntanglementDisplays.Iteration5,
    EntanglementDisplays.Iteration6,
];

export {EntanglementDisplays}
