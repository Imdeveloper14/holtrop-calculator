//-----------------------------------------------------
// Holtrop & Mennen Design Comparison Module
//-----------------------------------------------------

let compCases = {};
let compRtChart = null;
let compPeChart = null;
let compBreakdownChart = null;

window.saveCurrentDesignCase = function() {
    const data = window.lastCalculation;
    if (!data) {
        alert("Please perform a calculation first before saving the case.");
        return;
    }

    const nameInput = document.getElementById("comparisonCaseName");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a valid case name.");
        return;
    }

    if (compCases[name]) {
        alert("A case with this name already exists. Please choose a unique name.");
        return;
    }

    // Save deep copy
    compCases[name] = JSON.parse(JSON.stringify(data));
    nameInput.value = "";
    renderSavedCases();
    alert("Case '" + name + "' saved successfully!");
};

function renderSavedCases() {
    const tbody = document.getElementById("savedCasesListBody");
    tbody.innerHTML = "";

    Object.keys(compCases).forEach(name => {
        const caseData = compCases[name];
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="checkbox" class="case-compare-chk" value="${name}" checked> <strong>${name}</strong></td>
            <td>${caseData.vessel.lwl.toFixed(2)}</td>
            <td>${caseData.vessel.draft.toFixed(2)}</td>
            <td>${caseData.vessel.speed.toFixed(1)}</td>
            <td>${(caseData.total.Rt / 1000).toFixed(2)}</td>
            <td>
                <button type="button" onclick="renameDesignCase('${name}')">Rename</button>
                <button type="button" onclick="deleteDesignCase('${name}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.renameDesignCase = function(oldName) {
    const newName = prompt("Enter new name for case '" + oldName + "':", oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        const trimmed = newName.trim();
        if (compCases[trimmed]) {
            alert("A case with that name already exists.");
            return;
        }
        compCases[trimmed] = compCases[oldName];
        delete compCases[oldName];
        renderSavedCases();
    }
};

window.deleteDesignCase = function(name) {
    if (confirm("Are you sure you want to delete case '" + name + "'?")) {
        delete compCases[name];
        renderSavedCases();
    }
};

window.runCasesComparison = function() {
    const chks = document.querySelectorAll(".case-compare-chk:checked");
    const selectedNames = Array.from(chks).map(chk => chk.value);

    if (selectedNames.length === 0) {
        alert("Please select at least one design case to compare.");
        return;
    }

    // Find best values
    let lowestRtName = "";
    let lowestRtVal = Infinity;

    let lowestPeName = "";
    let lowestPeVal = Infinity;

    let bestEtaHName = "";
    let bestEtaHVal = -Infinity;

    selectedNames.forEach(name => {
        const c = compCases[name];
        const rt = c.total.Rt;
        const pe = c.power.PE;
        const etaH = c.propulsionData.hullEfficiency;

        if (rt < lowestRtVal) {
            lowestRtVal = rt;
            lowestRtName = name;
        }
        if (pe < lowestPeVal) {
            lowestPeVal = pe;
            lowestPeName = name;
        }
        if (etaH > bestEtaHVal) {
            bestEtaHVal = etaH;
            bestEtaHName = name;
        }
    });

    // Build Table
    const table = document.getElementById("comparisonMatrixTable");
    table.innerHTML = "";

    const addHeaderRow = (headers) => {
        const tr = document.createElement("tr");
        headers.forEach(h => {
            const th = document.createElement("th");
            th.style.padding = "8px";
            th.style.border = "1px solid #ddd";
            th.style.backgroundColor = "#f5f5f5";
            th.textContent = h;
            tr.appendChild(th);
        });
        table.appendChild(tr);
    };

    const addMetricRow = (metric, values, highlightName) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.style.padding = "8px";
        td.style.border = "1px solid #ddd";
        td.style.fontWeight = "bold";
        td.textContent = metric;
        tr.appendChild(td);

        values.forEach(v => {
            const cell = document.createElement("td");
            cell.style.padding = "8px";
            cell.style.border = "1px solid #ddd";
            cell.textContent = v.value;
            if (highlightName && v.name === highlightName) {
                cell.style.backgroundColor = "#e8f5e9";
                cell.style.fontWeight = "bold";
                cell.style.color = "#2e7d32";
            }
            tr.appendChild(cell);
        });
        table.appendChild(tr);
    };

    addHeaderRow(["Design Parameter", ...selectedNames]);

    const getVals = (extractor) => selectedNames.map(name => ({ name, value: extractor(compCases[name]) }));

    addMetricRow("Length Waterline (LWL) (m)", getVals(c => c.vessel.lwl.toFixed(2)));
    addMetricRow("Beam (B) (m)", getVals(c => c.vessel.beam.toFixed(2)));
    addMetricRow("Draft (T) (m)", getVals(c => c.vessel.draft.toFixed(2)));
    addMetricRow("Displacement (Disp) (m³)", getVals(c => c.vessel.disp.toFixed(1)));
    addMetricRow("Speed (knots)", getVals(c => c.vessel.speed.toFixed(1)));
    addMetricRow("Froude Number (Fn)", getVals(c => c.friction.Fn.toFixed(4)));
    
    addMetricRow("Wave Resistance (Rw) (kN)", getVals(c => (c.total.breakdown.wave / 1000).toFixed(2)));
    addMetricRow("Total Resistance (Rt) (kN)", getVals(c => (c.total.Rt / 1000).toFixed(2)), lowestRtName);
    addMetricRow("Effective Power (PE) (kW)", getVals(c => (c.power.PE / 1000).toFixed(2)), lowestPeName);
    addMetricRow("Brake Power (PB) (kW)", getVals(c => (c.propulsionData.brakePower / 1000).toFixed(2)));
    addMetricRow("Hull Efficiency (etaH)", getVals(c => c.propulsionData.hullEfficiency.toFixed(3)), bestEtaHName);

    // Draw Charts
    drawCompCharts(selectedNames);
};

function drawCompCharts(selectedNames) {
    if (compRtChart) compRtChart.destroy();
    if (compPeChart) compPeChart.destroy();
    if (compBreakdownChart) compBreakdownChart.destroy();

    // Chart 1: Rt Comparison
    const ctx1 = document.getElementById("compRtChart").getContext("2d");
    compRtChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: selectedNames,
            datasets: [{
                label: 'Total Resistance (kN)',
                data: selectedNames.map(name => compCases[name].total.Rt / 1000),
                backgroundColor: '#1e88e5'
            }]
        },
        options: { responsive: true }
    });

    // Chart 2: Power Comparison
    const ctx2 = document.getElementById("compPeChart").getContext("2d");
    compPeChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: selectedNames,
            datasets: [
                { label: 'Effective Power (PE) (kW)', data: selectedNames.map(name => compCases[name].power.PE / 1000), backgroundColor: '#4caf50' },
                { label: 'Brake Power (PB) (kW)', data: selectedNames.map(name => compCases[name].propulsionData.brakePower / 1000), backgroundColor: '#f44336' }
            ]
        },
        options: { responsive: true }
    });

    // Chart 3: Breakdown Comparison (stacked bar)
    const ctx3 = document.getElementById("compBreakdownChart").getContext("2d");
    compBreakdownChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: selectedNames,
            datasets: [
                { label: 'Friction', data: selectedNames.map(name => compCases[name].total.breakdown.friction / 1000), backgroundColor: '#2196F3' },
                { label: 'Viscous Form', data: selectedNames.map(name => (compCases[name].total.breakdown.viscous - compCases[name].total.breakdown.friction) / 1000), backgroundColor: '#4CAF50' },
                { label: 'Wave', data: selectedNames.map(name => compCases[name].total.breakdown.wave / 1000), backgroundColor: '#FF9800' },
                { label: 'Bulb', data: selectedNames.map(name => compCases[name].total.breakdown.bulb / 1000), backgroundColor: '#9C27B0' },
                { label: 'Transom', data: selectedNames.map(name => compCases[name].total.breakdown.transom / 1000), backgroundColor: '#FF5722' },
                { label: 'Appendage', data: selectedNames.map(name => compCases[name].total.breakdown.appendage / 1000), backgroundColor: '#795548' },
                { label: 'Air', data: selectedNames.map(name => compCases[name].total.breakdown.air / 1000), backgroundColor: '#607D8B' },
                { label: 'Correlation', data: selectedNames.map(name => compCases[name].total.breakdown.correlation / 1000), backgroundColor: '#E91E63' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

window.exportCompCsv = function() {
    const chks = document.querySelectorAll(".case-compare-chk:checked");
    const selectedNames = Array.from(chks).map(chk => chk.value);

    if (selectedNames.length === 0) {
        alert("Please select cases to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric," + selectedNames.join(",") + "\n";

    const addCsvRow = (label, extractor) => {
        csvContent += label + "," + selectedNames.map(name => extractor(compCases[name])).join(",") + "\n";
    };

    addCsvRow("Length Waterline (LWL) (m)", c => c.vessel.lwl.toFixed(2));
    addCsvRow("Beam (B) (m)", c => c.vessel.beam.toFixed(2));
    addCsvRow("Draft (T) (m)", c => c.vessel.draft.toFixed(2));
    addCsvRow("Displacement (Disp) (m³)", c => c.vessel.disp.toFixed(1));
    addCsvRow("Speed (knots)", c => c.vessel.speed.toFixed(1));
    addCsvRow("Froude Number (Fn)", c => c.friction.Fn.toFixed(4));
    addCsvRow("Total Resistance (Rt) (kN)", c => (c.total.Rt / 1000).toFixed(2));
    addCsvRow("Effective Power (PE) (kW)", c => (c.power.PE / 1000).toFixed(2));
    addCsvRow("Brake Power (PB) (kW)", c => (c.propulsionData.brakePower / 1000).toFixed(2));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "design_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.exportCompPdf = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 110, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("DESIGN CASE COMPARISON REPORT", 15, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Holtrop & Mennen Calculator Multi-Case Summary", 15, 65);

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.text("Prepared by: Primalisometric Consultancy", 15, 140);
    doc.text("Date: " + new Date().toLocaleString(), 15, 150);

    // Page 2: Comparison matrix table
    doc.addPage();
    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Design Comparison Matrix", 15, 10);

    doc.setTextColor(51, 51, 51);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const chks = document.querySelectorAll(".case-compare-chk:checked");
    const selectedNames = Array.from(chks).map(chk => chk.value);

    let y = 30;
    const drawMatrixRow = (label, extractor) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 15, y);
        doc.setFont("helvetica", "normal");
        let x = 80;
        selectedNames.forEach(name => {
            doc.text(extractor(compCases[name]), x, y);
            x += 25;
        });
        doc.setDrawColor(220, 220, 220);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;
    };

    doc.setFont("helvetica", "bold");
    doc.text("Parameter", 15, y);
    let xHeader = 80;
    selectedNames.forEach(name => {
        doc.text(name, xHeader, y);
        xHeader += 25;
    });
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    drawMatrixRow("LWL (m)", c => c.vessel.lwl.toFixed(2));
    drawMatrixRow("Beam (m)", c => c.vessel.beam.toFixed(2));
    drawMatrixRow("Draft (m)", c => c.vessel.draft.toFixed(2));
    drawMatrixRow("Disp (m³)", c => c.vessel.disp.toFixed(1));
    drawMatrixRow("Speed (kn)", c => c.vessel.speed.toFixed(1));
    drawMatrixRow("Froude (Fn)", c => c.friction.Fn.toFixed(4));
    drawMatrixRow("Rt (kN)", c => (c.total.Rt / 1000).toFixed(2));
    drawMatrixRow("PE (kW)", c => (c.power.PE / 1000).toFixed(2));
    drawMatrixRow("PB (kW)", c => (c.propulsionData.brakePower / 1000).toFixed(2));

    // Page 3: Comparison charts
    doc.addPage();
    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Comparison Curves Chart", 15, 10);

    y = 30;
    try {
        const rtCanvas = document.getElementById("compRtChart");
        const rtImg = rtCanvas.toDataURL("image/png");
        doc.addImage(rtImg, "PNG", 15, y, 180, 80);
    } catch(err) {}

    y += 90;
    try {
        const peCanvas = document.getElementById("compPeChart");
        const peImg = peCanvas.toDataURL("image/png");
        doc.addImage(peImg, "PNG", 15, y, 180, 80);
    } catch(err) {}

    doc.save("Design_Comparison_Report.pdf");
};

document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveCaseBtn");
    if (saveBtn) saveBtn.addEventListener("click", window.saveCurrentDesignCase);

    const compBtn = document.getElementById("compareCasesBtn");
    if (compBtn) compBtn.addEventListener("click", window.runCasesComparison);

    const expCsv = document.getElementById("exportCompCsvBtn");
    if (expCsv) expCsv.addEventListener("click", window.exportCompCsv);

    const expPdf = document.getElementById("exportCompPdfBtn");
    if (expPdf) expPdf.addEventListener("click", window.exportCompPdf);
});
