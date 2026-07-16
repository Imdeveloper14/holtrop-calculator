import { ConstraintValidator } from './ConstraintValidator.js';
import { ObjectiveFunctions } from './ObjectiveFunctions.js';

export class OptimizationEngine {
  /**
   * Orchestrates the async optimization process.
   * @param {Object} options 
   */
  constructor(options) {
    this.options = options;
    this.cancelled = false;
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
  }

  cancel() {
    this.cancelled = true;
  }

  /**
   * Helper to run Holtrop & Mennen calculations on a design configuration.
   */
  evaluateVessel(v, baseInputs) {
    // Ensure displacement is computed
    v.disp = v.lwl * v.beam * v.draft * v.cb;
    v.lpp = v.lwl * 0.98; // LPP approximation

    const S = window.wettedSurface(v);
    const coeff = window.hullCoefficients(v);
    const hc = window.holtropCoefficients(v);
    const c16 = window.holtropC16(v);
    const c15 = window.holtropC15(v);
    const friction = window.frictionResistance(S, v.lwl, v.speed);
    const ff = window.formFactor(v);
    const viscousResistance = friction.Rf * (1 + ff.k1);

    const Cp_wave = v.cb / v.cm;
    const Lr_wave = v.lwl * (1 - Cp_wave + (0.06 * Cp_wave * v.lcb) / (4 * Cp_wave - 1));
    const ie_exponent = 
      -Math.pow(v.lwl / v.beam, 0.80856) *
      Math.pow(1 - v.cwp, 0.30484) *
      Math.pow(Math.max(0, 1 - Cp_wave - 0.0225 * v.lcb), 0.6367) *
      Math.pow((v.lwl - Lr_wave) / v.beam, 0.34574) *
      Math.pow(100 * v.disp / Math.pow(v.lwl, 3), 0.16302);
    const ie = 1 + 89 * Math.exp(ie_exponent);

    const c1 = 2223105 * Math.pow(hc.c7, 3.78613) * Math.pow(v.draft / v.beam, 1.07961) * Math.pow(Math.max(1.0, 90 - ie), -1.37565);
    const c2 = 1.0;
    const c5 = 1.0;

    const m1 = 0.0140407 * (v.lwl / v.draft) - 1.75254 * (Math.pow(v.disp, 1/3) / v.lwl) - 4.79323 * (v.beam / v.lwl) - c16.c16;
    const m2 = c15.c15 * Cp_wave * Cp_wave * Math.exp(-0.1 / (friction.Fn * friction.Fn || 1.0));
    const lambda = (v.lwl / v.beam < 12) ? (1.446 * Cp_wave - 0.03 * (v.lwl / v.beam)) : (1.446 * Cp_wave - 0.36);

    const appendages = window.appendagesList || [];
    const wave = window.holtropWaveResistance(v, c1, c2, c5, c15.c15, c16.c16, m1, m2, lambda);
    const air = window.airResistance(v);
    const appendage = window.appendageResistance(v, friction.Cf, appendages);
    const correlation = window.correlationAllowance(v, S);
    const bulb = window.bulbResistance(v);
    const transom = window.transomResistance(v);

    // Apply potential wetted area scale for appendage area optimization
    let RappVal = appendage.Rapp;
    if (v.appendageArea !== undefined && appendage.Rapp > 0) {
      // Scale resistance based on area ratio
      const baseArea = appendages.reduce((acc, app) => acc + app.area, 0) || 1;
      RappVal = appendage.Rapp * (v.appendageArea / baseArea);
    }

    const total = window.totalResistance(v, friction, viscousResistance, wave, RappVal, air.Ra, correlation.RA, bulb.Rb, transom.Rtr);
    const power = window.effectivePower(v, total.Rt);
    const propulsionData = window.propulsion(power);
    const pb_kW = propulsionData.brakePower / 1000;

    const engineInputs = baseInputs.engineInputs;
    const eng = window.calculateEngineSelection(pb_kW, v.speed, engineInputs);
    const emissions = window.calculateEmissions(eng.fc_kgh, engineInputs.fuelType);

    const voyageCost = eng.voyageFuel * engineInputs.fuelPrice;

    return {
      lwl: v.lwl,
      beam: v.beam,
      draft: v.draft,
      cb: v.cb,
      cm: v.cm,
      cwp: v.cwp,
      lcb: v.lcb,
      abt: v.abt,
      at: v.at,
      appendageArea: v.appendageArea !== undefined ? v.appendageArea : 0,
      disp: v.disp,
      speed: v.speed,
      Rt: total.Rt,
      PE: power.PE,
      PD: propulsionData.deliveredPower,
      fuelDay: eng.fc_day,
      co2: emissions.co2,
      voyageCost: voyageCost,
      pb: propulsionData.brakePower,
      fc_kgh: eng.fc_kgh,
      co2_kgh: eng.co2_kgh
    };
  }

  /**
   * Executes coordinate-descent algorithm iteratively in chunks.
   */
  start() {
    this.cancelled = false;
    const { baseVessel, variables, constraints, objectiveId, engineInputs } = this.options;
    
    // Validate baseline design first
    const baseValid = ConstraintValidator.validate(baseVessel);
    if (!baseValid.valid) {
      this.onError(`Baseline Design Error: ${baseValid.reason}`);
      return;
    }

    let baselineEval;
    try {
      baselineEval = this.evaluateVessel(baseVessel, { engineInputs });
    } catch (e) {
      this.onError(`Baseline Evaluation Error: ${e.message}`);
      return;
    }

    // Determine optimization bounds and enabled variables
    const activeVars = [];
    const ranges = {};

    if (variables.cb) activeVars.push({ field: 'cb', min: constraints.minCb, max: constraints.maxCb });
    if (variables.beam) activeVars.push({ field: 'beam', min: constraints.minBeam, max: constraints.maxBeam });
    if (variables.draft) activeVars.push({ field: 'draft', min: constraints.minDraft, max: constraints.maxDraft });
    if (variables.lcb) activeVars.push({ field: 'lcb', min: constraints.minLcb, max: constraints.maxLcb });
    if (variables.abt) activeVars.push({ field: 'abt', min: constraints.minAbt, max: constraints.maxAbt });
    if (variables.at) activeVars.push({ field: 'at', min: constraints.minAt, max: constraints.maxAt });
    if (variables.appendageArea) activeVars.push({ field: 'appendageArea', min: constraints.minAppendageArea, max: constraints.maxAppendageArea });

    if (activeVars.length === 0) {
      this.onError("Please select at least one variable to optimize.");
      return;
    }

    // Parameters for local search
    const maxStepsPerVariable = this.options.steps || 5;
    const numCycles = 3; // Number of coordinate descent cycles
    const totalIterations = numCycles * activeVars.length * maxStepsPerVariable;
    
    let currentVessel = { ...baseVessel };
    let currentBestEval = baselineEval;
    let currentBestScore = ObjectiveFunctions.evaluate(objectiveId, baselineEval);

    let currentCycle = 0;
    let currentVarIdx = 0;
    let currentStep = 0;
    let completedIterations = 0;
    let bestHistory = [baselineEval];
    
    const startTime = performance.now();

    const processNext = () => {
      if (this.cancelled) {
        this.onProgress(100, completedIterations, totalIterations, 0, currentBestEval);
        return;
      }

      const activeVar = activeVars[currentVarIdx];
      const field = activeVar.field;
      const stepVal = (activeVar.max - activeVar.min) / (maxStepsPerVariable - 1);
      
      const candidateVal = activeVar.min + currentStep * stepVal;
      const candidateVessel = { ...currentVessel, [field]: candidateVal };

      const validation = ConstraintValidator.validate(candidateVessel);
      if (validation.valid) {
        try {
          const candidateEval = this.evaluateVessel(candidateVessel, { engineInputs });
          const score = ObjectiveFunctions.evaluate(objectiveId, candidateEval);

          if (score < currentBestScore && Number.isFinite(score)) {
            currentBestScore = score;
            currentBestEval = candidateEval;
            currentVessel[field] = candidateVal; // Update local coordinate
            bestHistory.push(candidateEval);
          }
        } catch (e) {
          // Gracefully skip failed candidate points
        }
      }

      completedIterations++;
      currentStep++;

      if (currentStep >= maxStepsPerVariable) {
        currentStep = 0;
        currentVarIdx++;
      }

      if (currentVarIdx >= activeVars.length) {
        currentVarIdx = 0;
        currentCycle++;
      }

      const progress = Math.min(100, (completedIterations / totalIterations) * 100);
      const elapsed = (performance.now() - startTime) / 1000; // seconds
      const estTimeRemaining = progress > 0 ? (elapsed / progress) * (100 - progress) : 0;

      this.onProgress(progress, completedIterations, totalIterations, estTimeRemaining, currentBestEval);

      if (currentCycle < numCycles && completedIterations < totalIterations) {
        setTimeout(processNext, 5);
      } else {
        this.onComplete(baselineEval, currentBestEval, bestHistory);
      }
    };

    setTimeout(processNext, 5);
  }
}
