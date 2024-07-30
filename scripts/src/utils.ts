import browser from "webextension-polyfill";

import { Config, Message } from "./config";

/**
 * get configs from account sync
 */
export async function getCfg() {
  return (await browser.storage.sync.get(Config.keys())) as Config;
}

/**
 * set configs to account sync
 */
export async function setCfg(cfg: Partial<Config>) {
  const oldCfg = await getCfg();
  const newCfg = Object.assign(oldCfg, cfg);
  await browser.storage.sync.set(newCfg);
  return newCfg;
}

/**
 * set then send configs to tabs or popup
 */
export async function setThenSendCfg(cfg: Partial<Config>, tabId?: number) {
  const newCfg = await setCfg(cfg);
  return await sendCfg(newCfg, tabId);
}

/**
 * send configs to tab if specified, otherwise send to popup
 */
export async function sendCfg(cfg: Config, tabId?: number) {
  const msg: Message = { cfg };
  return await sendMsg(msg, tabId);
}

/**
 * send message to listeners: tabs or popup
 */
export async function sendMsg(msg: Message, tabId?: number) {
  const data = JSON.stringify(msg);

  if (tabId) {
    return await browser.tabs.sendMessage(tabId, data);
  } else {
    return await browser.runtime.sendMessage(data);
  }
}
