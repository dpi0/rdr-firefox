const textarea = document.getElementById("rules");
const saveBtn = document.getElementById("save");
const importBtn = document.getElementById("import");
const exportBtn = document.getElementById("export");
const fileInput = document.getElementById("file-input");
const info = document.getElementById("info");

let lastSavedValue = "";

async function load() {
  const data = await browser.storage.local.get("rules");
  const stringified = JSON.stringify(data.rules || [], null, 2);

  textarea.value = stringified;
  lastSavedValue = stringified;

  updateInfo();
}

async function save() {
  try {
    const rules = JSON.parse(textarea.value);
    await browser.storage.local.set({ rules });

    lastSavedValue = textarea.value;

    updateInfo();

    info.innerHTML = `<span class="saved-text">saved!</span>`;

    setTimeout(updateInfo, 1000);
  } catch {
    alert("Invalid JSON");
  }
}

function updateInfo() {
  try {
    const rules = JSON.parse(textarea.value);
    const count = Array.isArray(rules) ? rules.length : 0;
    const isEmpty = count === 0;

    const isDirty = textarea.value !== lastSavedValue;

    info.textContent = `${count} rules · Ctrl+S to save`;
    exportBtn.disabled = isEmpty;
    saveBtn.disabled = !isDirty;
  } catch {
    info.innerHTML = `<span class="error-text">invalid JSON</span>`;
    saveBtn.disabled = true;
    exportBtn.disabled = true;
  }
}

importBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target.result);
      textarea.value = JSON.stringify(json, null, 2);

      updateInfo();

      info.innerHTML = `<span class="exported-imported-text">imported!</span>`;
      setTimeout(updateInfo, 1000);
    } catch (err) {
      alert("Error importing file: Invalid JSON");
    }
  };
  reader.readAsText(file);
  fileInput.value = "";
});

function getTimestampedFilename() {
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const d = pad(now.getDate());
  const mon = months[now.getMonth()];
  const y = String(now.getFullYear()).slice(-2);
  // format: rdr-export-19-51-22-05-Dec-26.json
  return `rdr-export-${h}-${m}-${s}-${d}-${mon}-${y}.json`;
}

exportBtn.addEventListener("click", () => {
  try {
    JSON.parse(textarea.value);

    const blob = new Blob([textarea.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = getTimestampedFilename();
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    info.innerHTML = `<span class="exported-imported-text">exported!</span>`;
    setTimeout(updateInfo, 4000);
  } catch {
    alert("Cannot export invalid JSON");
  }
});

textarea.addEventListener("input", updateInfo);
saveBtn.addEventListener("click", save);

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (!saveBtn.disabled) {
      save();
    }
  }
});

load();
