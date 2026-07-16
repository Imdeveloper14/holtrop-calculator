import { BSpline } from './BSpline.js';

export class LoftSurface {
  constructor(stations) {
    this.stations = stations; // stations[i][j] where i is station index, j is division index
  }

  loft(numLongitudinal = 120) {
    const numStations = this.stations.length;
    if (numStations === 0) return [];
    
    const numDivisions = this.stations[0].length;
    const grid = [];
    
    // Fit a longitudinal B-spline through each division column to fair it longitudinally
    for (let j = 0; j < numDivisions; j++) {
      const longPoints = [];
      for (let i = 0; i < numStations; i++) {
        longPoints.push(this.stations[i][j]);
      }
      
      const spline = new BSpline(longPoints, 3);
      const fairedPoints = spline.getCurvePoints(numLongitudinal);
      grid.push(fairedPoints);
    }
    
    // Transpose grid to [numLongitudinal][numDivisions]
    const finalGrid = [];
    for (let i = 0; i < numLongitudinal; i++) {
      const row = [];
      for (let j = 0; j < numDivisions; j++) {
        row.push(grid[j][i]);
      }
      finalGrid.push(row);
    }
    
    return finalGrid;
  }
}
