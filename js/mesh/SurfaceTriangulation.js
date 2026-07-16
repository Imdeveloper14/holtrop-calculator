export class SurfaceTriangulation {
  static triangulate(numLongitudinal, numDivisions) {
    const indices = [];
    
    // Triangulate quads on the lofted grid, keeping deck open
    for (let i = 0; i < numLongitudinal - 1; i++) {
      for (let j = 0; j < numDivisions - 1; j++) {
        const a = i * numDivisions + j;
        const b = a + numDivisions;
        
        // Quad triangles: (a, b, a+1) and (b, b+1, a+1)
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
    
    return indices;
  }
}
