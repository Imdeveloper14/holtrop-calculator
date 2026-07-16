export class ConstraintValidator {
  /**
   * Validates ship particulars and prevents invalid combinations.
   * @param {Object} vessel 
   * @returns {Object} { valid: boolean, reason?: string }
   */
  static validate(vessel) {
    const { lwl, beam, draft, cb, cm, cwp } = vessel;

    if (lwl <= 0) return { valid: false, reason: "LWL must be greater than 0." };
    if (beam <= 0) return { valid: false, reason: "Beam must be greater than 0." };
    if (draft <= 0) return { valid: false, reason: "Draft must be greater than 0." };
    if (cb < 0.1 || cb > 1.0) return { valid: false, reason: "Cb must be between 0.1 and 1.0." };
    if (cm < 0.1 || cm > 1.0) return { valid: false, reason: "Cm must be between 0.1 and 1.0." };
    if (cwp < 0.1 || cwp > 1.0) return { valid: false, reason: "Cwp must be between 0.1 and 1.0." };

    // Prevent draft exceeding beam
    if (draft >= beam) {
      return { valid: false, reason: "Draft cannot exceed or equal Beam (T >= B)." };
    }

    // Prismatic coefficient Cp must be <= 1.0
    const cp = cb / cm;
    if (cp > 1.0) {
      return { valid: false, reason: "Invalid coefficient combination: Cp (Cb/Cm) exceeds 1.0." };
    }

    // Displacement volume must be positive
    const disp = lwl * beam * draft * cb;
    if (disp <= 0) {
      return { valid: false, reason: "Displacement volume must be greater than 0." };
    }

    return { valid: true };
  }
}
