import browser, { Scripting } from "webextension-polyfill";

import { Config, Message } from "./config";
import { getCfg, sendCfg, setThenSendCfg } from "./utils";

const SCRIPTING_MATCHES = [
  "https://www.facebook.com/*",
  "https://www.messenger.com/*",
];

browser.declarativeNetRequest.getDynamicRules().then((rules) => {
  browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((rule) => rule.id),
    addRules: SCRIPTING_MATCHES.map((match, idx) => ({
      id: idx + 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "Content-Security-Policy", operation: "remove" },
          {
            header: "Content-Security-Policy-Report-Only",
            operation: "remove",
          },
        ],
      },
      condition: {
        regexFilter: match,
        resourceTypes: ["main_frame", "xmlhttprequest"],
      },
    })),
  });
});

browser.webRequest?.onHeadersReceived?.addListener(
  (e) => {
    return {
      responseHeaders: e.responseHeaders?.filter(
        (header) =>
          ![
            "content-security-policy",
            "content-security-policy-report-only",
          ].includes(header.name.toLowerCase()),
      ),
    };
  },
  { urls: SCRIPTING_MATCHES, types: ["main_frame", "xmlhttprequest"] },
  ["blocking", "responseHeaders"],
);

browser.runtime.onInstalled.addListener(async () => {
  const cfg = await getCfg();
  if (!cfg.blockMode) {
    await setThenSendCfg(new Config()).catch((_) => {});
  }
});

const tabs: number[] = [];
browser.runtime.onConnect.addListener(async (port) => {
  try {
    const cfg = await getCfg();
    if (port.sender?.tab?.id) {
      sendCfg(cfg, port.sender.tab.id);
      tabs.push(port.sender.tab.id);
    }
  } catch (err) {
    console.error("connect", err);
  }
});

async function setThenSendCfgWithTabs(cfg: Partial<Config>) {
  await setThenSendCfg(cfg);
  return await Promise.all(tabs.map((tab) => setThenSendCfg(cfg, tab)));
}

// handle message from popup
browser.runtime.onMessage.addListener(async (msg, _sender) => {
  const data: Message = JSON.parse(msg);

  if (data.toggleBlockMode) {
    await setThenSendCfgWithTabs({ blockMode: data.toggleBlockMode });
  } else if (typeof data.toggleBlockSeen != "undefined") {
    await setThenSendCfgWithTabs({ blockSeen: data.toggleBlockSeen });
  } else if (typeof data.toggleBlockTyping != "undefined") {
    await setThenSendCfgWithTabs({ blockTyping: data.toggleBlockTyping });
  } else if (typeof data.toggleBlockSeenStory != "undefined") {
    await setThenSendCfgWithTabs({ blockSeenStory: data.toggleBlockSeenStory });
  } else if (data.addToBlacklist) {
    const cfg = await getCfg();
    if (cfg.blacklist.includes(data.addToBlacklist)) return;
    cfg.blacklist.push(data.addToBlacklist);
    await setThenSendCfgWithTabs({ blacklist: cfg.blacklist });
  } else if (data.addToWhitelist) {
    const cfg = await getCfg();
    if (cfg.whitelist.includes(data.addToWhitelist)) return;
    cfg.whitelist.push(data.addToWhitelist);
    await setThenSendCfgWithTabs({ whitelist: cfg.whitelist });
  } else if (data.removeFromBlacklist) {
    const cfg = await getCfg();
    const idx = cfg.blacklist.indexOf(data.removeFromBlacklist);
    if (idx < 0) return;
    cfg.blacklist.splice(idx, 1);
    await setThenSendCfgWithTabs({ blacklist: cfg.blacklist });
  } else if (data.removeFromWhitelist) {
    const cfg = await getCfg();
    const idx = cfg.whitelist.indexOf(data.removeFromWhitelist);
    if (idx < 0) return;
    cfg.whitelist.splice(idx, 1);
    await setThenSendCfgWithTabs({ whitelist: cfg.whitelist });
  }
});

// inject content script to handle configs
browser.scripting
  .getRegisteredContentScripts({ ids: ["tame-content"] })
  .then((scripts) => {
    if (scripts.length > 0) return;
    browser.scripting.registerContentScripts([
      {
        id: "tame-content",
        matches: SCRIPTING_MATCHES,
        js: ["scripts/dist/content.js"],
        runAt: "document_start",
      } as Scripting.RegisteredContentScript,
    ]);
  });

// inject main world script to handle block seen
browser.scripting
  .getRegisteredContentScripts({ ids: ["tame-inject"] })
  .then((scripts) => {
    if (scripts.length > 0) return;
    browser.scripting.registerContentScripts([
      {
        id: "tame-inject",
        matches: SCRIPTING_MATCHES,
        js: ["scripts/dist/inject.js"],
        runAt: "document_start",
        world: "MAIN",
      } as Scripting.RegisteredContentScript,
    ]);
  });
