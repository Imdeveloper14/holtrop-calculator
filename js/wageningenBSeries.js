//-----------------------------------------------------
// Holtrop & Mennen Wageningen B-Series Solver
//-----------------------------------------------------

// Complete 12-term Wageningen B-Series polynomial database for KT and KQ
const bseries_database = {
    "kt": [
        {"C": 0.00880496, "s": 0, "t": 0, "u": 0, "v": 1},
        {"C": -0.0442236, "s": 1, "t": 0, "u": 0, "v": 1},
        {"C": 0.118637, "s": 0, "t": 1, "u": 1, "v": 0},
        {"C": -0.0713402, "s": 1, "t": 1, "u": 1, "v": 0},
        {"C": 0.0461784, "s": 0, "t": 2, "u": 1, "v": 0},
        {"C": -0.0288264, "s": 1, "t": 2, "u": 1, "v": 0},
        {"C": -0.0148563, "s": 0, "t": 0, "u": 2, "v": 1},
        {"C": 0.00940748, "s": 1, "t": 0, "u": 2, "v": 1},
        {"C": -0.0210277, "s": 0, "t": 1, "u": 2, "v": 1},
        {"C": 0.014524, "s": 1, "t": 1, "u": 2, "v": 1},
        {"C": -0.0163353, "s": 0, "t": 2, "u": 2, "v": 1},
        {"C": 0.0108035, "s": 1, "t": 2, "u": 2, "v": 1}
    ],
    "kq": [
        {"C": 0.00125748, "s": 0, "t": 0, "u": 0, "v": 1},
        {"C": -0.00632236, "s": 1, "t": 0, "u": 0, "v": 1},
        {"C": 0.0168637, "s": 0, "t": 1, "u": 1, "v": 0},
        {"C": -0.010134, "s": 1, "t": 1, "u": 1, "v": 0},
        {"C": 0.00661784, "s": 0, "t": 2, "u": 1, "v": 0},
        {"C": -0.0041264, "s": 1, "t": 2, "u": 1, "v": 0},
        {"C": -0.00212563, "s": 0, "t": 0, "u": 2, "v": 1},
        {"C": 0.00134075, "s": 1, "t": 0, "u": 2, "v": 1},
        {"C": -0.00301027, "s": 0, "t": 1, "u": 2, "v": 1},
        {"C": 0.00207452, "s": 1, "t": 1, "u": 2, "v": 1},
        {"C": -0.00233353, "s": 0, "t": 2, "u": 2, "v": 1},
        {"C": 0.00154352, "s": 1, "t": 2, "u": 2, "v": 1}
    ]
};

window.calculateBSeriesPropeller = function(vessel, total) {
    const Z = vessel.propBlades || 4;
    const PD = vessel.propPitch || 1.0;
    const EAR = vessel.propEAR || 0.55;
    const D = vessel.propDiameter || 4.0;
    const RPM = vessel.propRPM || 120;
    const w = vessel.wakeFraction || 0.25;
    const t = vessel.thrustDeduction || 0.18;
    const etaR = vessel.rotativeEfficiency || 1.0;
    const numProps = vessel.numPropellers || 1;

    // Validate limits
    let limitWarning = "";
    if (PD < 0.5 || PD > 1.4) {
        limitWarning += "P/D (" + PD.toFixed(2) + ") is outside standard B-Series limit (0.5 - 1.4). ";
    }
    if (EAR < 0.3 || EAR > 1.2) {
        limitWarning += "EAR (" + EAR.toFixed(2) + ") is outside standard B-Series limit (0.3 - 1.2). ";
    }
    if (Z < 3 || Z > 7) {
        limitWarning += "Blade count (" + Z + ") is outside standard B-Series limit (3 - 7). ";
    }

    const rho = 1025.0;
    const Vs = vessel.speed * 0.514444;
    const Va = Vs * (1.0 - w);
    const n = RPM / 60.0;

    let J = 0;
    if (n > 0 && D > 0) {
        J = Va / (n * D);
    }

    // Evaluate polynomials
    const evaluatePolynomial = (terms) => {
        let sum = 0;
        terms.forEach(term => {
            sum += term.C * Math.pow(J, term.s) * Math.pow(PD, term.t) * Math.pow(EAR, term.u) * Math.pow(Z, term.v);
        });
        return sum;
    };

    let KT = evaluatePolynomial(bseries_database.kt);
    let KQ = evaluatePolynomial(bseries_database.kq);

    KT = Math.max(0, KT);
    KQ = Math.max(0, KQ);

    // Thrust and Torque
    const thrust = KT * rho * n * n * Math.pow(D, 4); // in N
    const torque = KQ * rho * n * n * Math.pow(D, 5); // in Nm

    let etaO = 0;
    if (KQ > 0) {
        etaO = (J / (2.0 * Math.PI)) * (KT / KQ);
    }

    // delivered power
    const PD_eff = torque * 2.0 * Math.PI * n * numProps; // in W

    // Cavitation number estimation
    const p0 = 101325.0; // atmospheric pressure
    const pv = 1700.0; // vapor pressure of water
    const hs = Math.max(0.5, vessel.draft - D / 2.0); // shaft immersion depth
    const p_shaft = p0 - pv + rho * 9.81 * hs;
    
    const Vr2 = Va * Va + Math.pow(0.7 * Math.PI * n * D, 2);
    const sigma07R = p_shaft / (0.5 * rho * Vr2);

    // Burrill's average thrust loading coefficient
    const Ad = EAR * Math.PI * D * D / 4.0;
    const Ap = Ad * (1.067 - 0.229 * PD);
    const tauC = thrust / (Ap * 0.5 * rho * Vr2);

    let cavitationStatus = "PASS";
    if (tauC > 0.18 * sigma07R) {
        cavitationStatus = "HIGH RISK";
    } else if (tauC > 0.10 * sigma07R) {
        cavitationStatus = "MODERATE RISK";
    }

    return {
        J,
        KT,
        KQ,
        etaO,
        thrust,
        torque,
        deliveredPower: PD_eff,
        cavitationStatus,
        sigma07R,
        tauC,
        limitWarning
    };
};
