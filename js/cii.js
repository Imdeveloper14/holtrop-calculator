//-----------------------------------------------------
// IMO CII Module
//-----------------------------------------------------

window.calculateCII = function(vessel, inputs) {
    const fuelCons = inputs.annualFuel || 3000; // tons
    const distSailed = inputs.annualDist || 30000; // nm
    const dwt = inputs.dwt || 10000;
    const gt = inputs.gt || 8000;
    const fuelType = inputs.fuelType || "MDO";
    const CF = (fuelType === "HFO") ? 3.114 : 3.206;
    const shipType = inputs.shipType || "Bulk Carrier";

    const capacity = (shipType === "Passenger Ship") ? gt : dwt;

    // Attained CII (g CO2 / DWT-nm or GT-nm)
    let attained = 0;
    if (capacity > 0 && distSailed > 0) {
        attained = (fuelCons * CF * 1e6) / (capacity * distSailed);
    }

    // Required CII for year 2026 (assuming reduction factor Z = 11%)
    let a = 14227;
    let c = 0.642;
    if (shipType === "Bulk Carrier") {
        a = 14227; c = 0.642;
    } else if (shipType === "Tanker") {
        a = 5247; c = 0.53;
    } else if (shipType === "Containership") {
        a = 1888; c = 0.38;
    } else {
        a = 3000; c = 0.40;
    }
    const required = a * Math.pow(capacity, -c) * (1.0 - 0.11);

    // CII Rating boundaries based on ratio Attained/Required
    const ratio = attained / required;
    let rating = "C";
    let color = "#fdd835"; // Yellow

    if (ratio <= 0.83) {
        rating = "A";
        color = "#2e7d32"; // Green
    } else if (ratio <= 0.94) {
        rating = "B";
        color = "#4caf50"; // Light Green
    } else if (ratio <= 1.06) {
        rating = "C";
        color = "#fdd835"; // Yellow
    } else if (ratio <= 1.19) {
        rating = "D";
        color = "#ff9800"; // Orange
    } else {
        rating = "E";
        color = "#f44336"; // Red
    }

    return {
        attained,
        required,
        rating,
        color,
        ratio
    };
};
