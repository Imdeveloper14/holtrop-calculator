function appendageResistance(vessel, Cf, appendagesList) {

    const list = appendagesList || [];

    if (list.length === 0) {
        return {
            appendageArea: 0,
            Rapp: 0
        };
    }

    const rho = 1025.0;
    const V = vessel.speed * 0.514444;

    let sumS_k2 = 0;
    let totalArea = 0;

    list.forEach(app => {
        const area = Number(app.area) || 0;
        const k2_factor = Number(app.k2) || 1.0;
        sumS_k2 += area * k2_factor;
        totalArea += area;
    });

    const Rapp = 0.5 * rho * V * V * sumS_k2 * Cf;

    return {

        appendageArea: totalArea,

        Rapp

    };

}