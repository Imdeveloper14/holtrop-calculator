//-----------------------------------------------------
// CSV File Importer Module
//-----------------------------------------------------

window.parseCSVData = function(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map(c => c.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] || "";
        });
        rows.push(row);
    }
    return rows;
};

window.parseExcelData = function(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to JSON array of objects
    const json = XLSX.utils.sheet_to_json(worksheet);
    // Lowercase all keys to maintain compatibility with startBatchCalculation
    return json.map(row => {
        const newRow = {};
        for (let key in row) {
            newRow[key.trim().toLowerCase()] = String(row[key]);
        }
        return newRow;
    });
};
