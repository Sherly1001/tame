import MQTT from "mqtt-packet";
import { Config, Message } from "./config";

const wrappedJSObject = (window as any).wrappedJSObject;

browser.runtime.onMessage.addListener(async (msg, _sender) => {
  try {
    const data: Message = JSON.parse(msg);

    if (data.cfg) {
      wrappedJSObject.cfg = cloneInto(data.cfg, window);
    }
  } catch (err) {
    console.log("msg", err);
  }
});

browser.runtime.connect();

wrappedJSObject.browser = cloneInto(browser, window, { cloneFunctions: true });

// page context

function load() {
  const opts = {
    protocolVersion: 3,
  };

  const mqtt: typeof MQTT = window["mqtt" as any] as any;

  WebSocket = new Proxy(WebSocket, {
    construct(target, args, newTarget) {
      const ws: WebSocket = Reflect.construct(target, args, newTarget);

      ws.addEventListener("message", (event) => {
        const p = mqtt.parser(opts);

        p.on("packet", (packet) => {
          if (packet.cmd == "publish") {
            // console.log(packet);
          }
        });

        p.on("error", (_err) => {});

        p.parse(event.data);
      });

      ws.send = new Proxy(ws.send, {
        apply(target, thisArg, argArray) {
          const cfg: Config = window["cfg" as any] as any;

          const data = argArray[0];

          const p = mqtt.parser(opts);

          p.on("packet", (packet) => {
            if (packet.cmd == "publish" && packet.topic == "/ls_req") {
              const payData = new TextDecoder().decode(packet.payload);
              const payObj = JSON.parse(payData);

              if (cfg.blockTyping && payObj.type == 4) {
                const pay2Obj = JSON.parse(payObj.payload);
                const pay3Obj = JSON.parse(pay2Obj.payload);

                let block = false;
                if (cfg.blockMode == "blacklist") {
                  if (cfg.blacklist.includes(pay3Obj.thread_key.toString()))
                    block = true;
                } else {
                  if (!cfg.whitelist.includes(pay3Obj.thread_key.toString()))
                    block = true;
                }

                if (block) return;
              }

              if (cfg.blockSeen && payObj.type == 3) {
                const pay2Obj = JSON.parse(payObj.payload);

                let hasRead: null | string = null;
                for (const i in pay2Obj.tasks) {
                  if (pay2Obj.tasks[i].label == "21") {
                    const pay3Obj = JSON.parse(pay2Obj.tasks[i].payload);
                    hasRead = pay3Obj.thread_id.toString();
                    pay3Obj.last_read_watermark_ts = 1e3 * Date.now();
                    pay2Obj.tasks[i].payload = JSON.stringify(pay3Obj);
                  }
                }

                if (hasRead) {
                  let block = false;
                  if (cfg.blockMode == "blacklist") {
                    if (cfg.blacklist.includes(hasRead)) block = true;
                  } else {
                    if (!cfg.whitelist.includes(hasRead)) block = true;
                  }

                  if (block) {
                    payObj.payload = JSON.stringify(pay2Obj);
                    packet.payload = JSON.stringify(payObj);
                    argArray[0] = mqtt.generate(packet, opts);
                    return Reflect.apply(target, thisArg, argArray);
                  }
                }
              }
            }

            return Reflect.apply(target, thisArg, argArray);
          });

          p.on("error", (_err) => {
            return Reflect.apply(target, thisArg, argArray);
          });

          p.parse(data);
        },
      });

      return ws;
    },
  });
}

function inject() {
  document.getElementById("inject-mqtt")?.remove();
  const script = document.createElement("script");

  script.id = "inject-mqtt";
  script.src = "https://cdn.jsdelivr.net/gh/zit0zit/mqttjs@master/mqtt.js";

  script.onload = () => {
    document.getElementById("inject-script")?.remove();
    const script = document.createElement("script");

    script.id = "inject-script";
    script.textContent = `!(()=>{${load.toString()};${load.name}();})()`;

    document.head.insertBefore(
      script,
      document.head.firstChild?.nextSibling ?? null
    );
  };

  document.head.insertBefore(script, document.head.firstChild);
}

document.addEventListener("DOMContentLoaded", inject);
