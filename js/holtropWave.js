function holtropWaveResistance(vessel) {

    const rho = 1025;
    const g = 9.81;

    const V = vessel.speed * 0.514444;

    const Fn =
        V /
        Math.sqrt(g * vessel.lwl);

    return {

        Fn,

        Rw: 0

    };

}