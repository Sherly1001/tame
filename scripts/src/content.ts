import browser from "webextension-polyfill";

import { Message } from "./config";

browser.runtime.onMessage.addListener(async (msg, _sender) => {
  try {
    const data: Message = JSON.parse(msg);
    if (!data.cfg) return;

    const elm = document.head ?? document.documentElement;

    document.getElementById("content-cfg")?.remove();
    const script = document.createElement("script");
    script.id = "content-cfg";
    script.type = "application/json";
    script.text = JSON.stringify(data.cfg);

    elm.appendChild(script);
  } catch (err) {
    console.error(err);
  }
});

browser.runtime.connect();
