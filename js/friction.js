// -----------------------------------------------------
// ITTC-1957 Friction Resistance Module
// -----------------------------------------------------

const WATER_DENSITY = 1025.0;      // kg/m³
const KINEMATIC_VISCOSITY = 1.19e-6; // m²/s

function knotsToMs(knots) {
    return knots * 0.514444;
}

function reynoldsNumber(LWL, speedKnots) {

    const V = knotsToMs(speedKnots);

    return (V * LWL) / KINEMATIC_VISCOSITY;

}

function froudeNumber(LWL, speedKnots){

    const V = knotsToMs(speedKnots);

    return V / Math.sqrt(9.81 * LWL);

}

function frictionCoefficient(Re){

    return 0.075 /
        Math.pow(Math.log10(Re)-2,2);

}

function frictionResistance(S, LWL, speedKnots){

    const V = knotsToMs(speedKnots);

    const Re = reynoldsNumber(LWL, speedKnots);

    const Fn = froudeNumber(LWL, speedKnots);

    const Cf = frictionCoefficient(Re);

    const Rf =
        0.5 *
        WATER_DENSITY *
        V *
        V *
        S *
        Cf;

    return{

        Re,
        Fn,
        Cf,
        Rf

    };

}