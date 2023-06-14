import { Config, Message } from "./config";
import { getCfg, sendCfg, setCfg } from "./utils";

const tabs: number[] = [];

browser.runtime.onInstalled.addListener(() => {
  const cfg = new Config();
  browser.storage.local.set(cfg);
});

browser.runtime.onConnect.addListener(async (port) => {
  try {
    const cfg = await getCfg();
    if (port.sender?.tab?.id) {
      tabs.push(port.sender?.tab?.id);
      sendCfg(cfg, port.sender?.tab?.id);
    }
  } catch (err) {
    console.log("connect", err);
  }
});

browser.runtime.onMessage.addListener(async (msg, _sender) => {
  const data: Message = JSON.parse(msg);

  if (data.toggleBlockMode) {
    setCfg({ blockMode: data.toggleBlockMode }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (typeof data.toggleFakeMessage != "undefined") {
    setCfg({ fakeMessageNotification: data.toggleFakeMessage }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (typeof data.toggleBlockSeen != "undefined") {
    setCfg({ blockSeen: data.toggleBlockSeen }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (typeof data.toggleBlockTyping != "undefined") {
    setCfg({ blockTyping: data.toggleBlockTyping }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (data.addToBlacklist) {
    const cfg = await getCfg();
    if (cfg.blacklist.includes(data.addToBlacklist)) return;
    cfg.blacklist.push(data.addToBlacklist);
    setCfg({ blacklist: cfg.blacklist }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (data.addToWhitelist) {
    const cfg = await getCfg();
    if (cfg.whitelist.includes(data.addToWhitelist)) return;
    cfg.whitelist.push(data.addToWhitelist);
    setCfg({ whitelist: cfg.whitelist }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (data.removeFromBlacklist) {
    const cfg = await getCfg();
    const idx = cfg.blacklist.indexOf(data.removeFromBlacklist);
    if (idx < 0) return;
    cfg.blacklist.splice(idx, 1);
    setCfg({ blacklist: cfg.blacklist }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  } else if (data.removeFromWhitelist) {
    const cfg = await getCfg();
    const idx = cfg.whitelist.indexOf(data.removeFromWhitelist);
    if (idx < 0) return;
    cfg.whitelist.splice(idx, 1);
    setCfg({ whitelist: cfg.whitelist }).then((cfg) => {
      sendCfg(cfg);
      for (let tab of tabs) {
        sendCfg(cfg, tab);
      }
    });
  }
});
