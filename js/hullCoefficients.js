function hullCoefficients(vessel) {

    const Cp = vessel.cb / vessel.cm;
    const LB = vessel.lwl / vessel.beam;
    const BT = vessel.beam / vessel.draft;
    const LT = vessel.lwl / vessel.draft;

    return {
        Cp,
        LB,
        BT,
        LT
    };
}