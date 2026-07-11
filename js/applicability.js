//-----------------------------------------------------
// Holtrop & Mennen Applicability Check
//-----------------------------------------------------

function checkApplicability(vessel, friction) {
    const checks = [];

    const L = vessel.lwl;
    const B = vessel.beam;
    const T = vessel.draft;
    const Cb = vessel.cb;
    const Cm = vessel.cm;
    const Cwp = vessel.cwp;
    const Fn = friction.Fn;
    const Re = friction.Re;
    const Cp = Cb / Cm;

    const LB = L / B;
    const BT = B / T;
    const LT = L / T;

    // 1. Length-Breadth Ratio
    if (LB < 3.9 || LB > 15.0) {
        checks.push({
            name: "L/B Ratio",
            value: LB.toFixed(2),
            status: "WARNING",
            msg: "L/B ratio (" + LB.toFixed(2) + ") is outside standard Holtrop limits (3.9 - 15.0)."
        });
    } else {
        checks.push({
            name: "L/B Ratio",
            value: LB.toFixed(2),
            status: "PASS",
            msg: "L/B ratio is valid."
        });
    }

    // 2. Beam-Draft Ratio
    if (BT < 1.5 || BT > 5.0) {
        checks.push({
            name: "B/T Ratio",
            value: BT.toFixed(2),
            status: "WARNING",
            msg: "B/T ratio (" + BT.toFixed(2) + ") is outside standard Holtrop limits (1.5 - 5.0)."
        });
    } else {
        checks.push({
            name: "B/T Ratio",
            value: BT.toFixed(2),
            status: "PASS",
            msg: "B/T ratio is valid."
        });
    }

    // 3. Length-Draft Ratio
    if (LT < 10.0 || LT > 30.0) {
        checks.push({
            name: "L/T Ratio",
            value: LT.toFixed(2),
            status: "WARNING",
            msg: "L/T ratio (" + LT.toFixed(2) + ") is outside standard Holtrop limits (10.0 - 30.0)."
        });
    } else {
        checks.push({
            name: "L/T Ratio",
            value: LT.toFixed(2),
            status: "PASS",
            msg: "L/T ratio is valid."
        });
    }

    // 4. Block Coefficient
    if (Cb < 0.55 || Cb > 0.85) {
        checks.push({
            name: "Block Coefficient (Cb)",
            value: Cb.toFixed(3),
            status: "WARNING",
            msg: "Cb (" + Cb.toFixed(3) + ") is outside standard Holtrop limits (0.55 - 0.85)."
        });
    } else {
        checks.push({
            name: "Block Coefficient (Cb)",
            value: Cb.toFixed(3),
            status: "PASS",
            msg: "Block coefficient is valid."
        });
    }

    // 5. Prismatic Coefficient
    if (Cp < 0.55 || Cp > 0.85) {
        checks.push({
            name: "Prismatic Coefficient (Cp)",
            value: Cp.toFixed(3),
            status: "WARNING",
            msg: "Cp (" + Cp.toFixed(3) + ") is outside standard Holtrop limits (0.55 - 0.85)."
        });
    } else {
        checks.push({
            name: "Prismatic Coefficient (Cp)",
            value: Cp.toFixed(3),
            status: "PASS",
            msg: "Prismatic coefficient is valid."
        });
    }

    // 6. Midship Coefficient
    if (Cm < 0.90 || Cm > 0.99) {
        checks.push({
            name: "Midship Coefficient (Cm)",
            value: Cm.toFixed(3),
            status: "WARNING",
            msg: "Cm (" + Cm.toFixed(3) + ") is outside typical merchant limits (0.90 - 0.99)."
        });
    } else {
        checks.push({
            name: "Midship Coefficient (Cm)",
            value: Cm.toFixed(3),
            status: "PASS",
            msg: "Midship coefficient is valid."
        });
    }

    // 7. Waterplane Coefficient
    if (Cwp < 0.70 || Cwp > 0.95) {
        checks.push({
            name: "Waterplane Coefficient (Cwp)",
            value: Cwp.toFixed(3),
            status: "WARNING",
            msg: "Cwp (" + Cwp.toFixed(3) + ") is outside typical merchant limits (0.70 - 0.95)."
        });
    } else {
        checks.push({
            name: "Waterplane Coefficient (Cwp)",
            value: Cwp.toFixed(3),
            status: "PASS",
            msg: "Waterplane coefficient is valid."
        });
    }

    // 8. Froude Number
    if (Fn < 0.10) {
        checks.push({
            name: "Froude Number",
            value: Fn.toFixed(4),
            status: "WARNING",
            msg: "Froude number (" + Fn.toFixed(4) + ") is too low for standard wave resistance formulas (< 0.10)."
        });
    } else if (Fn > 0.45 && Fn <= 0.55) {
        checks.push({
            name: "Froude Number",
            value: Fn.toFixed(4),
            status: "WARNING",
            msg: "Froude number (" + Fn.toFixed(4) + ") is high and approaching limit of reliability (0.45 - 0.55)."
        });
    } else if (Fn > 0.55) {
        checks.push({
            name: "Froude Number",
            value: Fn.toFixed(4),
            status: "OUT OF RANGE",
            msg: "Froude number (" + Fn.toFixed(4) + ") is outside applicability limit (> 0.55)."
        });
    } else {
        checks.push({
            name: "Froude Number",
            value: Fn.toFixed(4),
            status: "PASS",
            msg: "Froude number is valid."
        });
    }

    // 9. Reynolds Number
    if (Re < 1e6) {
        checks.push({
            name: "Reynolds Number",
            value: Re.toExponential(3),
            status: "WARNING",
            msg: "Reynolds number (" + Re.toExponential(3) + ") is low (< 1e6). Holtrop is designed for full-scale flow conditions."
        });
    } else {
        checks.push({
            name: "Reynolds Number",
            value: Re.toExponential(3),
            status: "PASS",
            msg: "Reynolds number is valid."
        });
    }

    // 10. Speed
    if (vessel.speed <= 0) {
        checks.push({
            name: "Vessel Speed",
            value: vessel.speed.toFixed(1),
            status: "OUT OF RANGE",
            msg: "Speed must be greater than zero."
        });
    } else {
        checks.push({
            name: "Vessel Speed",
            value: vessel.speed.toFixed(1),
            status: "PASS",
            msg: "Speed is valid."
        });
    }

    // 11. Displacement
    if (vessel.disp <= 0) {
        checks.push({
            name: "Displacement",
            value: vessel.disp.toFixed(1),
            status: "OUT OF RANGE",
            msg: "Displacement volume must be greater than zero."
        });
    } else {
        checks.push({
            name: "Displacement",
            value: vessel.disp.toFixed(1),
            status: "PASS",
            msg: "Displacement is valid."
        });
    }

    return checks;
}
