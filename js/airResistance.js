function airResistance(vessel) {

    const rhoAir = vessel.rhoAir !== undefined ? vessel.rhoAir : 1.225;
    const Av = vessel.av !== undefined ? vessel.av : (vessel.beam * vessel.draft);
    const Cd = vessel.cdAir !== undefined ? vessel.cdAir : 0.8;
    const windSpeedKnots = vessel.windSpeed !== undefined ? vessel.windSpeed : 0;
    const windDirDeg = vessel.windDir !== undefined ? vessel.windDir : 0;

    if (Av === 0) {
        return { Av, Ra: 0, Vrel: 0, thetaRel: 0 };
    }

    const Vs = vessel.speed * 0.514444;
    const Vw = windSpeedKnots * 0.514444;
    const thetaRad = windDirDeg * Math.PI / 180.0;

    const VrelX = Vs + Vw * Math.cos(thetaRad);
    const VrelY = Vw * Math.sin(thetaRad);

    const Vrel = Math.sqrt(VrelX * VrelX + VrelY * VrelY);
    const thetaRel = Math.atan2(VrelY, VrelX);

    const Ra = 0.5 * rhoAir * Cd * Av * Vrel * VrelX;

    return {
        Av,
        Ra,
        Vrel,
        thetaRel: thetaRel * 180.0 / Math.PI
    };

}