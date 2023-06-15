import browser from "webextension-polyfill";

import { Config, Message } from "./config";

export async function getCfg() {
  return (await browser.storage.sync.get(Config.keys())) as Config;
}

export async function setCfg(cfg: Partial<Config>) {
  await browser.storage.sync.set(cfg);
  return await getCfg();
}

export async function sendCfg(cfg: Config, tabId?: number) {
  const msg: Message = { cfg };
  return await sendMsg(msg, tabId);
}

export async function sendMsg(msg: Message, tabId?: number) {
  const data = JSON.stringify(msg);

  if (tabId) {
    return await browser.tabs.sendMessage(tabId, data);
  } else {
    return await browser.runtime.sendMessage(data);
  }
}
