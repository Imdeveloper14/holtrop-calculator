const T = window.THREE;

export class SurfaceIntersection {
  constructor(grid) {
    this.grid = grid; // grid[i][j] where i is longitudinal, j is transverse
    this.numLong = grid.length;
    this.numDiv = grid[0].length;
  }

  getWaterline(zHeight) {
    const ptsStarboard = [];
    const ptsPort = [];
    
    for (let i = 0; i < this.numLong; i++) {
      // Port side is j in [0, 40], Starboard side is j in [40, 80]
      // Search for zHeight crossing
      let yPort = 0;
      let yStarboard = 0;
      const x = this.grid[i][0].x;
      
      // Starboard side search
      for (let j = 40; j < this.numDiv - 1; j++) {
        const p1 = this.grid[i][j];
        const p2 = this.grid[i][j + 1];
        if ((p1.z <= zHeight && p2.z >= zHeight) || (p1.z >= zHeight && p2.z <= zHeight)) {
          const denom = p2.z - p1.z;
          const t = denom !== 0 ? (zHeight - p1.z) / denom : 0.5;
          yStarboard = p1.y + t * (p2.y - p1.y);
          break;
        }
      }
      
      // Port side is mirror of starboard
      yPort = -yStarboard;
      
      ptsStarboard.push(new T.Vector3(x, yStarboard, zHeight));
      ptsPort.push(new T.Vector3(x, yPort, zHeight));
    }
    
    // Combine Port and Starboard to form the open loops
    return ptsPort.reverse().concat(ptsStarboard);
  }

  getButtock(yOffset) {
    const pts = [];
    for (let i = 0; i < this.numLong; i++) {
      const x = this.grid[i][0].x;
      let z = 0;
      
      // Search for yOffset crossing on the starboard half-section
      for (let j = 40; j < this.numDiv - 1; j++) {
        const p1 = this.grid[i][j];
        const p2 = this.grid[i][j + 1];
        const target = Math.abs(yOffset);
        
        if ((p1.y <= target && p2.y >= target) || (p1.y >= target && p2.y <= target)) {
          const denom = p2.y - p1.y;
          const t = denom !== 0 ? (target - p1.y) / denom : 0.5;
          z = p1.z + t * (p2.z - p1.z);
          break;
        }
      }
      pts.push(new T.Vector3(x, yOffset, z));
    }
    return pts;
  }

  getStation(xTarget) {
    // Find stations that span xTarget
    let idx = -1;
    for (let i = 0; i < this.numLong - 1; i++) {
      if ((this.grid[i][0].x <= xTarget && this.grid[i + 1][0].x >= xTarget) ||
          (this.grid[i][0].x >= xTarget && this.grid[i + 1][0].x <= xTarget)) {
        idx = i;
        break;
      }
    }
    
    if (idx === -1) {
      // Out of bounds fallback: return first or last station
      return xTarget < 0 ? this.grid[0] : this.grid[this.numLong - 1];
    }
    
    const pts = [];
    const p1Row = this.grid[idx];
    const p2Row = this.grid[idx + 1];
    const denom = p2Row[0].x - p1Row[0].x;
    const t = denom !== 0 ? (xTarget - p1Row[0].x) / denom : 0.5;
    
    for (let j = 0; j < this.numDiv; j++) {
      const p1 = p1Row[j];
      const p2 = p2Row[j];
      pts.push(new T.Vector3(
        xTarget,
        p1.y + t * (p2.y - p1.y),
        p1.z + t * (p2.z - p1.z)
      ));
    }
    return pts;
  }

  getDiagonal(angleRatio) {
    const pts = [];
    for (let i = 0; i < this.numLong; i++) {
      // Find point along the diagonal vector (Y_max * angleRatio, Z_max * (1-angleRatio))
      const x = this.grid[i][0].x;
      const ySheer = this.grid[i][this.numDiv - 1].y;
      const zSheer = this.grid[i][this.numDiv - 1].z;
      
      const targetY = ySheer * angleRatio;
      const targetZ = zSheer * (1 - angleRatio);
      
      pts.push(new T.Vector3(x, targetY, targetZ));
    }
    return pts;
  }
}
