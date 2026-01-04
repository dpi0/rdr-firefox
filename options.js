const textarea = document.getElementById("rules");
const saveBtn = document.getElementById("save");
const info = document.getElementById("info");
const lines = document.getElementById("lines");

async function load() {
  const data = await browser.storage.local.get("rules");
  textarea.value = JSON.stringify(data.rules || [], null, 2);
  updateInfo();
}

async function save() {
  try {
    const rules = JSON.parse(textarea.value);
    await browser.storage.local.set({ rules });

    info.innerHTML = `<span class="saved-text">saved!</span>`;
    setTimeout(updateInfo, 1000);
  } catch {
    alert("Invalid JSON");
  }
}

function updateInfo() {
  try {
    const rules = JSON.parse(textarea.value);
    info.textContent = `${rules.length} rules · Ctrl+S to save`;
    saveBtn.disabled = false;
  } catch {
    info.innerHTML = `<span class="error-text">invalid JSON</span>`;
    saveBtn.disabled = true;
  }
}

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
