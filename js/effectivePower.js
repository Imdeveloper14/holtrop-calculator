//-----------------------------------------------------
// Effective Power Module
//-----------------------------------------------------

function effectivePower(vessel, Rt){

    const speedMS = vessel.speed * 0.514444;

    const PE = Rt * speedMS;

    return{

        speedMS,

        PE

    };

}