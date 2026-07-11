//-----------------------------------------------------
// Parametric Study Grid Generator
//-----------------------------------------------------

window.generateHullVariants = function(inputs) {
    const variants = [];
    const maxCases = inputs.maxCases || 500;

    // linspace helper
    const linspace = (start, end, steps) => {
        if (steps <= 1) return [start];
        const arr = [];
        const step = (end - start) / (steps - 1);
        for (let i = 0; i < steps; i++) {
            arr.push(start + i * step);
        }
        return arr;
    };

    const lwlVals = linspace(inputs.minLwl, inputs.maxLwl, inputs.steps || 3);
    const beamVals = linspace(inputs.minBeam, inputs.maxBeam, inputs.steps || 3);
    const draftVals = linspace(inputs.minDraft, inputs.maxDraft, inputs.steps || 3);
    const cbVals = linspace(inputs.minCb, inputs.maxCb, inputs.steps || 3);

    for (let l of lwlVals) {
        for (let b of beamVals) {
            for (let t of draftVals) {
                for (let cb of cbVals) {
                    if (variants.length >= maxCases) break;
                    // Approximate displacement
                    const disp = l * b * t * cb;
                    variants.push({
                        lwl: l,
                        beam: b,
                        draft: t,
                        cb: cb,
                        cm: inputs.baseCm,
                        cwp: inputs.baseCwp,
                        lpp: l * 0.98,
                        lcb: inputs.baseLcb,
                        abt: inputs.baseAbt,
                        hb: inputs.baseHb,
                        at: inputs.baseAt,
                        disp: disp,
                        speed: inputs.baseSpeed
                    });
                }
            }
        }
    }
    return variants;
};
