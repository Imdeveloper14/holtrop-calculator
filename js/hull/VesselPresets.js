export const VesselPresets = {
  "Tanker": {
    cb: 0.82,
    cm: 0.99,
    cwp: 0.88,
    sternType: "cruiser",
    bulbous: false
  },
  "Containership": {
    cb: 0.62,
    cm: 0.96,
    cwp: 0.74,
    sternType: "transom",
    bulbous: true
  },
  "Bulk Carrier": {
    cb: 0.78,
    cm: 0.98,
    cwp: 0.84,
    sternType: "transom",
    bulbous: true
  },
  "Passenger Ship": {
    cb: 0.58,
    cm: 0.92,
    cwp: 0.70,
    sternType: "cruiser",
    bulbous: true
  }
};

export function getPresetParameters(shipType, d) {
  const preset = VesselPresets[shipType] || VesselPresets["Bulk Carrier"];
  
  // Deform the selected template parameters by multiplying/scaling with inputs
  return {
    cb: d.cb || preset.cb,
    cm: d.cm || preset.cm,
    cwp: d.cwp || preset.cwp,
    sternType: preset.sternType,
    bulbous: preset.bulbous
  };
}
