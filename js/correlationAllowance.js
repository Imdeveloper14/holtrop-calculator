function correlationAllowance(vessel, S) {

    const rho = 1025;

    const V = vessel.speed * 0.514444;

    /*
        Temporary CA value.
        Will later be replaced by
        Holtrop's correlation allowance equation.
    */

    const CA = 0.0004;

    const RA =

        0.5 *
        rho *
        V * V *
        S *
        CA;

    return {

        CA,

        RA

    };

}