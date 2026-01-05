let rules = [];
let compiledRules = [];
const tabMap = new Map();
const bypassUntil = new Map();

browser.tabs.onRemoved.addListener((tabId) => {
  tabMap.delete(tabId);
  bypassUntil.delete(tabId);
});

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

  const origStr = state.original;
  const redStr = state.redirected;

  let i = 0;
  while (
    i < origStr.length &&
    i < redStr.length &&
    origStr[origStr.length - 1 - i] === redStr[redStr.length - 1 - i]
  ) {
    i++;
  }

  const originalBase = origStr.slice(0, origStr.length - i);
  const redirectedBase = redStr.slice(0, redStr.length - i);

  if (command === "go-original") {
    if (tab.url.startsWith(redirectedBase)) {
      const newPath = tab.url.slice(redirectedBase.length);
      const targetUrl = originalBase + newPath;
      bypassUntil.set(tab.id, Date.now() + 3000);
      browser.tabs.update(tab.id, { url: targetUrl });
    } else {
    }
  }

  if (command === "go-redirected") {
    if (tab.url.startsWith(originalBase)) {
      const newPath = tab.url.slice(originalBase.length);
      const targetUrl = redirectedBase + newPath;

      browser.tabs.update(tab.id, { url: targetUrl });
    }
  }
});
