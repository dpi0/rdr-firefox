let rules = [];
let compiledRules = [];
const tabMap = new Map();
const bypassUntil = new Map();

async function loadRules() {
  const data = await browser.storage.local.get("rules");
  rules = Array.isArray(data.rules) ? data.rules : [];
  compiledRules = rules.map((r) => ({
    re: new RegExp(r.includePattern),
    redirectUrl: r.redirectUrl,
  }));
}

loadRules();
browser.storage.onChanged.addListener(loadRules);

browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (
      bypassUntil.has(details.tabId) &&
      Date.now() < bypassUntil.get(details.tabId)
    ) {
      return;
    }

    const url = details.url;

    for (const rule of compiledRules) {
      if (rule.re.test(url)) {
        const redirected = url.replace(rule.re, rule.redirectUrl);

        tabMap.set(details.tabId, {
          original: url,
          redirected,
        });

        return { redirectUrl: redirected };
      }
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"],
);

browser.commands.onCommand.addListener(async (command) => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const state = tabMap.get(tab.id);
  if (!state) return;

  if (command === "go-original") {
    bypassUntil.set(tab.id, Date.now() + 3000);
    browser.tabs.update(tab.id, { url: state.original });
  }

  if (command === "go-redirected") {
    browser.tabs.update(tab.id, { url: state.redirected });
  }
});
