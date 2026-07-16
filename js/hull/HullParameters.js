export class HullParameters {
  constructor(data) {
    this.lpp = data.lpp || 100;
    this.lwl = data.lwl || 102;
    this.beam = data.beam || 18;
    this.draft = data.draft || 5.5;
    this.cb = data.cb || 0.70;
    this.cm = data.cm || 0.98;
    this.cwp = data.cwp || 0.80;
    this.lcb = data.lcb || 0;
    this.abt = data.abt || 0;
    this.hb = data.hb || 0;
    this.at = data.at || 0;
    this.validate();
  }

  validate() {
    if (this.lpp <= 0) throw new Error("LPP must be greater than 0.");
    if (this.beam <= 0) throw new Error("Beam must be greater than 0.");
    if (this.draft <= 0) throw new Error("Draft must be greater than 0.");
    if (this.cb < 0.1 || this.cb > 1.0) throw new Error("Block Coefficient (Cb) must be between 0.1 and 1.0.");
    if (this.cm < 0.1 || this.cm > 1.0) throw new Error("Midship Coefficient (Cm) must be between 0.1 and 1.0.");
    if (this.cwp < 0.1 || this.cwp > 1.0) throw new Error("Waterplane Coefficient (Cwp) must be between 0.1 and 1.0.");
  }
}
