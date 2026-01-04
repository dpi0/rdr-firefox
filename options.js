const textarea = document.getElementById("rules");
const saveBtn = document.getElementById("save");
const info = document.getElementById("info");

async function load() {
  const data = await browser.storage.local.get("rules");
  textarea.value = JSON.stringify(data.rules || [], null, 2);
  updateInfo();
}

async function save() {
  try {
    const rules = JSON.parse(textarea.value);
    await browser.storage.local.set({ rules });
    updateInfo();
  } catch {
    alert("Invalid JSON");
  }
}

function updateInfo() {
  try {
    const rules = JSON.parse(textarea.value);
    info.textContent = `${rules.length} rules · Ctrl+S to save`;
  } catch {
    info.textContent = `invalid JSON · Ctrl+S to save`;
  }
}

textarea.addEventListener("input", updateInfo);
saveBtn.addEventListener("click", save);

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    save();
  }
});

load();
