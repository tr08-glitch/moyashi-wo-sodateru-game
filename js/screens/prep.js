// ============================================================
// 準備フェイズ
// ============================================================

const PrepScreen = {
  currentTab: "seed",

  init() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentTab = btn.dataset.tab;
        this.refresh();
      });
    });

    document.getElementById("btn-save").addEventListener("click", () => {
      saveState(Game.state);
      alert("セーブしました");
    });

    document.getElementById("btn-to-title").addEventListener("click", () => {
      showScreen("title");
    });

    document.getElementById("btn-next-life").addEventListener("click", () => {
      saveState(Game.state);
      showScreen("sowing");
      SowingScreen.refresh();
    });
  },

  refresh() {
    document.getElementById("prep-gold").textContent = formatNumber(Game.state.gold);
    const listEl = document.getElementById("prep-list");
    listEl.innerHTML = "";

    if (this.currentTab === "seed") {
      let lastCategory = null;
      SEED_TIERS.filter((seed) => {
        if (seed.infinite) return false;
        if (seed.category === "ハード" && !Game.state.sproutChanUnlocked) return false;
        if (seed.category === "インポッシブル" && !Game.state.hardCleared) return false;
        return true;
      }).forEach((seed) => {
        if (seed.category && seed.category !== lastCategory) {
          lastCategory = seed.category;
          const heading = document.createElement("div");
          heading.className = "list-group-heading";
          heading.textContent = lastCategory;
          listEl.appendChild(heading);
        }
        const owned = Game.state.seedInventory[seed.id] || 0;
        const row = document.createElement("div");
        row.className = "list-item";
        row.innerHTML = `
          <div>
            <span class="name">Rank${seed.rank} ${seed.name}</span>
            ${owned > 0 ? `<span class="owned">所持:${owned === Infinity ? "∞" : owned}</span>` : ""}
          </div>
          <div class="price">${seed.price}G</div>
        `;
        row.addEventListener("click", () => this.openSeedPopup(seed));
        listEl.appendChild(row);
      });
    } else if (this.currentTab === "equipment") {
      EQUIPMENT_LIST.filter((eq) => !eq.requiresSproutChan || Game.state.sproutChanUnlocked).forEach((eq) => {
        const lv = Game.state.equipmentLevels[eq.id] || 0;
        const maxed = eq.type === "capped" && lv >= eq.maxLv;
        const cost = maxed ? null : equipmentCost(lv + 1);
        const row = document.createElement("div");
        row.className = "list-item";
        row.innerHTML = `
          <div>
            <span class="name">${eq.name}</span>
            <span class="owned">Lv${lv}${eq.type === "capped" ? "/" + eq.maxLv : ""}</span>
          </div>
          <div class="equipment-action">
            ${maxed
              ? `<span class="price">MAX</span>`
              : `<span class="price">${cost}G</span><button class="btn btn-small btn-primary equip-upgrade-btn">強化</button>`
            }
          </div>
        `;
        // 名前部分をタップすると詳細(スプラウトちゃんはお世話対象の選択も)を開く
        row.querySelector(".name").addEventListener("click", () => this.openEquipmentPopup(eq));
        if (eq.id === "sproutchan") {
          row.querySelector(".owned").addEventListener("click", () => this.openEquipmentPopup(eq));
        }
        // 「強化」ボタンはポップアップを開かず、その場で連続強化できるようにする
        const upgradeBtn = row.querySelector(".equip-upgrade-btn");
        if (upgradeBtn) {
          upgradeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (Game.state.gold < cost) {
              alert("所持金が足りません");
              return;
            }
            Game.state.gold -= cost;
            Game.state.equipmentLevels[eq.id] = lv + 1;
            saveState(Game.state);
            this.refresh();
          });
        }
        listEl.appendChild(row);
      });
    } else if (this.currentTab === "item") {
      const preItems = ITEM_LIST.filter((it) => it.phase !== "growing");
      const growingItems = ITEM_LIST.filter((it) => it.phase === "growing");

      const renderGroup = (title, items) => {
        const heading = document.createElement("div");
        heading.className = "list-group-heading";
        heading.textContent = title;
        listEl.appendChild(heading);

        items.forEach((item) => {
          const owned = Game.state.itemInventory[item.id] || 0;
          const row = document.createElement("div");
          row.className = "list-item";
          row.innerHTML = `
            <div>
              <span class="name">${item.name}</span>
              ${owned > 0 ? `<span class="owned">所持:${owned}</span>` : ""}
            </div>
            <div class="price">${item.price}G</div>
          `;
          row.addEventListener("click", () => this.openItemPopup(item));
          listEl.appendChild(row);
        });
      };

      renderGroup("事前アイテム", preItems);
      renderGroup("栽培アイテム", growingItems);
    }
  },

  openSeedPopup(seed) {
    if (seed.infinite) {
      alert(`${seed.name}は常に所持しており、使用回数は無限です。`);
      return;
    }
    this.showPurchasePopup({
      name: seed.name,
      unitPrice: seed.price,
      desc: seed.isMystery
        ? `TP・HP・CPは植えた時にランダム決定(各${seed.randomRange.min}〜${seed.randomRange.max})。ハイリスク・ハイリターンの特殊枠。`
        : `TP${seed.tp} / HP${seed.hp} / CP${seed.cp}`,
      onBuy: (qty) => {
        Game.state.seedInventory[seed.id] = (Game.state.seedInventory[seed.id] || 0) + qty;
      },
    });
  },

  openEquipmentPopup(eq) {
    if (eq.id === "sproutchan") {
      this.openSproutChanPopup(eq);
      return;
    }
    const lv = Game.state.equipmentLevels[eq.id] || 0;
    const cost = equipmentCost(lv + 1);
    const overlay = this.makeOverlay();
    overlay.querySelector(".popup-box").innerHTML = `
      <button class="popup-close">×</button>
      <div class="popup-title">${eq.name}</div>
      <div class="popup-desc">${eq.effect}</div>
      <div class="popup-desc">現在Lv${lv} → Lv${lv + 1}</div>
      <div class="popup-price">${cost}G</div>
      <button class="btn btn-primary" id="popup-buy-btn">強化する</button>
    `;
    overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#popup-buy-btn").addEventListener("click", () => {
      if (Game.state.gold < cost) {
        alert("所持金が足りません");
        return;
      }
      Game.state.gold -= cost;
      Game.state.equipmentLevels[eq.id] = lv + 1;
      saveState(Game.state);
      overlay.remove();
      this.refresh();
    });
  },

  openSproutChanPopup(eq) {
    const lv = Game.state.equipmentLevels[eq.id] || 0;
    const cost = equipmentCost(lv + 1);
    const target = Game.state.sproutChanTarget;
    const adjustPerHour = getSproutChanAdjustPerHour(lv || 1);

    const overlay = this.makeOverlay();
    const box = overlay.querySelector(".popup-box");

    const render = () => {
      box.innerHTML = `
        <button class="popup-close">×</button>
        <div class="popup-title">${eq.name}</div>
        <div class="popup-desc">${eq.effect}</div>
        <div class="popup-desc">現在Lv${lv}(1ゲーム内時間ごとに${adjustPerHour.toFixed(1)}ずつ最適値へ)</div>
        <div class="popup-desc">Lv${lv} → Lv${lv + 1}</div>
        <div class="popup-price">${cost}G</div>
        <button class="btn btn-primary" id="popup-buy-btn">強化する</button>
        <div class="popup-desc" style="margin-top:12px;">お世話を任せる項目${lv <= 0 ? "(Lv1以上で有効)" : ""}</div>
        <div class="settings-row">
          <button class="btn ${target === "temp" ? "btn-primary" : "btn-secondary"}" id="target-temp-btn">温度</button>
          <button class="btn ${target === "humidity" ? "btn-primary" : "btn-secondary"}" id="target-hum-btn">湿度</button>
          ${lv >= 5 ? `<button class="btn ${target === "both" ? "btn-primary" : "btn-secondary"}" id="target-both-btn">両方(Lv5〜)</button>` : ""}
        </div>
      `;
      box.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
      box.querySelector("#popup-buy-btn").addEventListener("click", () => {
        if (Game.state.gold < cost) {
          alert("所持金が足りません");
          return;
        }
        Game.state.gold -= cost;
        Game.state.equipmentLevels[eq.id] = lv + 1;
        saveState(Game.state);
        overlay.remove();
        this.refresh();
      });
      box.querySelector("#target-temp-btn").addEventListener("click", () => {
        Game.state.sproutChanTarget = "temp";
        saveState(Game.state);
        overlay.remove();
        this.openSproutChanPopup(eq);
      });
      box.querySelector("#target-hum-btn").addEventListener("click", () => {
        Game.state.sproutChanTarget = "humidity";
        saveState(Game.state);
        overlay.remove();
        this.openSproutChanPopup(eq);
      });
      const bothBtn = box.querySelector("#target-both-btn");
      if (bothBtn) {
        bothBtn.addEventListener("click", () => {
          Game.state.sproutChanTarget = "both";
          saveState(Game.state);
          overlay.remove();
          this.openSproutChanPopup(eq);
        });
      }
    };
    render();
  },

  openItemPopup(item) {
    this.showPurchasePopup({
      name: item.name,
      unitPrice: item.price,
      desc: item.effect,
      onBuy: (qty) => {
        Game.state.itemInventory[item.id] = (Game.state.itemInventory[item.id] || 0) + qty;
      },
    });
  },

  makeOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.innerHTML = `<div class="popup-box"></div>`;
    document.getElementById("screen-prep").appendChild(overlay);
    return overlay;
  },

  showPurchasePopup({ name, unitPrice, desc, onBuy }) {
    let qty = 1;
    const overlay = this.makeOverlay();
    const box = overlay.querySelector(".popup-box");

    const render = () => {
      box.innerHTML = `
        <button class="popup-close">×</button>
        <div class="popup-title">${name}</div>
        <div class="popup-desc">${desc}</div>
        <div class="popup-qty-row">
          <button class="qty-btn" id="qty-minus">−</button>
          <span id="qty-value">×${qty}</span>
          <button class="qty-btn" id="qty-plus">＋</button>
        </div>
        <div class="popup-price">${unitPrice * qty}G</div>
        <button class="btn btn-primary" id="popup-buy-btn">購入</button>
      `;
      box.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
      box.querySelector("#qty-minus").addEventListener("click", () => {
        if (qty > 1) { qty--; render(); }
      });
      box.querySelector("#qty-plus").addEventListener("click", () => {
        qty++; render();
      });
      box.querySelector("#popup-buy-btn").addEventListener("click", () => {
        const total = unitPrice * qty;
        if (Game.state.gold < total) {
          alert("所持金が足りません");
          return;
        }
        Game.state.gold -= total;
        onBuy(qty);
        saveState(Game.state);
        overlay.remove();
        this.refresh();
      });
    };
    render();
  },
};
