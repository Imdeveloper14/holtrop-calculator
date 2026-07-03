function airResistance(vessel) {

    const rhoAir = 1.225;

    const V = vessel.speed * 0.514444;

    // Approximate frontal projected area
    const Af = vessel.beam * vessel.draft;

    const Cd = 0.8;

    const Ra =
        0.5 *
        rhoAir *
        Cd *
        Af *
        V * V;

    return {
        Af,
        Ra
    };

}