//-----------------------------------------------------
// Chart.js Formatting & Scaling Utilities
//-----------------------------------------------------

window.getDynamicScale = function(dataValues, paddingPct = 0.05) {
    if (!dataValues || dataValues.length === 0) {
        return { min: 0, max: 100, suggestedMax: 100 };
    }
    const filtered = dataValues.filter(v => typeof v === 'number' && !isNaN(v));
    if (filtered.length === 0) {
        return { min: 0, max: 100, suggestedMax: 100 };
    }
    const minVal = Math.min(...filtered);
    const maxVal = Math.max(...filtered);
    const range = maxVal - minVal;
    
    if (range === 0) {
        const p = Math.abs(minVal) * 0.1 || 10;
        return {
            min: Math.max(0, minVal - p),
            max: minVal + p,
            suggestedMax: minVal + p
        };
    }

    const pad = range * paddingPct;
    return {
        min: Math.max(0, minVal - pad),
        max: maxVal + pad,
        suggestedMax: maxVal + pad
    };
};

window.formatChartTicks = function(value, type) {
    if (type === 'resistance') {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " kN";
    }
    if (type === 'power') {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) + " kW";
    }
    if (type === 'fuel') {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " t/day";
    }
    if (type === 'cost') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    }
    if (type === 'emissions') {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " t";
    }
    return value;
};
