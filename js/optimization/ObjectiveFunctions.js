export class ObjectiveFunctions {
  /**
   * Returns list of supported objective functions.
   */
  static getObjectives() {
    return [
      { id: 'resistance', name: 'Minimum Total Resistance', field: 'Rt', unit: 'kN', multiplier: 0.001 },
      { id: 'effectivePower', name: 'Minimum Effective Power', field: 'PE', unit: 'kW', multiplier: 0.001 },
      { id: 'deliveredPower', name: 'Minimum Delivered Power', field: 'PD', unit: 'kW', multiplier: 0.001 },
      { id: 'fuelConsumption', name: 'Minimum Fuel Consumption', field: 'fuelDay', unit: 't/day', multiplier: 1.0 },
      { id: 'co2Emissions', name: 'Minimum CO₂ Emissions', field: 'co2', unit: 'kg/h', multiplier: 1.0 },
      { id: 'voyageCost', name: 'Minimum Voyage Cost', field: 'voyageCost', unit: '$', multiplier: 1.0 }
    ];
  }

  /**
   * Extracts objective value from evaluated vessel details.
   * @param {string} objectiveId 
   * @param {Object} result 
   * @returns {number}
   */
  static evaluate(objectiveId, result) {
    switch (objectiveId) {
      case 'resistance':
        return result.Rt; // In Newtons
      case 'effectivePower':
        return result.PE; // In Watts
      case 'deliveredPower':
        return result.PD; // In Watts
      case 'fuelConsumption':
        return result.fuelDay; // tons/day
      case 'co2Emissions':
        return result.co2; // kg/h
      case 'voyageCost':
        return result.voyageCost; // Total cost in USD
      default:
        return result.Rt;
    }
  }
}
