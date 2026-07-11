//-----------------------------------------------------
// Professional PDF Report Generator Module
//-----------------------------------------------------

window.generatePDFReport = function() {
    const data = window.lastCalculation;
    if (!data) {
        alert("Please perform a calculation first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // --- PAGE 1: COVER PAGE ---
    doc.setFillColor(13, 71, 161); // Navy blue background block
    doc.rect(0, 0, 210, 110, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("SHIP RESISTANCE & POWERING", 15, 50);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Holtrop & Mennen Prediction Report", 15, 65);

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PREPARED BY:", 15, 140);
    doc.setFont("helvetica", "normal");
    doc.text("Primalisometric Consultancy", 15, 148);

    doc.setFont("helvetica", "bold");
    doc.text("REPORT DATE:", 15, 170);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleString(), 15, 178);

    doc.setFont("helvetica", "bold");
    doc.text("VERSION:", 15, 200);
    doc.setFont("helvetica", "normal");
    doc.text("v1.0.0 (Sprint 37)", 15, 208);

    // Footer on Cover Page
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("CONFIDENTIAL - FOR INTERNAL USE ONLY", 15, 280);

    // --- PAGE 2: VESSEL PARTICULARS & HULL COEFFICIENTS ---
    doc.addPage();
    // Header
    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Vessel Particulars & Coefficients", 15, 10);

    // Table 1: Vessel Particulars
    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.text("1. Vessel Particulars", 15, 30);

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let y = 40;
    const drawRow = (label, val, yPos) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 15, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(val, 120, yPos);
        doc.setDrawColor(230, 230, 230);
        doc.line(15, yPos + 2, 195, yPos + 2);
    };

    drawRow("Length Between Perpendiculars (LPP)", data.vessel.lpp.toFixed(2) + " m", y); y += 10;
    drawRow("Length Waterline (LWL)", data.vessel.lwl.toFixed(2) + " m", y); y += 10;
    drawRow("Beam (B)", data.vessel.beam.toFixed(2) + " m", y); y += 10;
    drawRow("Draft (T)", data.vessel.draft.toFixed(2) + " m", y); y += 10;
    drawRow("Displacement Volume (Disp)", data.vessel.disp.toFixed(1) + " m³", y); y += 10;
    drawRow("LCB (% LPP from Midship)", data.vessel.lcb.toFixed(2) + " %", y); y += 10;
    drawRow("Vessel Speed", data.vessel.speed.toFixed(1) + " knots", y); y += 10;

    // Table 2: Hull Coefficients
    y += 10;
    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Hull Form Coefficients", 15, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    drawRow("Block Coefficient (Cb)", data.vessel.cb.toFixed(3), y); y += 10;
    drawRow("Midship Coefficient (Cm)", data.vessel.cm.toFixed(3), y); y += 10;
    drawRow("Waterplane Coefficient (Cwp)", data.vessel.cwp.toFixed(3), y); y += 10;
    drawRow("Prismatic Coefficient (Cp)", data.coeff.Cp.toFixed(3), y); y += 10;
    drawRow("Holtrop c7 Coefficient", data.hc.c7.toFixed(4), y); y += 10;
    drawRow("Holtrop c15 Coefficient", data.c15.c15.toFixed(4), y); y += 10;
    drawRow("Holtrop c16 Coefficient", data.c16.c16.toFixed(4), y); y += 10;

    // Footer Page 2
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Primalisometric Consultancy | Confidential", 15, 290);
    doc.text("Page 2", 195, 290);

    // --- PAGE 3: RESISTANCE BREAKDOWN & POWERING ---
    doc.addPage();
    // Header
    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resistance & Power Prediction Summary", 15, 10);

    y = 30;
    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.text("3. Resistance Components (kN)", 15, y);
    y += 10;
    doc.setFontSize(10);

    drawRow("Frictional Resistance (Rf)", (data.total.breakdown.friction / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Viscous Resistance (Rv)", (data.total.breakdown.viscous / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Wave Resistance (Rw)", (data.total.breakdown.wave / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Bulbous Bow Resistance (Rb)", (data.total.breakdown.bulb / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Transom Stern Resistance (Rtr)", (data.total.breakdown.transom / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Appendage Resistance (Rapp)", (data.total.breakdown.appendage / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Air Resistance (Ra)", (data.total.breakdown.air / 1000).toFixed(2) + " kN", y); y += 10;
    drawRow("Correlation Allowance (RA)", (data.total.breakdown.correlation / 1000).toFixed(2) + " kN", y); y += 10;
    
    doc.setFont("helvetica", "bold");
    drawRow("TOTAL RESISTANCE (Rt)", (data.total.Rt / 1000).toFixed(2) + " kN", y); y += 15;

    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.text("4. Power Prediction", 15, y);
    y += 10;
    doc.setFontSize(10);

    drawRow("Effective Power (PE)", (data.power.PE / 1000).toFixed(2) + " kW", y); y += 10;
    drawRow("Delivered Power (PD)", (data.propulsionData.deliveredPower / 1000).toFixed(2) + " kW", y); y += 10;
    drawRow("Brake Power (PB)", (data.propulsionData.brakePower / 1000).toFixed(2) + " kW", y); y += 10;

    // Footer Page 3
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Primalisometric Consultancy | Confidential", 15, 290);
    doc.text("Page 3", 195, 290);

    // --- PAGE 4: CHARTS & APPLICABILITY CHECKS ---
    doc.addPage();
    // Header
    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Charts & Validity Checks", 15, 10);

    y = 30;
    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.text("5. Resistance Breakdown Chart", 15, y);
    y += 10;

    // Embed Chart
    try {
        const chartCanvas = document.getElementById("resistanceChart");
        const chartImg = chartCanvas.toDataURL("image/png");
        doc.addImage(chartImg, "PNG", 15, y, 180, 90);
    } catch(err) {
        doc.text("[Chart Image Unavailable]", 15, y + 10);
    }

    y += 105;
    doc.setTextColor(13, 71, 161);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("6. Holtrop & Mennen Applicability Check List", 15, y);
    y += 10;
    doc.setFontSize(8);

    data.checks.forEach(check => {
        if (y > 270) {
            doc.addPage();
            // Header for new page
            doc.setFillColor(13, 71, 161);
            doc.rect(0, 0, 210, 15, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text("Analysis Charts & Validity Checks (Cont.)", 15, 10);
            y = 30;
        }

        // Draw bullet check status
        doc.setFont("helvetica", "bold");
        if (check.status === "PASS") {
            doc.setTextColor(46, 125, 50);
            doc.text("[PASS] " + check.name, 15, y);
        } else if (check.status === "WARNING") {
            doc.setTextColor(245, 127, 23);
            doc.text("[WARNING] " + check.name, 15, y);
        } else {
            doc.setTextColor(198, 40, 40);
            doc.text("[OUT OF RANGE] " + check.name, 15, y);
        }

        doc.setTextColor(51, 51, 51);
        doc.setFont("helvetica", "normal");
        doc.text(check.msg, 60, y);
        y += 6;
    });

    // Footer Page 4
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Primalisometric Consultancy | Confidential", 15, 290);
    doc.text("Page 4", 195, 290);

    doc.save("Holtrop_Resistance_Report.pdf");
};
