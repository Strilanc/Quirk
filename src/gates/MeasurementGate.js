import Config from "src/Config.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"

let MeasurementGate = Gate.fromIdentity(
    "Measure",
    "Measurement Gate",
    "Measures a wire's qubit along the Z axis.").
    withCustomDrawer(args => {
        let backColor = Config.GATE_FILL_COLOR;
        if (args.isHighlighted) {
            backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
        }
        args.painter.fillRect(args.rect, backColor);
        GatePainting.paintOutline(args);

        const τ = Math.PI * 2;
        let r = args.rect.w*0.4;
        let {x, y} = args.rect.center();
        y += r*0.6;
        let a = -τ/6;
        let [c, s] = [Math.cos(a)*r*1.5, Math.sin(a)*r*1.5];
        let [p, q] = [x + c, y + s];

        // Draw the dial and shaft.
        args.painter.trace(trace => {
            trace.ctx.arc(x, y, r, τ/2, τ);
            trace.line(x, y, p, q);
        }).thenStroke('black');
        // Draw the indicator head.
        args.painter.trace(trace => trace.arrowHead(p, q, r*0.3, a, τ/4)).thenFill('black');
    });
export default MeasurementGate;
