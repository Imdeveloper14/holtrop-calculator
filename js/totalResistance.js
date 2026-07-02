function totalResistance(vessel, friction, viscousResistance, wave) {

    // Temporary values
    // These will later be replaced by
    // full Holtrop equations.

    const appendageResistance = 0;

    const airResistance = 0;

    const correlationAllowance = 0;

    const Rt =
        viscousResistance +
        wave.Rw +
        appendageResistance +
        airResistance +
        correlationAllowance;

    const speedMS = vessel.speed * 0.514444;

    const effectivePower =
        Rt * speedMS;

    return {

        appendageResistance,

        airResistance,

        correlationAllowance,

        Rt,

        effectivePower

    };

}