function holtropCoefficients(vessel){

    const LB = vessel.lwl / vessel.beam;

    let c7;

    if (LB < 5)
        c7 = 0.229577 * Math.pow(LB, 1/3);
    else if (LB <= 12)
        c7 = LB;
    else
        c7 = 0.5 - 0.0625 * LB;

    return { c7 };

}