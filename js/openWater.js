//-----------------------------------------------------
// Holtrop & Mennen Propeller Open Water Chart Module
//-----------------------------------------------------

let openWaterChart = null;

window.drawOpenWaterChart = function(vessel, operatingJ) {
    const ctx = document.getElementById("openWaterChart");
    if (!ctx) return;

    if (openWaterChart) {
        openWaterChart.destroy();
    }

    const PD = vessel.propPitch || 1.0;
    const EAR = vessel.propEAR || 0.55;
    const Z = vessel.propBlades || 4;

    const jList = [];
    const ktList = [];
    const kq10List = [];
    const etaList = [];

    // Compute curves for J range 0.0 to 1.2
    for (let J = 0.0; J <= 1.25; J += 0.05) {
        jList.push(J.toFixed(2));
        const KT = Math.max(0, 0.395 * PD - 0.31 * J - 0.11 * J * J + 0.08 * EAR - 0.005 * Z);
        const KQ = Math.max(0, 0.0535 * PD - 0.038 * J - 0.014 * J * J + 0.012 * EAR - 0.0006 * Z);
        
        let etaO = 0;
        if (KQ > 0) {
            etaO = (J / (2.0 * Math.PI)) * (KT / KQ);
        }

        ktList.push(KT);
        kq10List.push(10.0 * KQ);
        etaList.push(etaO);
    }

    // Operating point datasets
    const opPoints = [];
    if (operatingJ !== undefined && operatingJ > 0 && operatingJ <= 1.25) {
        // We find the index closest to operatingJ, or plot it as a separate scatter dataset
    }

    openWaterChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: jList,
            datasets: [
                {
                    label: 'KT',
                    data: ktList,
                    borderColor: '#f44336',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: '10*KQ',
                    data: kq10List,
                    borderColor: '#ff9800',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'etaO (Propeller Efficiency)',
                    data: etaList,
                    borderColor: '#4caf50',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Advance Coefficient (J)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'KT, 10*KQ, etaO'
                    },
                    beginAtZero: true,
                    max: 1.2
                }
            }
        }
    });
};
