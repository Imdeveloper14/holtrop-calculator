//-----------------------------------------------------
// Holtrop & Mennen Project Manager Module
//-----------------------------------------------------

function getProjectState() {
    const state = {
        inputs: {
            lpp: document.getElementById("lpp") ? Number(document.getElementById("lpp").value) : 0,
            lwl: document.getElementById("lwl") ? Number(document.getElementById("lwl").value) : 0,
            beam: document.getElementById("beam") ? Number(document.getElementById("beam").value) : 0,
            draft: document.getElementById("draft") ? Number(document.getElementById("draft").value) : 0,
            disp: document.getElementById("disp") ? Number(document.getElementById("disp").value) : 0,
            cb: document.getElementById("cb") ? Number(document.getElementById("cb").value) : 0,
            cm: document.getElementById("cm") ? Number(document.getElementById("cm").value) : 0,
            cwp: document.getElementById("cwp") ? Number(document.getElementById("cwp").value) : 0,
            lcb: document.getElementById("lcb") ? Number(document.getElementById("lcb").value) : 0,
            abt: document.getElementById("abt") ? Number(document.getElementById("abt").value) : 0,
            hb: document.getElementById("hb") ? Number(document.getElementById("hb").value) : 0,
            at: document.getElementById("at") ? Number(document.getElementById("at").value) : 0,
            rhoAir: document.getElementById("rhoAir") ? Number(document.getElementById("rhoAir").value) : 1.225,
            windSpeed: document.getElementById("windSpeed") ? Number(document.getElementById("windSpeed").value) : 0,
            windDir: document.getElementById("windDir") ? Number(document.getElementById("windDir").value) : 0,
            av: document.getElementById("av") ? Number(document.getElementById("av").value) : 0,
            cdAir: document.getElementById("cdAir") ? Number(document.getElementById("cdAir").value) : 0.8,
            speed: document.getElementById("speed") ? Number(document.getElementById("speed").value) : 0,
        },
        appendages: window.appendagesList || []
    };
    return state;
}

function loadProjectState(state) {
    if (!state) return;

    if (state.inputs) {
        Object.keys(state.inputs).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                el.value = state.inputs[key];
            }
        });
    }

    if (state.appendages) {
        window.appendagesList.length = 0;
        state.appendages.forEach(app => window.appendagesList.push(app));
        if (typeof window.renderAppendages === "function") {
            window.renderAppendages();
        }
    }

    // Trigger calculation
    const calcBtn = document.getElementById("calculateBtn");
    if (calcBtn) {
        calcBtn.click();
    }
}

// Save Project (local storage)
window.saveProjectToLocalStorage = function() {
    try {
        const state = getProjectState();
        localStorage.setItem("holtrop_project_saved", JSON.stringify(state));
        alert("Project saved successfully to local storage!");
    } catch (err) {
        alert("Failed to save project: " + err.message);
    }
};

// Export to file
window.exportProjectJson = function() {
    try {
        const state = getProjectState();
        state.results = window.lastCalculation || null;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "holtrop_project.json");
        dlAnchorElem.click();
    } catch(err) {
        alert("Failed to export project: " + err.message);
    }
};

// New project (reset)
window.newProject = function() {
    const inputs = ["lpp", "lwl", "beam", "draft", "disp", "cb", "cm", "cwp", "lcb", "abt", "hb", "at", "rhoAir", "windSpeed", "windDir", "av", "cdAir", "speed"];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === "rhoAir") el.value = "1.225";
            else if (id === "cdAir") el.value = "0.8";
            else el.value = "0";
        }
    });

    window.appendagesList.length = 0;
    if (typeof window.renderAppendages === "function") {
        window.renderAppendages();
    }

    // Clear outputs
    const results = ["reResult", "fnResult", "cfResult", "rfResult", "sResult", "cpResult", "k1Result", "rvResult", "rwResult", "rbResult", "rtrResult", "raResult", "rappResult", "caResult", "rtResult", "peResult", "etaHResult", "etaOResult", "pdResult", "pbResult", "cpCoeff", "lbCoeff", "btCoeff", "ltCoeff", "c7Result", "c7Coeff", "c15Result", "c16Result"];
    results.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "-";
    });

    const valList = document.getElementById("validationList");
    if (valList) valList.innerHTML = "";

    // Clear chart
    if (window.resistanceChart) {
        window.resistanceChart.destroy();
        window.resistanceChart = null;
    }

    window.lastCalculation = null;
    localStorage.removeItem("holtrop_project_autosave");
};

// Auto-save function called after successful calculations
window.autoSaveProject = function() {
    try {
        const state = getProjectState();
        localStorage.setItem("holtrop_project_autosave", JSON.stringify(state));
    } catch (err) {
        console.error("Auto-save failed:", err);
    }
};

// Open project file handler
window.openProjectJson = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            loadProjectState(state);
        } catch (err) {
            alert("Error parsing project file: " + err.message);
        }
    };
    reader.readAsText(file);
};

// Init project manager on DOM load
document.addEventListener("DOMContentLoaded", () => {
    // Restore session
    const autosave = localStorage.getItem("holtrop_project_autosave");
    if (autosave) {
        try {
            const state = JSON.parse(autosave);
            loadProjectState(state);
        } catch (err) {
            console.error("Failed to restore last session:", err);
        }
    } else {
        const saved = localStorage.getItem("holtrop_project_saved");
        if (saved) {
            try {
                const state = JSON.parse(saved);
                loadProjectState(state);
            } catch (err) {
                console.error("Failed to restore saved project:", err);
            }
        }
    }

    // Set up button listeners
    const newBtn = document.getElementById("newProjectBtn");
    if (newBtn) newBtn.addEventListener("click", window.newProject);

    const saveBtn = document.getElementById("saveProjectBtn");
    if (saveBtn) saveBtn.addEventListener("click", window.saveProjectToLocalStorage);

    const exportBtn = document.getElementById("exportJsonBtn");
    if (exportBtn) exportBtn.addEventListener("click", window.exportProjectJson);

    const openBtn = document.getElementById("openProjectBtn");
    const fileInput = document.getElementById("projectFileInput");
    if (openBtn && fileInput) {
        openBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                window.openProjectJson(e.target.files[0]);
            }
        });
    }
});
