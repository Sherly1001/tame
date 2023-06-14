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

  const awin = window as any;
  const mqtt: typeof MQTT = awin.mqtt;
  const uid = document.cookie.match(/c_user=(\d+)/)?.[1];

  function isFocused() {
    return typeof document.hidden !== undefined ? !document.hidden : null;
  }

  function find(obj: any, val: any) {
    const stack = [];
    stack.push(obj);

    while (stack.length > 0) {
      let currObj = stack.pop();

      if (Array.isArray(currObj)) {
        if (currObj.includes(val)) return currObj;
        stack.push(...currObj.slice().reverse());
      } else if (currObj === Object(currObj)) {
        const keys = Object.keys(currObj);
        if (keys.includes(val)) return currObj[val];
        stack.push(...Object.values(currObj).reverse());
      }
    }

    return null;
  }

  function getKey(key: string, retArr = false) {
    const sjs = [
      ...Array.from(
        document.querySelectorAll<HTMLScriptElement>(
          'script[type="application/json"]'
        )
      ),
    ]
      .filter((i) => i.textContent?.includes(key))
      .map((s) => JSON.parse(s.textContent ?? "{}"));

    if (retArr) {
      return sjs.map((js) => find(js, key));
    }

    return find(sjs, key);
  }

  function getGroup(cid: string) {
    if ((awin.users as any)[cid]) return null;

    const aTag = document.querySelector(`a[href="/messages/t/${cid}/"]`);

    const name = aTag?.querySelector<HTMLSpanElement>(
      "span:nth-child(1) > span:nth-child(1)"
    )?.innerText;
    const imgs = aTag?.querySelectorAll<HTMLImageElement>("img");
    const img = imgs && imgs.length > 1 ? null : imgs?.[0] ? imgs[0].src : null;

    const gr = {
      cid,
      name,
      img,
    };

    return gr;
  }

  try {
    const groups = getKey("message_threads", true).find((g: any) => g.edges);
    const users = getKey("chat_sidebar_contact_rankings").map(
      (u: any) => u.user
    );

    if (groups) {
      awin.groups = groups.edges
        .map((g: any) => g.node)
        .map((g: any) => ({
          cid: g.thread_key.thread_fbid,
          name: g.name
            ? g.name
            : g.all_participants.edges
                .map((u: any) => u.node.messaging_actor.short_name)
                .join(", "),
          img: g.image ? g.image.uri : null,
        }))
        .reduce((acc: any, g: any) => {
          acc[g.cid] = g;
          return acc;
        }, {});
    }

    if (users) {
      awin.users = users
        .filter((u: any) => u && u.id)
        .reduce((acc: any, u: any) => {
          acc[u.id] = u;
          return acc;
        }, {});
    }
  } catch (err) {
    console.log(err);
  }

  WebSocket = new Proxy(WebSocket, {
    construct(target, args, newTarget) {
      const ws: WebSocket = Reflect.construct(target, args, newTarget);

      ws.addEventListener("message", (event) => {
        const p = mqtt.parser(opts);

        p.on("packet", (packet) => {
          const cfg: Config = awin.cfg;

          if (
            cfg.fakeMessageNotification &&
            packet.cmd == "publish" &&
            packet.topic == "/ls_resp"
          ) {
            const data = new TextDecoder().decode(packet.payload);
            const objPay = JSON.parse(data);
            if (!objPay.sp) return;
            if (objPay.sp.includes("updateThreadSnippet")) {
              const obj2Pay = JSON.parse(objPay.payload);
              const arr = find(obj2Pay.step, "updateThreadSnippet");
              if (arr && arr[5][1] != uid) {
                const msg = {
                  cid: arr[2][1],
                  uid: arr[5][1],
                  msg: arr[3],
                };

                const path = document.location.pathname.split("/");
                if (!isFocused() || path[path.length - 1] != msg.cid) {
                  const user = awin.users[msg.uid];
                  const group = awin.groups
                    ? awin.groups[msg.cid]
                    : getGroup(msg.cid);

                  const title =
                    "Facebook: " +
                    (group ? user.name + " to " + group.name : user.name);

                  new Notification(title, {
                    icon: group ? group.img : user.profile_picture.uri,
                    body: msg.msg,
                  });
                }
              }
            }
          }
        });

        p.on("error", (_err) => {});

        p.parse(event.data);
      });

      ws.send = new Proxy(ws.send, {
        apply(target, thisArg, argArray) {
          const cfg: Config = awin.cfg;

          const data = argArray[0];

          const p = mqtt.parser(opts);

          p.on("packet", (packet) => {
            if (packet.cmd == "publish" && packet.topic == "/ls_req") {
              const payData = new TextDecoder().decode(packet.payload);
              const payObj = JSON.parse(payData);

              if (cfg.blockTyping && payObj.type == 4) {
                const pay2Obj = JSON.parse(payObj.payload);
                const pay3Obj = JSON.parse(pay2Obj.payload);

                if (!pay3Obj.thread_key) {
                  return Reflect.apply(target, thisArg, argArray);
                }

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
  script.src = browser.runtime.getURL("scripts/dist/mqtt.js");

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
