//-----------------------------------------------------
// Holtrop & Mennen Wetted Surface Area
//-----------------------------------------------------

function wettedSurface(v) {

    const S =
        v.lwl *
        (
            2 * v.draft +
            v.beam
        ) *
        Math.sqrt(v.cm) *
        (
            0.453 +
            0.4425 * v.cb -
            0.2862 * v.cm -
            0.003467 * (v.beam / v.draft) +
            0.3696 * v.cwp
        );

    return S;

}