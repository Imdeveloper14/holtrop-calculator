function calculateWaveResistance(vessel) {

    const rho = 1025;

    const g = 9.81;

    const V = vessel.speed * 0.514444;

    const Fn = V / Math.sqrt(g * vessel.lwl);

    const Cp = vessel.cb / vessel.cm;

    const displacement = vessel.disp;

    /*
        Temporary engineering approximation.

        This will be replaced with the
        complete Holtrop & Mennen
        wave resistance equations.
    */

    const coefficient =

        0.004 *

        Math.pow(Fn,4) *

        Math.pow(Cp,1.5);

    const Rw =

        coefficient *

        rho *

        g *

        displacement;

    return {

        Cp,

        Fn,

        Rw

    };

}