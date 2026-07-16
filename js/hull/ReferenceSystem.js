export class ReferenceSystem {
  constructor(params, numStations = 41) {
    this.p = params;
    this.numStations = numStations;
    this.fp = params.lpp; // FP at X = LPP
    this.ap = 0;          // AP at X = 0
    this.midship = params.lpp / 2; // Midship at X = LPP / 2
    this.dwl = params.draft;
    this.stationX = [];
    this.generateStationSpacing();
  }

  generateStationSpacing() {
    this.stationX = [];
    for (let i = 0; i < this.numStations; i++) {
      const u = i / (this.numStations - 1);
      const x = u * this.p.lpp; // 0 at AP, LPP at FP
      this.stationX.push(x);
    }
  }

  getStationU(x) {
    return x / this.p.lpp;
  }
}
