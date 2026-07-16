export class OptimizationReport {
  /**
   * Calculates comparative dataset between original and optimized vessel.
   * @param {Object} base 
   * @param {Object} best 
   */
  static getComparisonData(base, best) {
    const getDiff = (a, b) => b - a;
    const getPct = (diff, baseVal) => baseVal !== 0 ? (diff / baseVal) * 100 : 0;
    
    const rows = [
      { name: 'Length LWL', unit: 'm', base: base.lwl, best: best.lwl },
      { name: 'Beam B', unit: 'm', base: base.beam, best: best.beam },
      { name: 'Draft T', unit: 'm', base: base.draft, best: best.draft },
      { name: 'Block Coefficient Cb', unit: '', base: base.cb, best: best.cb },
      { name: 'Total Resistance Rt', unit: 'kN', base: base.Rt / 1000, best: best.Rt / 1000, lowerIsBetter: true },
      { name: 'Effective Power PE', unit: 'kW', base: base.PE / 1000, best: best.PE / 1000, lowerIsBetter: true },
      { name: 'Delivered Power PD', unit: 'kW', base: base.PD / 1000, best: best.PD / 1000, lowerIsBetter: true },
      { name: 'Daily Fuel Consumption', unit: 't/day', base: base.fuelDay, best: best.fuelDay, lowerIsBetter: true },
      { name: 'CO₂ Emissions', unit: 'kg/h', base: base.co2, best: best.co2, lowerIsBetter: true },
      { name: 'Voyage Fuel Cost', unit: '$', base: base.voyageCost, best: best.voyageCost, lowerIsBetter: true }
    ];

    return rows.map(r => {
      const diff = getDiff(r.base, r.best);
      const pct = getPct(diff, r.base);
      return { ...r, diff, pct };
    });
  }

  /**
   * Injects the comparison table into the target DOM container.
   * @param {string} containerId 
   * @param {Object} base 
   * @param {Object} best 
   */
  static renderComparison(containerId, base, best) {
    const data = this.getComparisonData(base, best);
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div class="card" style="margin-top: 14px;">
        <div class="card-header">
          <i data-lucide="git-compare" class="card-header-icon"></i>
          <h3 class="card-title">Design Comparison Matrix</h3>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-wrapper" style="border: none; border-radius: 0;">
            <table class="data-table" style="width: 100%;">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Original Design</th>
                  <th>Optimized Design</th>
                  <th>Difference</th>
                  <th>Change (%)</th>
                </tr>
              </thead>
              <tbody>
    `;

    data.forEach(r => {
      // Check if value changed
      const isParam = ['Length LWL', 'Beam B', 'Draft T', 'Block Coefficient Cb'].includes(r.name);
      
      let isImprovement = false;
      if (r.lowerIsBetter) {
        isImprovement = r.diff < 0;
      } else {
        isImprovement = r.diff > 0;
      }

      // Parameters are neutral, metrics are colorized
      const diffColor = isParam 
        ? '#E6E8EB'
        : (isImprovement ? '#4caf50' : (r.diff === 0 ? '#E6E8EB' : '#f44336'));

      const diffText = r.diff > 0 ? `+${r.diff.toFixed(2)}` : r.diff.toFixed(2);
      const pctText = r.pct > 0 ? `+${r.pct.toFixed(2)}%` : `${r.pct.toFixed(2)}%`;
      
      const displayBase = r.unit ? `${r.base.toFixed(2)} ${r.unit}` : r.base.toFixed(3);
      const displayBest = r.unit ? `${r.best.toFixed(2)} ${r.unit}` : r.best.toFixed(3);

      html += `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${displayBase}</td>
          <td>${displayBest}</td>
          <td style="color: ${diffColor}; font-weight: 500;">${r.diff === 0 ? '-' : diffText}</td>
          <td style="color: ${diffColor}; font-weight: bold;">${r.pct === 0 ? '0.00%' : pctText}</td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }
}
