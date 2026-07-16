export class OptimizationExport {
  /**
   * Exports historical iteration states to CSV.
   */
  static exportCSV(base, best, history) {
    let csv = "Iteration,LWL (m),Beam (m),Draft (m),Cb,Resistance (kN),Power PE (kW),Power PD (kW),Daily Fuel (tons/day),CO2 (kg/h),Voyage Cost ($)\n";
    history.forEach((r, idx) => {
      csv += `${idx + 1},${r.lwl.toFixed(2)},${r.beam.toFixed(2)},${r.draft.toFixed(2)},${r.cb.toFixed(3)},${(r.Rt/1000).toFixed(3)},${(r.PE/1000).toFixed(3)},${(r.PD/1000).toFixed(3)},${r.fuelDay.toFixed(3)},${r.co2.toFixed(2)},${r.voyageCost.toFixed(2)}\n`;
    });

    const universalBOM = "\uFEFF";
    const blob = new Blob([universalBOM + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "hull_optimization_convergence.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generates a two-sheet Excel file comparing baseline to optimized values and detailing metrics.
   */
  static exportExcel(base, best, history) {
    const XLSX = window.XLSX;
    if (!XLSX) {
      alert("ExcelJS/XLSX library failed to load.");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Convergence History
    const convData = history.map((r, idx) => ({
      Iteration: idx + 1,
      "LWL (m)": Number(r.lwl.toFixed(2)),
      "Beam (m)": Number(r.beam.toFixed(2)),
      "Draft (m)": Number(r.draft.toFixed(2)),
      "Cb": Number(r.cb.toFixed(3)),
      "Resistance (kN)": Number((r.Rt / 1000).toFixed(2)),
      "Power PE (kW)": Number((r.PE / 1000).toFixed(2)),
      "Power PD (kW)": Number((r.PD / 1000).toFixed(2)),
      "Daily Fuel (t/day)": Number(r.fuelDay.toFixed(2)),
      "CO2 (kg/h)": Number(r.co2.toFixed(2)),
      "Voyage Cost ($)": Number(r.voyageCost.toFixed(2))
    }));
    const wsConv = XLSX.utils.json_to_sheet(convData);
    XLSX.utils.book_append_sheet(wb, wsConv, "Convergence History");

    // Sheet 2: Design Comparison
    const getChangePct = (bestVal, baseVal) => baseVal !== 0 ? Number((((bestVal - baseVal) / baseVal) * 100).toFixed(2)) : 0;
    const compData = [
      { Parameter: "LWL", Unit: "m", Original: base.lwl, Optimized: best.lwl, Change: getChangePct(best.lwl, base.lwl) },
      { Parameter: "Beam", Unit: "m", Original: base.beam, Optimized: best.beam, Change: getChangePct(best.beam, base.beam) },
      { Parameter: "Draft", Unit: "m", Original: base.draft, Optimized: best.draft, Change: getChangePct(best.draft, base.draft) },
      { Parameter: "Cb", Unit: "", Original: base.cb, Optimized: best.cb, Change: getChangePct(best.cb, base.cb) },
      { Parameter: "Resistance", Unit: "kN", Original: base.Rt / 1000, Optimized: best.Rt / 1000, Change: getChangePct(best.Rt, base.Rt) },
      { Parameter: "Power PE", Unit: "kW", Original: base.PE / 1000, Optimized: best.PE / 1000, Change: getChangePct(best.PE, base.PE) },
      { Parameter: "Power PD", Unit: "kW", Original: base.PD / 1000, Optimized: best.PD / 1000, Change: getChangePct(best.PD, base.PD) },
      { Parameter: "Daily Fuel", Unit: "t/day", Original: base.fuelDay, Optimized: best.fuelDay, Change: getChangePct(best.fuelDay, base.fuelDay) },
      { Parameter: "CO2", Unit: "kg/h", Original: base.co2, Optimized: best.co2, Change: getChangePct(best.co2, base.co2) },
      { Parameter: "Voyage Cost", Unit: "$", Original: base.voyageCost, Optimized: best.voyageCost, Change: getChangePct(best.voyageCost, base.voyageCost) }
    ];
    const wsComp = XLSX.utils.json_to_sheet(compData);
    XLSX.utils.book_append_sheet(wb, wsComp, "Design Comparison");

    XLSX.writeFile(wb, "hull_optimization_report.xlsx");
  }

  /**
   * Renders the HTML section with comparison table and charts to PDF.
   */
  static async exportPDF(containerId) {
    const jspdf = window.jspdf;
    const html2canvas = window.html2canvas;
    
    if (!jspdf || !html2canvas) {
      alert("PDF libraries failed to load.");
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1E232A',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("hull_optimization_report.pdf");
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("PDF generation failed. Checking console for details.");
    }
  }
}
