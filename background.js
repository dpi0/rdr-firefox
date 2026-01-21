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

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "go-original",
    title: "Go to Original",
    contexts: ["page", "link"],
  });
  browser.contextMenus.create({
    id: "go-redirected",
    title: "Go to Redirection",
    contexts: ["page", "link"],
  });
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

async function processUrl(command, currentUrl, tabId, openInNewTab = false) {
  let state = tabMap.get(tabId);

  if (
    state &&
    state.original !== currentUrl &&
    state.redirected !== currentUrl
  ) {
    state = null;
  }

  if (!state && command === "go-redirected") {
    for (const rule of compiledRules) {
      if (rule.re.test(currentUrl)) {
        state = {
          original: currentUrl,
          redirected: currentUrl.replace(rule.re, rule.redirectUrl),
        };
        break;
      }
    }
  }

  if (!state && command === "go-original") {
    for (const rule of compiledRules) {
      try {
        const targetStr = rule.redirectUrl.split("$")[0];
        if (!currentUrl.startsWith(targetStr)) continue;

        const targetHost = new URL(targetStr).hostname;
        const sourceMatch = rule.re.source.match(
          /([a-zA-Z0-9-]+\\?\.)+[a-zA-Z0-9-]+/,
        );
        if (!sourceMatch) continue;

        const sourceHost = sourceMatch[0].replace(/\\/g, "");
        const candidate = currentUrl.replace(targetHost, sourceHost);

        if (
          rule.re.test(candidate) &&
          candidate.replace(rule.re, rule.redirectUrl) === currentUrl
        ) {
          state = { original: candidate, redirected: currentUrl };
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

  let targetUrl = null;

  if (command === "go-original") {
    if (currentUrl.startsWith(redirectedBase)) {
      const newPath = currentUrl.slice(redirectedBase.length);
      targetUrl = originalBase + newPath;
    }
  }

  if (command === "go-redirected") {
    if (currentUrl.startsWith(originalBase)) {
      const newPath = currentUrl.slice(originalBase.length);
      targetUrl = redirectedBase + newPath;
    }
  }

  if (targetUrl) {
    if (openInNewTab) {
      const newTab = await browser.tabs.create({
        url: targetUrl,
        active: true,
      });
      if (command === "go-original") {
        bypassUntil.set(newTab.id, Date.now() + 3000);
      }
    } else {
      if (command === "go-original") {
        bypassUntil.set(tabId, Date.now() + 3000);
      }
      browser.tabs.update(tabId, { url: targetUrl });
    }
  }
}

browser.commands.onCommand.addListener(async (command) => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    processUrl(command, tab.url, tab.id, false);
  }
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  const isLink = !!info.linkUrl;
  const urlToProcess = info.linkUrl || tab.url;

  processUrl(info.menuItemId, urlToProcess, tab.id, isLink);
});
