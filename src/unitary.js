// uses: complex.js

function unitary_2x2(v) {
    this.m = [Complex.from(v[0]), Complex.from(v[1]), Complex.from(v[2]), Complex.from(v[3])];
}

unitary_2x2.prototype.toString = function () {
    return "[[" + this.m[0] + ", " + this.m[1] + "], [" + this.m[2] + ", " + this.m[3] + "]]";
};

unitary_2x2.prototype.adjoint = function () {
    return new unitary_2x2([this.m[0].conjugate(), this.m[2].conjugate(),
        this.m[1].conjugate(), this.m[3].conjugate()]);
};

unitary_2x2.prototype.scaledBy = function (s) {
    s = Complex.from(s);
    return new unitary_2x2([this.m[0].times(s), this.m[1].times(s),
        this.m[2].times(s), this.m[3].times(s)]);
};

unitary_2x2.prototype.plus = function (other) {
    return new unitary_2x2([this.m[0].plus(other.m[0]), this.m[1].plus(other.m[1]),
        this.m[2].plus(other.m[2]), this.m[3].plus(other.m[3])]);
};

unitary_2x2.prototype.times = function (other) {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var e = other.m[0];
    var f = other.m[1];
    var g = other.m[2];
    var h = other.m[3];

    return new unitary_2x2([
        a.times(e).plus(b.times(g)), a.times(f).plus(b.times(h)),
        c.times(e).plus(d.times(g)), c.times(f).plus(d.times(h))]);
};

unitary_2x2.prototype.draw = function (ctx, x, y, d) {
    ctx.fillStyle = "yellow";
    var w = d / 2;
    var r = w / 2;

    // Grid
    ctx.beginPath();
    for (var i = 0; i <= 2; i++) {
        ctx.moveTo(x + w * i, y);
        ctx.lineTo(x + w * i, y + w * 2);

        ctx.moveTo(x, y + w * i);
        ctx.lineTo(x + w * 2, y + w * i);
    }
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Arrows
    for (i = 0; i < 4; i++) {
        var dx = i % 2;
        var dy = (i - dx) / 2;
        var cx = x + dx * w + r;
        var cy = y + dy * w + r;
        var v = this.m[i];

        ctx.beginPath();
        ctx.arc(cx, cy, Math.sqrt(v.norm2()) * r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "gray";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + v.r * r, cy - v.i * r);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
};

var maxBy = function (items, projection) {
    var hasBest = false;
    var bestValue = null;
    var bestWeight = null;
    for (var i in items) {
        var v = items[i];
        var w = projection(v);
        if (!hasBest || w > bestWeight) {
            hasBest = true;
            bestValue = v;
            bestWeight = w;
        }
    }
    return bestValue;
};

var squaredSum = function (items) {
    var total = 0;
    for (var i in items) {
        var v = items[i];
        total += v * v;
    }
    return total;
};

unitary_2x2.prototype.ubreakdown = function () {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var t = a.plus(d).dividedBy(new Complex(0, 2));
    var x = b.plus(c).dividedBy(new Complex(2, 0));
    var y = b.minus(c).dividedBy(new Complex(0, -2));
    var z = a.minus(d).dividedBy(new Complex(2, 0));

    var p = maxBy([t, x, y, z], function (e) {
        return e.norm2();
    }).unit();
    var pt = t.dividedBy(p);
    var px = x.dividedBy(p);
    var py = y.dividedBy(p);
    var pz = z.dividedBy(p);

    return [pt.r, px.r, py.r, pz.r, p];
};

var sin_scale_ratio = function (theta, factor) {
    // Near zero, switch to a Taylor series based approximation to avoid floating point error blowup.
    if (Math.abs(theta) < 0.0001) {
        var d = theta * theta / 6;
        return factor * (1 - d * factor * factor) / (1 - d);
    }
    return Math.sin(theta * factor) / Math.sin(theta);
};

var rotation_matrix = function (theta) {
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return new unitary_2x2([c, -s, s, c]);
};

var phase_cancel_matrix = function (p, q) {
    p = Complex.from(p);
    q = Complex.from(q);
    return new unitary_2x2([p.unit().conjugate(), 0, 0, q.unit().conjugate()]);
};

var singular_value_decomposition_real_2x2 = function (m) {
    var a = real(m.m[0]);
    var b = real(m.m[1]);
    var c = real(m.m[2]);
    var d = real(m.m[3]);

    var t = a + d;
    var x = b + c;
    var y = b - c;
    var z = a - d;

    var theta_0 = Math.atan2(x, t) / 2.0;
    var theta_d = Math.atan2(y, z) / 2.0;

    var s_0 = Math.sqrt(t * t + x * x) / 2.0;
    var s_d = Math.sqrt(z * z + y * y) / 2.0;

    return [
        rotation_matrix(theta_0 - theta_d),
        new unitary_2x2([s_0 + s_d, 0, 0, s_0 - s_d]),
        rotation_matrix(theta_0 + theta_d)];
};

unitary_2x2.prototype.svd = function () {
    var m = this;
    var p = phase_cancel_matrix(m.m[0], m.m[1]);
    var m2 = m.times(p);

    // Cancel top-right value by rotation.
    // m3 = m p r = | ?+?i  0    |
    //              | ?+?i  ?+?i |
    var r = rotation_matrix(Math.atan2(m2.m[1].r, m2.m[0].r));
    var m3 = m2.times(r);

    // Make bottom row non-imaginary and non-negative by column phasing.
    // m4 = m p r q = | ?+?i  0 |
    //                | >     > |
    var q = phase_cancel_matrix(m3.m[2], m3.m[3]);
    var m4 = m3.times(q);

    // Cancel imaginary part of top left value by row phasing.
    // m5 = t m p r q = | > 0 |
    //                  | > > |
    var t = phase_cancel_matrix(m4.m[0], 1);
    var m5 = t.times(m4);

    // All values are now real (also the top-right is zero), so delegate to a
    // singular value decomposition that works for real matrices.
    // t m p r q = u s v
    var usv = singular_value_decomposition_real_2x2(m5);

    // m = (t* u) s (v q* r* p*)
    return [t.adjoint().times(usv[0]),
        usv[1],
        usv[2].times(q.adjoint()).times(r.adjoint()).times(p.adjoint())];
};

unitary_2x2.prototype.repair_by_svd = function (syndrome_label) {
    var svd = this.svd();
    var u = svd[0];
    var s = svd[1];
    var v = svd[2];

    var s1 = real(s.m[0]);
    var s2 = real(s.m[3]);
    if (Math.abs(s1 - 1) < 0.03 && Math.abs(s2 - 1) < 0.03) {
        syndrome_label.html("");
    } else if (Math.abs(s1 - s2) < 0.01) {
        syndrome_label.html("(fixed by scaling)");
    } else {
        syndrome_label.html("(fixed by svd)");
    }

    return u.times(v);
};

unitary_2x2.prototype.ulerp = function (other, t) {
    var u1 = this;
    var u2 = other;
    var b1 = u1.ubreakdown();
    var b2 = u2.ubreakdown();

    var t1 = b1[0];
    var x1 = b1[1];
    var y1 = b1[2];
    var z1 = b1[3];
    var p1 = b1[4];

    var t2 = b2[0];
    var x2 = b2[1];
    var y2 = b2[2];
    var z2 = b2[3];
    var p2 = b2[4];

    var dot = t1 * t2 + x1 * x2 + y1 * y2 + z1 * z2;
    if (dot < -0.0000001) {
        p2 = p2.times(-1);
        dot *= -1;
    }
    if (dot > +1) {
        dot = 1;
    }
    var n1 = u1.scaledBy(p1.conjugate());
    var n2 = u2.scaledBy(p2.conjugate());
    var theta = Math.acos(dot);

    var c1 = sin_scale_ratio(theta, 1 - t);
    var c2 = sin_scale_ratio(theta, t);
    var n3 = n1.scaledBy(c1).plus(n2.scaledBy(c2));

    var phase_angle_1 = p1.phase();
    var phase_angle_2 = p2.phase();
    var phase_drift = (phase_angle_2 - phase_angle_1 + Math.PI) % (Math.PI * 2) - Math.PI;
    var phase_angle_3 = phase_angle_1 + phase_drift * t;
    var p3 = new Complex(Math.cos(phase_angle_3), Math.sin(phase_angle_3));
    return n3.scaledBy(p3);
};
