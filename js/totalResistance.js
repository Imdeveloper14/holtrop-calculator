function totalResistance(vessel, friction, viscousResistance, wave, appendageResistance, airResistance, correlationAllowance, bulbResistance, transomResistance) {

    const Rb = bulbResistance || 0;
    const Rtr = transomResistance || 0;
    const Rapp = appendageResistance || 0;
    const Ra = airResistance || 0;
    const RA = correlationAllowance || 0;

    const Rt =
        viscousResistance +
        wave.Rw +
        Rapp +
        Ra +
        RA +
        Rb +
        Rtr;

    const speedMS = vessel.speed * 0.514444;

    const effectivePower =
        Rt * speedMS;

    return {

        Rt,

        effectivePower,

        breakdown: {
            friction: friction.Rf,
            viscous: viscousResistance,
            wave: wave.Rw,
            bulb: Rb,
            transom: Rtr,
            appendage: Rapp,
            air: Ra,
            correlation: RA
        }

    };

}