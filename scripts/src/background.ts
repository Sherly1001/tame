import { Config } from "./config";

browser.runtime.onInstalled.addListener(() => {
  const cfg = new Config();
  browser.storage.local.set(cfg);
});

browser.runtime.onConnect.addListener(async (port) => {
  try {
    const cfg = await browser.storage.local.get(Config.keys());
    const data = { cfg };

    if (port.sender?.tab?.id) {
      browser.tabs.sendMessage(port.sender.tab.id, JSON.stringify(data));
    }
  } catch (err) {
    console.log("connect", err);
  }
});
