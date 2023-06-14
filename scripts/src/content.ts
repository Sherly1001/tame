import browser from "webextension-polyfill";

import { Message } from "./config";

browser.runtime.onMessage.addListener(async (msg, _sender) => {
  try {
    const data: Message = JSON.parse(msg);

    if (data.cfg) {
      try {
        const wrappedJSObject = (window as any).wrappedJSObject;
        wrappedJSObject.cfg = cloneInto(data.cfg, window);
      } catch (err) {
        document.getElementById("inject-cfg")?.remove();
        const script = document.createElement("script");

        script.id = "inject-cfg";
        script.type = "application/json";
        script.textContent = JSON.stringify(data.cfg);

        document.head.insertBefore(script, document.head.firstChild);
      }
    }
  } catch (err) {
    console.error("runtime.msg", err);
  }
});

browser.runtime.connect();

function inject() {
  console.debug("inject");
  document.getElementById("inject-script")?.remove();
  const script = document.createElement("script");

  script.id = "inject-script";
  script.src = browser.runtime.getURL("scripts/dist/inject.js");

  document.head.insertBefore(script, document.head.firstChild);
}

var onAppend = function (elem: HTMLElement, f: (nodes: NodeList) => void) {
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.addedNodes.length) {
        f(m.addedNodes);
      }
    });
  });
  observer.observe(elem, { childList: true });
};

onAppend(document.documentElement, (added) => {
  if (added[0] == document.head) {
    inject();
  }
});
