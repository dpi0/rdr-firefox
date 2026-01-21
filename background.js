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

  let state = tabMap.get(tab.id);

  if (!state && command === "go-original") {
    for (const rule of compiledRules) {
      try {
        const targetStr = rule.redirectUrl.split("$")[0];
        if (!tab.url.startsWith(targetStr)) continue;

        const targetHost = new URL(targetStr).hostname;
        const sourceMatch = rule.re.source.match(
          /([a-zA-Z0-9-]+\\?\.)+[a-zA-Z0-9-]+/,
        );
        if (!sourceMatch) continue;

        const sourceHost = sourceMatch[0].replace(/\\/g, "");
        const candidate = tab.url.replace(targetHost, sourceHost);

        if (
          rule.re.test(candidate) &&
          candidate.replace(rule.re, rule.redirectUrl) === tab.url
        ) {
          state = { original: candidate, redirected: tab.url };
          break;
        }
      } catch (e) {}
    }
  }

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
