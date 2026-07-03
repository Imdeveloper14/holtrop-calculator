//-----------------------------------------------------
// Propulsion Module
//-----------------------------------------------------

function propulsion(power) {

    // Default efficiencies
    const wakeFraction = 0.20;
    const thrustDeduction = 0.15;

    const hullEfficiency =
        (1 - thrustDeduction) /
        (1 - wakeFraction);

    const propellerEfficiency = 0.65;

    const relativeRotativeEfficiency = 1.00;

    const transmissionEfficiency = 0.98;

    const deliveredPower =

        power.PE /

        (
            hullEfficiency *
            propellerEfficiency *
            relativeRotativeEfficiency *
            transmissionEfficiency
        );

    const brakePower =

        deliveredPower /
        transmissionEfficiency;

    return{

        wakeFraction,

        thrustDeduction,

        hullEfficiency,

        propellerEfficiency,

        relativeRotativeEfficiency,

        transmissionEfficiency,

        deliveredPower,

        brakePower

    };

}