//-----------------------------------------------------
// Weather Correction & Speed Over Ground (SOG) Module
//-----------------------------------------------------

window.calculateWeatherCorrection = function(vessel, inputs) {
    const windSpeed = inputs.windSpeed || 0;
    const windDir = inputs.windDir || 0; // Relative to bow
    const currentSpeed = inputs.currentSpeed || 0; // knots
    const currentDir = inputs.currentDir || 0; // Relative to course (180 is head current)
    const airTemp = inputs.airTemp || 15.0;
    const waterTemp = inputs.waterTemp || 15.0;

    // SOG calculation
    const currentRad = (currentDir * Math.PI) / 180.0;
    // Positive current is following (0° is following current, 180° is head current)
    const currentEffect = currentSpeed * Math.cos(currentRad);
    const SOG = Math.max(1.0, inputs.speed + currentEffect);

    // Weather added air density factor
    let airDensity = 1.225;
    if (airTemp > -50 && airTemp < 100) {
        airDensity = 353.05 / (airTemp + 273.15); // Ideal gas law density approximation
    }

    return {
        SOG,
        currentEffect,
        airDensity
    };
};
