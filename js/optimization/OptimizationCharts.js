export class OptimizationCharts {
  constructor() {
    this.charts = {};
  }

  destroyCharts() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        this.charts[key] = null;
      }
    });
  }

  /**
   * Generates optimization convergence and comparative charts.
   * @param {Array} history - Array of evaluation states over iterations.
   * @param {Object} baseEval - Evaluated baseline.
   * @param {Object} bestEval - Evaluated best design.
   * @param {string} objectiveName - Selected objective title.
   */
  render(history, baseEval, bestEval, objectiveName) {
    this.destroyCharts();

    const iterations = history.map((h, i) => i + 1);

    // 1. Objective Value vs Iteration
    const ctxObj = document.getElementById("optResChart")?.getContext("2d");
    if (ctxObj) {
      const objValues = history.map(h => h.Rt / 1000); // Default to resistance
      this.charts.obj = new Chart(ctxObj, {
        type: 'line',
        data: {
          labels: iterations,
          datasets: [{
            label: `Objective (${objectiveName})`,
            data: history.map(h => h.Rt / 1000), // Standardized to Resistance in kN for visualization
            borderColor: '#1976D2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: 'Objective Value Convergence' } },
          scales: {
            x: { title: { display: true, text: 'Iteration (Successful Steps)' } },
            y: { title: { display: true, text: 'Resistance (kN)' } }
          }
        }
      });
    }

    // 2. Power vs Iteration
    const ctxPower = document.getElementById("optPowerChart")?.getContext("2d");
    if (ctxPower) {
      this.charts.power = new Chart(ctxPower, {
        type: 'line',
        data: {
          labels: iterations,
          datasets: [
            {
              label: 'Effective Power PE (kW)',
              data: history.map(h => h.PE / 1000),
              borderColor: '#2E7D32',
              fill: false,
              tension: 0.1
            },
            {
              label: 'Delivered Power PD (kW)',
              data: history.map(h => h.PD / 1000),
              borderColor: '#f9a825',
              fill: false,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: 'Power Convergence' } },
          scales: {
            x: { title: { display: true, text: 'Iteration' } },
            y: { title: { display: true, text: 'Power (kW)' } }
          }
        }
      });
    }

    // 3. Parameter Convergence (relative to baseline)
    const ctxParam = document.getElementById("optFuelChart")?.getContext("2d");
    if (ctxParam) {
      const getRel = (val, base) => base !== 0 ? (val / base) * 100 : 100;
      this.charts.param = new Chart(ctxParam, {
        type: 'line',
        data: {
          labels: iterations,
          datasets: [
            {
              label: 'Rel. Beam (%)',
              data: history.map(h => getRel(h.beam, baseEval.beam)),
              borderColor: '#9c27b0',
              fill: false
            },
            {
              label: 'Rel. Draft (%)',
              data: history.map(h => getRel(h.draft, baseEval.draft)),
              borderColor: '#e91e63',
              fill: false
            },
            {
              label: 'Rel. Cb (%)',
              data: history.map(h => getRel(h.cb, baseEval.cb)),
              borderColor: '#00bcd4',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: 'Parameter Evolution' } },
          scales: {
            x: { title: { display: true, text: 'Iteration' } },
            y: { title: { display: true, text: 'Percentage of Baseline (%)' } }
          }
        }
      });
    }

    // 4. Before vs After Comparison (Relative change in metrics)
    const ctxComp = document.getElementById("optParetoChart")?.getContext("2d");
    if (ctxComp) {
      const getChangePct = (best, base) => base !== 0 ? ((best - base) / base) * 100 : 0;
      const changes = [
        getChangePct(bestEval.Rt, baseEval.Rt),
        getChangePct(bestEval.PE, baseEval.PE),
        getChangePct(bestEval.fuelDay, baseEval.fuelDay),
        getChangePct(bestEval.co2, baseEval.co2),
        getChangePct(bestEval.voyageCost, baseEval.voyageCost)
      ];

      this.charts.compare = new Chart(ctxComp, {
        type: 'bar',
        data: {
          labels: ['Resistance', 'Effective Power', 'Daily Fuel', 'CO₂ Emissions', 'Voyage Cost'],
          datasets: [{
            label: 'Relative Change (%)',
            data: changes,
            backgroundColor: changes.map(v => v < 0 ? 'rgba(46, 125, 50, 0.7)' : 'rgba(211, 47, 47, 0.7)'),
            borderColor: changes.map(v => v < 0 ? '#2E7D32' : '#D32F2F'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: 'Relative Change (Optimized vs Baseline)' } },
          scales: {
            y: {
              title: { display: true, text: 'Change (%)' },
              ticks: { callback: value => value + '%' }
            }
          }
        }
      });
    }
  }
}
