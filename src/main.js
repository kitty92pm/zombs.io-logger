(() => {

  const FunctionLogger = {
    _wrapped: new WeakSet(),
    _groups: new Map(),
    _paused: false,

    install(root, label = "root") {
      this._buildUI();
      this._scanObject(root, label);
      this._logSystem("Attached to " + label);
    },

    uninstall() { 
        if (this._ui && this._ui.parentNode) {
    this._ui.parentNode.removeChild(this._ui);
    this._ui = null;
    this._list = null;
  }

  for (const fn of this._wrapped) {
  if (fn._original) {
    const { host, key, fn: originalFn } = fn._original;
    try { host[key] = originalFn; } catch {}
  }
}

  this._wrapped.clear();
  this._groups.clear();
  this._paused = false;
    },

    _scanObject(obj, path, depth = 0) {
      if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return;
      if (depth > 4) return;

      let props;
      try {
        props = Object.getOwnPropertyNames(obj);
      } catch {
        return;
      }

      for (const key of props) {
        if (key === "constructor") continue;

        let val;
        try { val = obj[key]; } catch { continue; }

        const full = path + "." + key;

        if (typeof val === "function") {
          this._wrapFunction(obj, key, full);
        } else if (typeof val === "object" && val) {
          this._scanObject(val, full, depth + 1);
        }
      }
    },

    _wrapFunction(host, key, fullName) {
      let fn;
      try { fn = host[key]; } catch { return; }

      if (typeof fn !== "function") return;
      if (this._wrapped.has(fn)) return;

      const self = this;

      const wrapped = function (...args) {
        const thisArg = this;
        wrapped._original = { fn, host, key };
        const t0 = performance.now();
        let result, error;

        try {
          result = fn.apply(thisArg, args);
          return result;
        } catch (e) {
          error = e;
          throw e;
        } finally {
          const t1 = performance.now();
          self._logCall({
            name: fullName,
            fn,
            thisArg,
            args,
            result,
            error,
            time: (t1 - t0).toFixed(2)
          });
        }
      };

      try {
        host[key] = wrapped;
        this._wrapped.add(fn);
        this._wrapped.add(wrapped);
      } catch {}
    },

    _ensureGroup(name) {
      if (this._groups.has(name)) return this._groups.get(name);

      const group = document.createElement("div");
      group.style.border = "1px solid rgba(255,255,255,.06)";
      group.style.borderRadius = "8px";
      group.style.marginBottom = "6px";
      group.style.overflow = "hidden";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.cursor = "pointer";
      header.style.padding = "6px 8px";
      header.style.background = "rgba(255,255,255,.04)";

      const title = document.createElement("div");
      title.textContent = name;
      title.style.color = "#a78bfa";
      title.style.fontSize = "11px";
      title.style.whiteSpace = "nowrap";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";

      const counter = document.createElement("div");
      counter.textContent = "0";
      counter.style.color = "#9ca3af";
      counter.style.fontSize = "11px";

      header.append(title, counter);

      const list = document.createElement("div");
      list.style.display = "none";
      list.style.padding = "6px";

      header.onclick = () => {
        list.style.display = list.style.display === "none" ? "block" : "none";
      };

      group.append(header, list);
      this._list.appendChild(group);

      const obj = { container: group, list, counter, count: 0 };
      this._groups.set(name, obj);
      return obj;
    },

    _logCall(info) {
      if (this._paused) return;

      const g = this._ensureGroup(info.name);

      g.count++;
      g.counter.textContent = g.count;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";
      row.style.marginBottom = "4px";
      row.style.fontSize = "11px";

      let argText;
      try { argText = JSON.stringify(info.args); }
      catch { argText = "[unserializable]"; }

      const text = document.createElement("div");
      text.style.flex = "1";
      text.style.whiteSpace = "nowrap";
      text.style.overflow = "hidden";
      text.style.textOverflow = "ellipsis";

      text.innerHTML =
        `<span style="color:#9ca3af">(${argText})</span>
         <span style="color:#34d399"> ${info.time}ms</span>
         ${info.error ? `<span style="color:#ef4444"> ERR</span>` : ""}`;

      const resend = document.createElement("button");
      styleMiniBtn(resend);
      resend.textContent = "Resend";

      resend.onclick = () => {
        try {
          info.fn.apply(info.thisArg, info.args);
        } catch (e) {
          console.error("Resend error:", e);
        }
      };

      const copy = document.createElement("button");
      styleMiniBtn(copy);
      copy.textContent = "Copy fn";

      copy.onclick = async () => {
        try {
          const src = info.fn.toString();
          await navigator.clipboard.writeText(src);
        } catch (e) {
          console.warn("Copy fn failed", e);
        }
      };

      row.append(text, resend, copy);
      g.list.appendChild(row);
      g.list.scrollTop = g.list.scrollHeight;
    },

    _buildUI() {
      if (this._ui) return;

      const panel = document.createElement("div");
      panel.style.position = "fixed";
      panel.style.right = "14px";
      panel.style.bottom = "14px";
      panel.style.width = "460px";
      panel.style.height = "300px";
      panel.style.background = "rgba(15,15,18,0.96)";
      panel.style.border = "1px solid rgba(255,255,255,.08)";
      panel.style.borderRadius = "12px";
      panel.style.zIndex = 999999;
      panel.style.display = "flex";
      panel.style.flexDirection = "column";
      panel.style.fontFamily = "Inter, system-ui, monospace";

      const header = document.createElement("div");
      header.textContent = "Zombs.io logger";
      header.style.padding = "8px 10px";
      header.style.fontWeight = "600";
      header.style.cursor = "move";
      header.style.userSelect = "none";
      // header.style.background = "linear-gradient(90deg,#8b5cf6,#ec4899)";
      header.style.borderRadius = "12px 12px 0 0";

      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "6px";
      controls.style.padding = "6px";

      const clear = document.createElement("button");
      clear.textContent = "Clear";

      const pause = document.createElement("button");
      pause.textContent = "Pause";

      [clear, pause].forEach(b => {
        b.style.flex = "1";
        b.style.padding = "4px 6px";
        b.style.borderRadius = "6px";
        b.style.border = "1px solid rgba(255,255,255,.15)";
        b.style.background = "rgba(255,255,255,.08)";
        b.style.color = "#fff";
        b.style.cursor = "pointer";
      });

      clear.onclick = () => {
        this._groups.clear();
        this._list.innerHTML = "";
      };

      pause.onclick = () => {
        this._paused = !this._paused;
        pause.textContent = this._paused ? "Resume" : "Pause";
      };

      controls.append(clear, pause);

      const list = document.createElement("div");
      list.style.flex = "1";
      list.style.overflow = "auto";
      list.style.padding = "6px";

      panel.append(header, controls, list);
      document.body.appendChild(panel);

      this._ui = panel;
      this._list = list;

      makeDraggable(panel, header);

      function makeDraggable(box, handle) {
        let ox, oy, down = false;

        handle.addEventListener("mousedown", e => {
          down = true;
          ox = e.clientX - box.offsetLeft;
          oy = e.clientY - box.offsetTop;
          e.preventDefault();
        });

        window.addEventListener("mousemove", e => {
          if (!down) return;
          box.style.left = (e.clientX - ox) + "px";
          box.style.top = (e.clientY - oy) + "px";
          box.style.right = "auto";
          box.style.bottom = "auto";
        });

        window.addEventListener("mouseup", () => down = false);
      }
    },

    _logSystem(text) {
      const line = document.createElement("div");
      line.textContent = "[logger] " + text;
      line.style.color = "#fbbf24";
      line.style.fontSize = "11px";
      this._list.appendChild(line);
    }
  };

  function styleMiniBtn(b) {
    b.style.fontSize = "10px";
    b.style.padding = "2px 6px";
    b.style.borderRadius = "6px";
    b.style.border = "1px solid rgba(255,255,255,.15)";
    b.style.background = "rgba(255,255,255,.08)";
    b.style.color = "#fff";
    b.style.cursor = "pointer";
    b.style.whiteSpace = "nowrap";
  }

  window.FunctionLogger = FunctionLogger;

})();


fetch("https://raw.githubusercontent.com/kitty92pm/jsuilib/main/unixuilib.js")
    .then(r => r.text())
    .then(eval)
    .then(() => {

        const connected = game.network.connected;

        if (!connected) {
            UnixUI.Notify("Not connected to a server. Please connect to see the UI.", "error");
            return;
        }

        const ip = game.network.connectionOptions.ipAddress;
        const port = game.network.connectionOptions.port;

        Unload = function() {
            ui.Destroy();
        }

        const ui = UnixUI.New("Zombs.io logger").UsePreset(" ");
        ui.ToggleKey("F");

        ui.Add("About")
            .Label("Function Logger for Zombs.io")
            .Label("Author: kitty92pm")
            .Label("GitHub: github.com/kitty92pm/jsuilib")
            .TitledSeparator("what this does?")
            .Label("This logger hooks into the game's functions and logs calls, arguments, and execution time.")
            .Label("Use the controls to clear logs, pause logging, or resend function calls.")
            .Label("The network info section allows you to disconnect/reconnect and copy connection details.")
            .TitledSeparator("Changelogs")
            .Title("v1.2 - Function logger")
            .Label("Added game.world hooking option")
            .Label("Added uninstall logger")
            .Title("v1.1 - New feature")
            .Label("Added Complete walk through")
            .Title("v1.0 - Initial release")
            .Label(" - Basic function hooking and logging")
            .Label(" - UI with grouping, call details, and resend/copy options")
            .Label(" - Network info panel with connection controls")
            .Label(" - Deobfuscation tools for functions");

        ui.Add("Network Info")
            .CenterTitle("Connection Details")
            .Label("IP: " + ip)
            .Label("Port: " + port)
            .Button("Overflow connection", () => {
                const net = game.network;
                for (let i = 0; i < 100; i++) {
                    try {
                        net.sendPing();
                    } catch(e){}
                }
                UnixUI.Notify("Overflowed connection with 100 pings.", "success");
            })
            .TitledSeparator("Connection Controls")
            .Button("Disconnect", () => {
                game.network.disconnect();
                UnixUI.Notify("Disconnected from server.", "info");
            })
            .Button("Reconnect", () => {
                game.network.reconnect();
                UnixUI.Notify("Attempting to reconnect...", "info");
            })
            .TitledSeparator("Copy Info")
            .Button("Copy IP", () => {
                navigator.clipboard.writeText(ip).then(() => {
                    UnixUI.Notify("IP address copied to clipboard!", "success");
                });
            })
            .Button("Copy Port", () => {
                navigator.clipboard.writeText(port).then(() => {
                    UnixUI.Notify("Port number copied to clipboard!", "success");
                });
            })
            .TitledSeparator("Rpc - BETA/WIP")
            .Button("List Rpc Calls", () => {
                const rpcs = Object.keys(game.network.rpcMap);
                UnixUI.Notify("RPC Calls: " + rpcs.join(", "), "info");
                })
            .Button("Hook Rpc Calls", () => {
                (function () {
    const net = game.network;

    const original = net.sendRpc;

    net.sendRpc = function(name, data) {
        try {
            
            const encoder =
                this._encoder ||
                this.encoder ||
                this._rpcEncoder ||
                this._packetEncoder;

            if (encoder) {
                console.log("Possible RPC map keys on encoder:", Object.keys(encoder));
            }
        } catch(e){}

        return original.apply(this, arguments);
    };

    UnixUI.Notify("RPC hook installed. Check console for possible encoder keys.", "success");
})();

            })
            .Button("Overload Rpc Call", () => {

    const net = game.network;

    const encoder =
        net._encoder ||
        net.encoder ||
        net._packetEncoder ||
        net._rpcEncoder;

    if (!encoder) {
        UnixUI.Notify("RPC encoder not found.", "error");
        return;
    }

    const rpcMap =
        encoder.rpcMap ||
        encoder._rpcMap ||
        encoder.rpcs ||
        encoder._rpcs;

    if (!rpcMap) {
        UnixUI.Notify("RPC map not found on encoder.", "error");
        return;
    }

    const names = Object.keys(rpcMap);

    if (!names.length) {
        UnixUI.Notify("RPC map is empty.", "error");
        return;
    }

    const rpc = names[0];

    for (let i = 0; i < 10; i++) {
        try {
            net.sendRpc(rpc, {});
        } catch(e){}
    }

    UnixUI.Notify("Overloaded RPC: " + rpc, "success");
})


            ui.Add("Deobfuscation")
            .Button("Method 1 Deobfuscate Clipboard Function", async () => {
            try {
            const text = await navigator.clipboard.readText();
            let deobfuscated = text;

            deobfuscated = deobfuscated.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
            );
            deobfuscated = deobfuscated.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
            );
            deobfuscated = deobfuscated.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) =>
            String.fromCodePoint(parseInt(hex, 16))
            );
            deobfuscated = deobfuscated.replace(/%([0-9a-fA-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
            );
            deobfuscated = deobfuscated.replace(/function\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g, (_, args, body) => {
            const indentedBody = body.split(';').map(line => '    ' + line.trim()).join(';\n');
            return `function(${args}) {\n${indentedBody};\n}`;
            });

            const varMap = {};
            deobfuscated = deobfuscated.replace(/\b_0x[a-f0-9]{4,}\b/g, match => {
            if (!varMap[match]) varMap[match] = `var_${Object.keys(varMap).length + 1}`;
            return varMap[match];
            });

            await navigator.clipboard.writeText(deobfuscated);
            UnixUI.Notify("Function successfully deobfuscated and copied to clipboard!", "success");
        } catch (e) {
        console.warn("Advanced deobfuscation failed", e);
        UnixUI.Notify("Failed to deobfuscate function. Make sure the page is focused.", "error");
        }
    })


    .Button("Method 2 Deobfuscate Clipboard Function", async () => {
    try {
        const code = await navigator.clipboard.readText();
        let deobfuscated = code;

        const decodeHex = str => str.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        const decodeUnicode = str => str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        const decodeUnicodeBraces = str => str.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
        const decodePercent = str => decodeURIComponent(str);

        deobfuscated = decodeHex(deobfuscated);
        deobfuscated = decodeUnicode(deobfuscated);
        deobfuscated = decodeUnicodeBraces(deobfuscated);
        try { deobfuscated = decodePercent(deobfuscated); } catch(e){}

        const safeEval = str => {
            try {
                // Detect simple eval wrappers like: eval(function(p,a,c,k,e,d)...)
                const evalMatch = str.match(/eval\((function\(.*\)\{.*\})\)/s);
                if (evalMatch) {
                    // eslint-disable-next-line no-eval
                    return eval(evalMatch[1]);
                }
            } catch(e) {}
            return str;
        };
        deobfuscated = safeEval(deobfuscated);

        const beautifyCode = str => {
            const beautified = str
                .replace(/function\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g, (_, args, body) => {
                    const indentedBody = body.split(/;\s*/).map(line => '    ' + line.trim()).join(';\n');
                    return `function(${args}) {\n${indentedBody};\n}`;
                })
                .replace(/\{([\s\S]*?)\}/g, (_, inner) => {
                    return '{\n' + inner.split(';').map(line => '    ' + line.trim()).join(';\n') + ';\n}';
                });
            return beautified;
        };
        deobfuscated = beautifyCode(deobfuscated);

        const varMap = {};
        let varCounter = 1;
        deobfuscated = deobfuscated.replace(/\b_0x[a-f0-9]{3,}\b/g, match => {
            if (!varMap[match]) varMap[match] = `var_${varCounter++}`;
            return varMap[match];
        });

        const arrayStringUnroll = str => {
            try {
                const arrayMatch = str.match(/var (\w+)=\[(.*?)\];/s);
                if (arrayMatch) {
                    const [full, arrName, arrContents] = arrayMatch;
                    const arr = arrContents.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                    return str.replace(new RegExp(`${arrName}\\[(\\d+)\\]`, 'g'), (_, idx) => `"${arr[idx]}"`);
                }
            } catch(e){}
            return str;
        };
        deobfuscated = arrayStringUnroll(deobfuscated);

        await navigator.clipboard.writeText(deobfuscated);
        UnixUI.Notify("Advanced JS deobfuscation complete! Copied to clipboard.", "success");

    } catch (e) {
        console.warn("Deobfuscation failed", e);
        UnixUI.Notify("Failed to deobfuscate. Make sure page is focused and code is valid.", "error");
    }
})


        ui.Add("Function Logger")
            .Button("Attach to game", () => {
              if (!FunctionLogger._paused) { 
                    FunctionLogger._paused = false;
              }
                FunctionLogger.install(game, "game");
                UnixUI.Notify("Function Logger attached to game object.", "success");
            })
            .Button("Attach to network", () => {
              if (!FunctionLogger._paused) { 
                    FunctionLogger._paused = false;
              }
                FunctionLogger.install(game.network, "game.network");
                UnixUI.Notify("Function Logger attached to game.network object.", "success");
            })
            .Button("Attach to world", () => {
              if (!FunctionLogger._paused) { 
                    FunctionLogger._paused = false;
              }
                FunctionLogger.install(game.world, "game.world");
                UnixUI.Notify("Function Logger attached to game.world object.", "success");
            })
            .Button("Uninstall Logger", () => {
              if (!FunctionLogger._paused) { 
                    FunctionLogger._paused = true;
              }
                FunctionLogger.uninstall();
                UnixUI.Notify("Function Logger uninstalled and original functions restored.", "success");
            });

        UnixUI.Notify("UnixUI v1.0 Loaded Successfully", "success");

        ui.Add("Settings")
            .Label("F to toggle ui")
            .Button("Destroy UI", () => {
                ui.Destroy()
                unixLoaderLoaded = false;
                UnixUI.Notify("UI unloaded. Refresh the page to load again.", "info");
            })
            .Button("Finish walk through", () => {
                localStorage.setItem("walkthroughCompleted", "true");
            })

    })
    .catch(err => {
        console.error("Failed to load UnixUI:", err);
        alert("Failed to load UnixUI. Check console for details.");
    });

    setInterval(() => {
        if (!game.network.connected) { 
            UnixUI.Notify("Unloading due to disconnection...", "error");
            unixLoaderLoaded = false;
            Unload();
        }
    }, 1000);
