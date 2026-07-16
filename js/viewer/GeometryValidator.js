export class GeometryValidator {
  /**
   * Validates Three.js BufferGeometry properties.
   * @param {THREE.BufferGeometry} geometry 
   * @returns {Object} Statistics about the geometry if valid.
   * @throws {Error} If geometry details are invalid.
   */
  static validate(geometry) {
    if (!geometry) {
      throw new Error("Hull geometry generation failed. Geometry object is null or undefined.");
    }

    // Compute bounds and normals
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    const positions = geometry.getAttribute('position');
    if (!positions || positions.count === 0) {
      throw new Error("Hull geometry generation failed. Vertex positions are missing or empty.");
    }

    const vertexCount = positions.count;
    const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;

    // Validate counts
    if (vertexCount < 3 || triangleCount < 1) {
      throw new Error(`Hull geometry generation failed. Invalid counts: vertices=${vertexCount}, triangles=${triangleCount}.`);
    }

    // Validate bounds values
    const box = geometry.boundingBox;
    const sphere = geometry.boundingSphere;

    if (!box || !sphere) {
      throw new Error("Hull geometry generation failed. Bounding bounds are empty.");
    }

    const isFiniteBox = [
      box.min.x, box.min.y, box.min.z,
      box.max.x, box.max.y, box.max.z
    ].every(Number.isFinite);

    const isFiniteSphere = [
      sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius
    ].every(Number.isFinite);

    if (!isFiniteBox || !isFiniteSphere || sphere.radius <= 0) {
      throw new Error("Hull geometry generation failed. Generated geometry has invalid or infinite bounds.");
    }

    return {
      vertexCount,
      triangleCount,
      boundingBox: box,
      boundingSphere: sphere
    };
  }
}
