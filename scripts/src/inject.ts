import { Config } from "./config";

type Args = [string, string[], Function, (number | null)?];

(() => {
  const awin = window as any;

  function to_string(threadId: number[]) {
    return BigInt.asIntN(
      64,
      (BigInt(threadId[0]) << BigInt(32)) + BigInt(threadId[1]),
    ).toString();
  }

  function getCfg() {
    return JSON.parse(
      document.getElementById("content-cfg")?.innerText ??
        JSON.stringify(new Config()),
    ) as Config;
  }

  function checkBlock(threadId: string, type: "seen" | "typing") {
    const cfg = getCfg();
    return (
      (type == "seen" ? cfg.blockSeen : cfg.blockTyping) &&
      ((cfg.blockMode == "blacklist" && cfg.blacklist.includes(threadId)) ||
        (cfg.blockMode == "whitelist" && !cfg.whitelist.includes(threadId)))
    );
  }

  awin.getCfg = getCfg;
  awin.checkBlock = checkBlock;

  const funcOverrideWappers: Record<
    string,
    (orgFunc: Function) => (...args: any[]) => Function
  > = {};
  const objOverrideWappers: Record<string, (orgFunc: string) => string> = {};

  objOverrideWappers["MAWJobDefinitions"] = (orgFunc) => {
    return orgFunc.replace(
      /markThreadAsRead:function(.*?){/,
      "markThreadAsRead:function$1{return;",
    );
  };

  objOverrideWappers["MAWSecureTypingState"] = (orgFunc) => {
    return orgFunc.replace(
      '"sendChatStateFromComposer"',
      'window.checkBlock?.(p,"typing")?"none":"sendChatStateFromComposer"',
    );
  };

  funcOverrideWappers["LSOptimisticMarkThreadReadV2"] =
    (orgFunc) =>
    (...args) => {
      if (!checkBlock(to_string(args[0]), "seen")) {
        return orgFunc.apply(orgFunc, args);
      }
    };

  funcOverrideWappers["LSSendTypingIndicator"] =
    (orgFunc) =>
    (...args) => {
      if (!checkBlock(to_string(args[0]), "typing")) {
        return orgFunc.apply(orgFunc, args);
      }
    };

  funcOverrideWappers["storiesUpdateSeenStateMutation"] =
    (orgFunc) =>
    (...args) => {
      const cfg = getCfg();
      cfg.blockSeenStory && (args[2] = undefined);
      return orgFunc.apply(orgFunc, args);
    };

  function createOverrideWapper(args: Args) {
    const functionName = args[0];

    if (objOverrideWappers[functionName]) {
      const execCode = `window['__fnc'] = ${objOverrideWappers[functionName](args[2].toString())}`;

      const elm = document.head ?? document.documentElement;
      const script = document.createElement("script");
      script.text = execCode;
      elm.appendChild(script);
      elm.removeChild(script);

      args[2] = awin.__fnc;
    }

    if (funcOverrideWappers[functionName]) {
      args[2] = new Proxy(args[2], {
        apply: (target, thisArg, args) => {
          target.apply(thisArg, args);

          const idx = args.length - 2;
          if (
            args[idx]?.exports?.default &&
            typeof args[idx].exports.default == "function"
          ) {
            args[idx].exports.default = funcOverrideWappers[functionName](
              args[idx].exports.default,
            );
          } else if (
            args[idx]?.exports &&
            typeof args[idx].exports == "function"
          ) {
            args[idx].exports = funcOverrideWappers[functionName](
              args[idx].exports,
            );
          }
        },
      });
    }

    return args;
  }

  let define = awin.__d;
  function customDefine(target: any, thisArg: any, args: Args) {
    return target.apply(thisArg, createOverrideWapper(args));
  }

  if (awin.__d) {
    if (~define.toString().includes("__d_stub")) {
      delete awin.__d;
    } else {
      define = new Proxy(awin.__d, { apply: customDefine });
    }
  }

  const defined = Object.getOwnPropertyDescriptor(window, "__d");
  if (!defined || defined.configurable) {
    Object.defineProperty(window, "__d", {
      get: function () {
        return define;
      },
      set: function (val) {
        define = new Proxy(val, { apply: customDefine });
      },
    });
  }
})();
