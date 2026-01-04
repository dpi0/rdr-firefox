const textarea = document.getElementById("rules");
const saveBtn = document.getElementById("save");

async function load() {
  const data = await browser.storage.local.get("rules");
  textarea.value = JSON.stringify(data.rules || [], null, 2);
}

saveBtn.addEventListener("click", async () => {
  try {
    const rules = JSON.parse(textarea.value);
    await browser.storage.local.set({ rules });
  } catch {
    alert("Invalid JSON");
  }
});

load();
