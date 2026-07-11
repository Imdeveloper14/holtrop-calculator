//-----------------------------------------------------
// Holtrop & Mennen c15 Coefficient
//-----------------------------------------------------

function holtropC15(vessel) {
    const lwl3_disp = Math.pow(vessel.lwl, 3) / vessel.disp;
    const disp_1_3 = Math.pow(vessel.disp, 1/3);
    const lwl_disp_1_3 = vessel.lwl / disp_1_3;
    let c15;

    if (lwl3_disp < 512) {
        c15 = -1.69385;
    } else if (lwl3_disp <= 1726.91) {
        c15 = -1.69385 + (lwl_disp_1_3 - 8.0) / 2.36;
    } else {
        c15 = 0.0;
    }

    return { c15 };
}
