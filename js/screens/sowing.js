// ============================================================
// 種まきフェイズ
// ============================================================

const SowingScreen = {
  chosenSeedId: "beginner",
  selectedItemIds: [],

  init() {
    document.getElementById("btn-choose-seed").addEventListener("click", () => this.openSeedChoicePopup());
    document.getElementById("btn-use-item").addEventListener("click", () => this.toggleItemChecklist());
    document.getElementById("btn-plant").addEventListener("click", () => this.plant());
    document.getElementById("btn-sowing-settings").addEventListener("click", () => {
      openSettingsPopup("screen-sowing");
    });
  },

  refresh() {
    this.chosenSeedId = "beginner";
    this.selectedItemIds = [];
    document.getElementById("chosen-seed-name").textContent =
      SEED_TIERS.find((s) => s.id === this.chosenSeedId).name;
    document.getElementById("item-checklist").innerHTML = "";
    document.getElementById("item-checklist").classList.add("hidden");
  },

  openSeedChoicePopup() {
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    const owned = Game.state.seedInventory;
    const availableSeeds = SEED_TIERS.filter((s) => (owned[s.id] || 0) > 0);
    overlay.innerHTML = `
      <div class="popup-box">
        <button class="popup-close">×</button>
        <div class="popup-title">種を選ぶ</div>
        <div class="scroll-list" style="max-height:300px;">
          ${availableSeeds
            .map(
              (s) => `
            <div class="list-item" data-seed="${s.id}">
              <span class="name">Rank${s.rank} ${s.name}</span>
              <span class="owned">所持:${owned[s.id] === Infinity ? "∞" : owned[s.id]}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;
    document.getElementById("screen-sowing").appendChild(overlay);
    overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
    overlay.querySelectorAll(".list-item").forEach((row) => {
      row.addEventListener("click", () => {
        this.chosenSeedId = row.dataset.seed;
        document.getElementById("chosen-seed-name").textContent =
          SEED_TIERS.find((s) => s.id === this.chosenSeedId).name;
        overlay.remove();
      });
    });
  },

  toggleItemChecklist() {
    const el = document.getElementById("item-checklist");
    el.classList.toggle("hidden");
    if (el.classList.contains("hidden")) return;

    const owned = Game.state.itemInventory;
    const availableItems = ITEM_LIST.filter((it) => it.phase !== "growing" && (owned[it.id] || 0) > 0);
    if (availableItems.length === 0) {
      el.innerHTML = `<div class="item-check-row">所持している事前アイテムがありません</div>`;
      return;
    }
    el.innerHTML = availableItems
      .map(
        (it) => `
        <label class="item-check-row">
          <span>${it.name} (所持:${owned[it.id]})</span>
          <input type="checkbox" data-item="${it.id}" ${this.selectedItemIds.includes(it.id) ? "checked" : ""} />
        </label>`
      )
      .join("");
    el.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.item;
        if (cb.checked) {
          if (this.selectedItemIds.length >= 3) {
            cb.checked = false;
            alert("アイテムは3つまでしか選べません");
            return;
          }
          this.selectedItemIds.push(id);
        } else {
          this.selectedItemIds = this.selectedItemIds.filter((x) => x !== id);
        }
      });
    });
  },

  plant() {
    const seed = SEED_TIERS.find((s) => s.id === this.chosenSeedId);
    // 種を1個消費(初心者の種は無限なので減らさない)
    if (!seed.infinite) {
      Game.state.seedInventory[seed.id] = (Game.state.seedInventory[seed.id] || 0) - 1;
    }
    // 使用アイテムを消費
    this.selectedItemIds.forEach((id) => {
      Game.state.itemInventory[id] = (Game.state.itemInventory[id] || 0) - 1;
    });

    Game.state.currentRun = createNewRun(seed.id, this.selectedItemIds);
    saveState(Game.state);
    showScreen("growing");
    GrowingScreen.start("new");
  },
};

// currentRunの雛形を作る(通常の種まき、チュートリアル開始時の両方から使う共通処理)
function createNewRun(seedId, itemIds) {
  const seed = SEED_TIERS.find((s) => s.id === seedId);
  return {
    seedId: seed.id,
    mysteryStats: seed.isMystery ? rollMysterySeedStats() : null,
    items: [...(itemIds || [])], // 事前アイテム(種まき時に選択、出荷/栽培に効果)
    activeGrowingItems: [], // 栽培アイテム(栽培中に使用した分、{id, startHour, endHour})
    lastGrowingItemUseHour: null, // 栽培アイテムの直近使用時刻(クールタイム判定用)
    scoreTemp: 0,
    scoreHum: 0,
    scoreClean: 0,
    gameHoursElapsed: 0,
    temp: 20.0,
    hum: 92.0,
    redTempSeconds: 0,
    redHumSeconds: 0,
    pests: [],
    pestIdCounter: 0,
    fairies: [], // もやしの妖精(出現中のもの)
    fairyIdCounter: 0,
    fairyBonusPercent: 0, // タップして獲得した最終スコア補正の合計(%)
  };
}
