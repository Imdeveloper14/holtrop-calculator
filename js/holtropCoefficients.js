function holtropCoefficients(vessel){

    const BL = vessel.beam / vessel.lwl;
    const LB = vessel.lwl / vessel.beam;

    let c7;

    if (BL < 0.11)
        c7 = 0.229577 * Math.pow(BL, 1/3);
    else if (BL <= 0.25)
        c7 = BL;
    else
        c7 = 0.5 - 0.0625 * LB;

    return { c7 };

}