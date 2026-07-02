//-----------------------------------------------------
// Holtrop & Mennen Form Factor
//-----------------------------------------------------

function formFactor(v){

    // Approximate Cp from Cb and Cm
    const Cp = v.cb / v.cm;

    // Approximate Lr (run length)
    const Lr =
        v.lwl *
        (
            1 -
            Cp +
            (0.06 * Cp * v.lcb) /
            (4 * Cp - 1)
        );

    // c12 coefficient
    let c12;

    const ratio = v.draft / v.lwl;

    if(ratio > 0.05){

        c12 =
            Math.pow(ratio,0.2228446);

    }else{

        c12 =
            48.20 *
            Math.pow(ratio - 0.02,2.078) +
            0.479948;

    }

    // Stern coefficient (Normal Stern)
    const c13 = 1.0;

    // Holtrop Form Factor
    const k1 =
        c13 *
        (
            0.93 +
            c12 *
            Math.pow(v.beam/Lr,0.92497) *
            Math.pow(0.95-Cp,-0.521448) *
            Math.pow(1-Cp+0.0225*v.lcb,0.6906)
        ) - 1;

    return{

        Cp,
        Lr,
        k1

    };

}