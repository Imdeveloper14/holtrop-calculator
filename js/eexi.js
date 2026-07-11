//-----------------------------------------------------
// IMO EEXI Module
//-----------------------------------------------------

window.calculateEEXI = function(vessel, inputs) {
    const pME = inputs.mcr || 5000;
    const pAE = inputs.pAE || 500;
    const sfocME = inputs.sfoc || 190;
    const sfocAE = 220; // Default aux SFOC
    const fuelType = inputs.fuelType || "MDO";
    const CF = (fuelType === "HFO") ? 3.114 : 3.206;
    const dwt = inputs.dwt || 10000;
    const vref = inputs.vref || 14.0;
    const shipType = inputs.shipType || "Bulk Carrier";

    // Attained EEXI (g CO2 / ton-nm)
    let attained = 0;
    if (dwt > 0 && vref > 0) {
        attained = ((0.75 * pME * sfocME + pAE * sfocAE) * CF) / (dwt * vref);
    }

    // Required EEXI estimation
    let reqRef = 0;
    let reduction = 0.20; // 20% reduction
    if (shipType === "Bulk Carrier") {
        reqRef = 961.79 * Math.pow(dwt, -0.477);
    } else if (shipType === "Tanker") {
        reqRef = 1214.2 * Math.pow(dwt, -0.496);
    } else { // Containership / Passenger
        reqRef = 174.22 * Math.pow(dwt, -0.201);
    }
    const required = reqRef * (1.0 - reduction);
    const passed = attained <= required;

    return {
        attained,
        required,
        passed
    };
};
