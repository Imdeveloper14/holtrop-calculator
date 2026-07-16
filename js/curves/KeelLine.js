const T = window.THREE;

export class KeelLine {
  constructor(ref) {
    this.ref = ref;
  }

  getKeelZ(u) {
    // Keel sits on baseline Z = 0
    return 0;
  }
}
