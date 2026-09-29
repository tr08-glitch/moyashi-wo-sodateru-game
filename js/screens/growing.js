// ============================================================
// 栽培フェイズ
// ============================================================

const AUTOSAVE_KEY = "moyashi_autosave_v1";
const TICK_MS = 100;

const GrowingScreen = {
  timer: null,
  holdTimer: null,
  pestElements: {}, // pest.id -> DOM要素(毎tick作り直さず、発生・除去時だけ更新する)
  fairyElements: {}, // fairy.id -> DOM要素
  speedMultiplier: 1, // 倍速(1〜3)

  init() {
    document.querySelectorAll(".adj-btn").forEach((btn) => {
      const target = btn.dataset.target;
      const dir = parseInt(btn.dataset.dir, 10);

      const step = () => this.adjust(target, dir * 0.1);

      btn.addEventListener("click", step);

      // 長押しで連続変化
      let holdInterval = null;
      const startHold = (e) => {
        e.preventDefault();
        holdInterval = setInterval(step, 120);
      };
      const stopHold = () => {
        if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
      };
      btn.addEventListener("pointerdown", startHold);
      btn.addEventListener("pointerup", stopHold);
      btn.addEventListener("pointerleave", stopHold);
      btn.addEventListener("pointercancel", stopHold);
    });

    document.getElementById("btn-growing-settings").addEventListener("click", () => {
      openSettingsPopup("screen-growing");
    });

    document.getElementById("btn-pause").addEventListener("click", () => this.pause());
    document.getElementById("btn-resume").addEventListener("click", () => this.resume());
    document.getElementById("btn-discard").addEventListener("click", () => this.discard());
    document.getElementById("btn-speed").addEventListener("click", () => this.cycleSpeed());
    document.getElementById("btn-use-growing-item").addEventListener("click", () => this.openGrowingItemPopup());
    document.getElementById("btn-sproutchan-switch").addEventListener("click", () => this.openSproutChanQuickSwitch());
    document.getElementById("sprout-badge-temp").addEventListener("click", () => this.openSproutChanQuickSwitch());
    document.getElementById("sprout-badge-hum").addEventListener("click", () => this.openSproutChanQuickSwitch());

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && Game.state.currentRun) {
        this.persistAutosave();
      }
    });
  },

  pause() {
    if (!this.timer) return; // 既に停止中(一時停止 or ゲーム終了後)なら何もしない
    clearInterval(this.timer);
    this.timer = null;
    this.persistAutosave();
    document.getElementById("pause-overlay").classList.remove("hidden");
  },

  resume() {
    if (this.timer) return;
    document.getElementById("pause-overlay").classList.add("hidden");
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.persistAutosave();
  },

  // mode: 省略=再開(すぐ動き出す) / "new"=新規栽培(「栽培開始」バナーを3秒出してから動き出す) / "deferred"=呼び出し側が後でbeginTicking()する
  start(mode) {
    document.getElementById("growing-generation").textContent = `もやし${Game.state.generation}世`;
    document.getElementById("pause-overlay").classList.add("hidden");
    this.pestElements = {};
    this.currentGrowthStage = null;
    this.speedMultiplier = 1;
    this.renderSpeedButton();
    this.fairyElements = {};
    document.getElementById("pest-layer").innerHTML = "";
    document.getElementById("fairy-layer").innerHTML = "";
    this.renderAll();
    this.syncPestElements();
    this.persistAutosave();
    if (mode === "new") {
      this.beginTicking();
    } else if (mode !== "deferred") {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }
  },

  // 画面中央にポップな文字を3秒間表示する(表示中は栽培時間は止まっている前提)。終わったらonDoneを呼ぶ
  showBanner(text, onDone) {
    const banner = document.getElementById("phase-banner");
    clearTimeout(this.bannerTimeout);
    banner.textContent = text;
    banner.classList.remove("hidden", "pop");
    void banner.offsetWidth; // アニメーションを毎回最初から再生するためのリフロー
    banner.classList.add("pop");
    this.bannerTimeout = setTimeout(() => {
      banner.classList.add("hidden");
      this.bannerTimeout = null;
      if (onDone) onDone();
    }, 3000);
  },

  // 「栽培開始」バナーを出している間は栽培時間を止め、終わったらタイマーを動かす
  beginTicking() {
    this.showBanner("栽培開始!", () => {
      this.timer = setInterval(() => this.tick(), TICK_MS);
    });
  },

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    // バナー表示中に破棄などで止められた場合、後からタイマーが動き出さないようにする
    if (this.bannerTimeout) { clearTimeout(this.bannerTimeout); this.bannerTimeout = null; }
    document.getElementById("phase-banner").classList.add("hidden");
    localStorage.removeItem(AUTOSAVE_KEY);
  },

  persistAutosave() {
    // チュートリアル表示中に誤って裏のボタンを操作してしまっても、
    // 離脱時にタイトルへ戻れるようautosaveは書き込まない
    const tutorialEl = document.getElementById("tutorial-overlay");
    if (tutorialEl && !tutorialEl.classList.contains("hidden")) return;
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      state: Game.state,
      lastActive: Date.now(),
    }));
  },

  adjust(target, delta) {
    const run = Game.state.currentRun;
    if (!run) return;
    if (target === "temp") {
      run.temp = Math.round((run.temp + delta) * 10) / 10;
    } else {
      run.hum = Math.round((run.hum + delta) * 10) / 10;
      run.hum = Math.max(0, Math.min(100, run.hum));
    }
    this.renderGauges();
  },

  // 栽培アイテムが今も効果を発揮しているか判定(栽培中に使用した分のみ対象)
  isItemActive(itemId, run) {
    return run.activeGrowingItems.some((entry) => entry.id === itemId && run.gameHoursElapsed <= entry.endHour);
  },

  tick() {
    const run = Game.state.currentRun;
    if (!run) return;

    // 妖精:出現から3秒(現実時間)でタップされなければ自動消滅(ボーナスは入らない)
    // ※実時間基準の処理なので、倍速の影響は受けない
    if (run.fairies.length > 0) {
      const now = Date.now();
      const before = run.fairies.length;
      run.fairies = run.fairies.filter((f) => now - f.spawnedAtMs < 3000);
      if (run.fairies.length !== before) this.syncFairyElements();
    }

    // ゲーム内時間の進行分を倍速回数だけ繰り返す
    // (温度・湿度の変化量やカビ・菌の発生率など「ゲーム内時間あたり」の値は変わらず、
    //  同じ現実時間によりたくさん詰め込まれる形になるため、速度を上げるほど対応が忙しくなる)
    for (let i = 0; i < this.speedMultiplier; i++) {
      const stillRunning = this.tickOnce();
      if (!stillRunning) return; // バッドエンド/出荷などで画面遷移した場合は打ち切る
    }

    this.persistAutosave();
    this.renderAll();
  },

  tickOnce() {
    const run = Game.state.currentRun;
    if (!run) return false;

    const realSeconds = TICK_MS / 1000;
    const gameHoursDelta = realSeconds / GAME_CONFIG.REAL_SECONDS_PER_GAME_HOUR;
    const prevHourFloor = Math.floor(run.gameHoursElapsed);
    run.gameHoursElapsed += gameHoursDelta;
    const newHourFloor = Math.floor(run.gameHoursElapsed);

    // ---- 温度・湿度のドリフト(天候×時間帯のバイアス+ノイズ方式) ----
    const seed = SEED_TIERS.find((s) => s.id === run.seedId);
    const difficulty = (seed && seed.difficulty) || 1;
    const eq = Game.state.equipmentLevels;
    const airconReduction = 1 - Math.min(1, getTieredEquipmentValue(eq.aircon || 0, 5) / 100);
    const humidifierReduction = 1 - Math.min(1, getTieredEquipmentValue(eq.humidifier || 0, 5) / 100);
    const tempStabilizerActive = this.isItemActive("tempstabilizer", run);
    const humStabilizerActive = this.isItemActive("humidstabilizer", run);

    // 天候:一定時間(24〜48ゲーム内時間)ごとにランダムで切り替わる
    if (run.weatherId === undefined) run.weatherId = WEATHER_LIST[Math.floor(Math.random() * WEATHER_LIST.length)].id;
    if (run.weatherTimer === undefined) run.weatherTimer = 24 + Math.random() * 24;
    run.weatherTimer -= gameHoursDelta;
    if (run.weatherTimer <= 0) {
      run.weatherId = WEATHER_LIST[Math.floor(Math.random() * WEATHER_LIST.length)].id;
      run.weatherTimer = 24 + Math.random() * 24;
    }
    const weather = WEATHER_LIST.find((w) => w.id === run.weatherId);

    // 時間帯:ゲーム内時刻から一意に決まる(ランダム要素なし)
    const hourOfDay = Math.floor(run.gameHoursElapsed % 24);
    const timeOfDay = getTimeOfDay(hourOfDay);

    // アクシデント:条件(夜/雨)を満たす間、毎時間一定確率で発生し、しばらく持続する
    if (run.tropicalNightTimer === undefined) run.tropicalNightTimer = 0;
    if (run.heavyRainTimer === undefined) run.heavyRainTimer = 0;
    if (run.tropicalNightTimer > 0) run.tropicalNightTimer -= gameHoursDelta;
    if (run.heavyRainTimer > 0) run.heavyRainTimer -= gameHoursDelta;
    // 条件から外れたら強制的に終了(夜が明けた/雨が止んだ)
    if (timeOfDay.id !== "night") run.tropicalNightTimer = 0;
    if (weather.id !== "rain") run.heavyRainTimer = 0;

    let tempDriftBase = 0.06 * difficulty; // 気温は湿度より変動しやすい(1tick=100msあたりの変化幅)
    let humDriftBase = 0.03 * difficulty;
    if (tempStabilizerActive) tempDriftBase *= 0.8;
    if (humStabilizerActive) humDriftBase *= 0.8;

    // バイアス成分(天候+時間帯+アクシデント)+ ランダムノイズ成分
    let tempBias = weather.tempBias + timeOfDay.tempBias;
    let humBias = weather.humBias;
    if (run.tropicalNightTimer > 0) tempBias += ACCIDENT_LIST.find((a) => a.id === "tropicalnight").tempBiasBonus;
    if (run.heavyRainTimer > 0) humBias += ACCIDENT_LIST.find((a) => a.id === "heavyrain").humBiasBonus;
    const tempStep = (tempBias * 0.3 + (Math.random() - 0.5) * 1.2 * 0.4) * tempDriftBase;
    const humStep = (humBias * 0.3 + (Math.random() - 0.5) * 1.2 * 0.4) * humDriftBase;

    // 内部値は丸めずに保持する(毎tick 0.1単位に丸めると変化が丸め誤差で消えてしまうため)
    run.temp = run.temp + tempStep * airconReduction;
    run.hum = run.hum + humStep * humidifierReduction;
    run.hum = Math.max(0, Math.min(100, run.hum));

    // ---- スプラウトちゃん:栽培中、温度または湿度を自動で最適値に近づける ----
    // 1ゲーム内時間につき0.2×Lv分近づく(連続的な変化として毎tickぶんだけ適用)
    const sproutChanLv = eq.sproutchan || 0;
    const sproutChanTarget = Game.state.sproutChanTarget;
    if (sproutChanLv > 0 && sproutChanTarget) {
      const adjustPerHour = getSproutChanAdjustPerHour(sproutChanLv);
      const step = adjustPerHour * gameHoursDelta;
      const assistsTemp = sproutChanTarget === "temp" || sproutChanTarget === "both";
      const assistsHum = sproutChanTarget === "humidity" || sproutChanTarget === "both";

      if (assistsTemp) {
        const diff = 20.0 - run.temp;
        run.temp += Math.abs(diff) <= step ? diff : (diff > 0 ? step : -step);
      }
      if (assistsHum) {
        const diff = 92.0 - run.hum;
        run.hum += Math.abs(diff) <= step ? diff : (diff > 0 ? step : -step);
      }
    }

    // ---- ランプ判定 & 赤継続時間 ----
    const tempLamp = getTempLamp(run.temp);
    const humLamp = getHumidityLamp(run.hum);

    const tempJustTurnedRed = tempLamp === "red" && run.redTempSeconds === 0;
    const humJustTurnedRed = humLamp === "red" && run.redHumSeconds === 0;
    if (tempJustTurnedRed || humJustTurnedRed) AudioManager.playSE("warning");

    if (tempLamp === "red") run.redTempSeconds += realSeconds; else run.redTempSeconds = 0;
    if (humLamp === "red") run.redHumSeconds += realSeconds; else run.redHumSeconds = 0;

    if (run.redTempSeconds >= GAME_CONFIG.DANGER_LAMP_TOLERANCE_SECONDS) {
      this.triggerBadEnd(run.temp >= 28 ? "salamander" : "blizzard");
      return false;
    }
    if (run.redHumSeconds >= GAME_CONFIG.DANGER_LAMP_TOLERANCE_SECONDS) {
      this.triggerBadEnd(run.hum < 87 ? "mummy" : "dorozaemon");
      return false;
    }

    // ---- 1時間ごとのイベント(スコア加算・菌カビ抽選) ----
    if (newHourFloor > prevHourFloor) {
      const hoursPassedCount = newHourFloor - prevHourFloor;
      for (let i = 0; i < hoursPassedCount; i++) {
        run.scoreTemp += LAMP_SCORE_RATE[tempLamp];
        run.scoreHum += LAMP_SCORE_RATE[humLamp];

        // 衛生スコア:菌・カビ1匹につき上昇幅-25%、4匹以上で完全に停止
        const cleanGainMultiplier = Math.max(0, 1 - run.pests.length * 0.25);
        run.scoreClean += LAMP_SCORE_RATE.green * cleanGainMultiplier;

        this.rollPestSpawn(run, humLamp);
        const currentHour = prevHourFloor + i + 1;
        if (currentHour % 2 === 0) this.rollFairySpawn(run); // 2時間に1回だけ抽選

        // アクシデント発生抽選(条件を満たしていて、まだ発生中でない場合のみ)
        if (timeOfDay.id === "night" && run.tropicalNightTimer <= 0) {
          const accident = ACCIDENT_LIST.find((a) => a.id === "tropicalnight");
          if (Math.random() < accident.hourlyChance) {
            run.tropicalNightTimer = accident.durationHours[0] + Math.random() * (accident.durationHours[1] - accident.durationHours[0]);
          }
        }
        if (weather.id === "rain" && run.heavyRainTimer <= 0) {
          const accident = ACCIDENT_LIST.find((a) => a.id === "heavyrain");
          if (Math.random() < accident.hourlyChance) {
            run.heavyRainTimer = accident.durationHours[0] + Math.random() * (accident.durationHours[1] - accident.durationHours[0]);
          }
        }
      }
      this.syncPestElements();
      this.syncFairyElements();
    }

    // ---- 終了判定 ----
    if (run.gameHoursElapsed >= GAME_CONFIG.GAME_HOURS_PER_CYCLE) {
      this.finishGrowing();
      return false;
    }

    return true;
  },

  rollPestSpawn(run, humLamp) {
    const eq = Game.state.equipmentLevels;
    const airLv = eq.airpurifier || 0;
    const seed = SEED_TIERS.find((s) => s.id === run.seedId);
    const difficulty = (seed && seed.difficulty) || 1;

    const airPurifierReduction = 1 - Math.min(1, getTieredEquipmentValue(airLv, 5) / 100);
    let bacteriaRate = (BACTERIA_SPAWN_RATE * difficulty) * airPurifierReduction;
    let moldRate = (MOLD_SPAWN_RATE_BY_HUMIDITY_LAMP[humLamp] * difficulty) * airPurifierReduction;

    if (this.isItemActive("sanitizer", run)) {
      bacteriaRate *= 0.5;
      moldRate *= 0.5;
    }
    bacteriaRate = Math.max(0, bacteriaRate);
    moldRate = Math.max(0, moldRate);

    const spawnOne = (type) => {
      let sizePool = PEST_SIZES;
      if (this.isItemActive("antibacsheet", run)) {
        // Sサイズに偏らせる(簡易実装:重み付け)
        sizePool = [
          { id: "L", taps: 15, weight: 1 },
          { id: "M", taps: 10, weight: 2 },
          { id: "S", taps: 5, weight: 4 },
        ];
      }
      const totalWeight = sizePool.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * totalWeight;
      let chosen = sizePool[0];
      for (const p of sizePool) {
        if (r < p.weight) { chosen = p; break; }
        r -= p.weight;
      }
      run.pestIdCounter++;
      run.pests.push({
        id: run.pestIdCounter,
        type,
        size: chosen.id,
        tapsRemaining: chosen.taps,
        tapsTotal: chosen.taps,
        x: 10 + Math.random() * 70,
        y: 10 + Math.random() * 60,
      });
    };

    if (Math.random() < bacteriaRate) spawnOne("bacteria");
    if (Math.random() < moldRate) spawnOne("mold");

    if (run.pests.length >= 6) {
      this.triggerBadEnd("zombie");
    }
  },

  // もやしの妖精:1時間あたり3%の確率で出現(L/M/Sは均等抽選)
  rollFairySpawn(run) {
    if (Math.random() >= FAIRY_SPAWN_CHANCE_PER_HOUR) return;
    const totalWeight = FAIRY_SIZES.reduce((s, f) => s + f.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = FAIRY_SIZES[0];
    for (const f of FAIRY_SIZES) {
      if (r < f.weight) { chosen = f; break; }
      r -= f.weight;
    }
    run.fairyIdCounter++;
    run.fairies.push({
      id: run.fairyIdCounter,
      size: chosen.id,
      scoreBonusPercent: chosen.scoreBonusPercent,
      x: 10 + Math.random() * 70,
      y: 10 + Math.random() * 60,
      spawnedAtMs: Date.now(), // 出現時刻(3秒で自動消滅させるため)
    });
  },

  tapFairy(fairyId) {
    const run = Game.state.currentRun;
    if (!run) return;
    const fairy = run.fairies.find((f) => f.id === fairyId);
    if (!fairy) return;
    run.fairyBonusPercent += fairy.scoreBonusPercent;
    run.fairies = run.fairies.filter((f) => f.id !== fairyId);
    Game.state.totalFairiesCaught = (Game.state.totalFairiesCaught || 0) + 1;
    const el = this.fairyElements[fairyId];
    if (el) { el.remove(); delete this.fairyElements[fairyId]; }
    this.persistAutosave();
  },

  tapPest(pestId) {
    const run = Game.state.currentRun;
    if (!run) return;
    const pest = run.pests.find((p) => p.id === pestId);
    if (!pest) return;
    pest.tapsRemaining--;
    if (pest.tapsRemaining <= 0) {
      run.pests = run.pests.filter((p) => p.id !== pestId);
      const el = this.pestElements[pestId];
      if (el) { el.remove(); delete this.pestElements[pestId]; }
    } else {
      this.updatePestBar(pest);
    }
  },

  cycleSpeed() {
    this.speedMultiplier = this.speedMultiplier >= 3 ? 1 : this.speedMultiplier + 1;
    this.renderSpeedButton();
  },

  renderSpeedButton() {
    const btn = document.getElementById("btn-speed");
    if (btn) btn.textContent = `×${this.speedMultiplier}`;
  },

  renderSproutChanUI() {
    const lv = Game.state.equipmentLevels.sproutchan || 0;
    const target = Game.state.sproutChanTarget;
    const active = lv > 0 && target;
    const assistsTemp = active && (target === "temp" || target === "both");
    const assistsHum = active && (target === "humidity" || target === "both");

    document.getElementById("sprout-badge-temp").classList.toggle("hidden", !assistsTemp);
    document.getElementById("sprout-badge-hum").classList.toggle("hidden", !assistsHum);
    // 切り替えボタンは、スプラウトちゃんがLv1以上(=実際に稼働できる状態)の時だけ表示する
    document.getElementById("btn-sproutchan-switch").classList.toggle("hidden", lv <= 0);
  },

  openSproutChanQuickSwitch() {
    const lv = Game.state.equipmentLevels.sproutchan || 0;
    if (lv <= 0) return;
    const target = Game.state.sproutChanTarget;
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.innerHTML = `
      <div class="popup-box">
        <button class="popup-close">×</button>
        <div class="popup-title">もやし？のお手伝い先</div>
        <div class="settings-row">
          <button class="btn ${target === "temp" ? "btn-primary" : "btn-secondary"}" id="qs-temp-btn">温度</button>
          <button class="btn ${target === "humidity" ? "btn-primary" : "btn-secondary"}" id="qs-hum-btn">湿度</button>
          ${lv >= 5 ? `<button class="btn ${target === "both" ? "btn-primary" : "btn-secondary"}" id="qs-both-btn">両方(Lv5)</button>` : ""}
        </div>
      </div>
    `;
    document.getElementById("screen-growing").appendChild(overlay);
    overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
    const choose = (value) => {
      Game.state.sproutChanTarget = value;
      saveState(Game.state);
      overlay.remove();
      this.renderSproutChanUI();
    };
    overlay.querySelector("#qs-temp-btn").addEventListener("click", () => choose("temp"));
    overlay.querySelector("#qs-hum-btn").addEventListener("click", () => choose("humidity"));
    const bothBtn = overlay.querySelector("#qs-both-btn");
    if (bothBtn) bothBtn.addEventListener("click", () => choose("both"));
  },

  discard() {
    const confirmed = confirm("栽培をリタイアして準備に戻ります。使用した種は失われます。よろしいですか?");
    if (!confirmed) return;
    this.stop();
    // バッドエンドと同様、種は失うが所持金は減らない
    Game.state.currentRun = null;
    saveState(Game.state);
    showScreen("prep");
    PrepScreen.refresh();
  },

  // 栽培アイテムのクールタイムが明けているか(24ゲーム内時間に1回まで)
  isGrowingItemOnCooldown(run) {
    if (run.lastGrowingItemUseHour === null || run.lastGrowingItemUseHour === undefined) return false;
    return run.gameHoursElapsed - run.lastGrowingItemUseHour < 24;
  },

  openGrowingItemPopup() {
    const run = Game.state.currentRun;
    if (!run) return;
    const btn = document.getElementById("btn-use-growing-item");
    if (this.isGrowingItemOnCooldown(run)) {
      const remaining = Math.ceil(24 - (run.gameHoursElapsed - run.lastGrowingItemUseHour));
      alert(`栽培アイテムはクールタイム中です(あと約${remaining}時間)`);
      return;
    }

    const owned = Game.state.itemInventory;
    const availableItems = ITEM_LIST.filter((it) => it.phase === "growing" && (owned[it.id] || 0) > 0);
    if (availableItems.length === 0) {
      alert("所持している栽培アイテムがありません");
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.innerHTML = `
      <div class="popup-box">
        <button class="popup-close">×</button>
        <div class="popup-title">栽培アイテムを使用</div>
        <div class="scroll-list" style="max-height:300px;">
          ${availableItems
            .map(
              (it) => `
            <div class="list-item" data-item="${it.id}">
              <span class="name">${it.name}</span>
              <span class="owned">所持:${owned[it.id]}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;
    document.getElementById("screen-growing").appendChild(overlay);
    overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
    overlay.querySelectorAll(".list-item").forEach((row) => {
      row.addEventListener("click", () => {
        this.useGrowingItem(row.dataset.item);
        overlay.remove();
      });
    });
  },

  useGrowingItem(itemId) {
    const run = Game.state.currentRun;
    if (!run) return;
    const item = ITEM_LIST.find((i) => i.id === itemId);
    if (!item) return;
    if ((Game.state.itemInventory[itemId] || 0) <= 0) return;

    Game.state.itemInventory[itemId] -= 1;
    run.lastGrowingItemUseHour = run.gameHoursElapsed;

    if (item.duration === "即時") {
      // 万能消毒液など:発生済みの菌・カビを即座に全消し
      run.pests = [];
      this.syncPestElements();
    } else {
      const endHour = item.duration === "全期間" ? Infinity : run.gameHoursElapsed + item.duration;
      run.activeGrowingItems.push({ id: itemId, startHour: run.gameHoursElapsed, endHour });
    }

    saveState(Game.state);
    this.persistAutosave();
    this.renderGrowingItemButton();
  },

  renderGrowingItemButton() {
    const run = Game.state.currentRun;
    if (!run) return;
    const btn = document.getElementById("btn-use-growing-item");
    const onCooldown = this.isGrowingItemOnCooldown(run);
    btn.disabled = onCooldown;
    if (onCooldown) {
      const remaining = Math.ceil(24 - (run.gameHoursElapsed - run.lastGrowingItemUseHour));
      btn.textContent = `栽培アイテムを使用(あと${remaining}時間)`;
    } else {
      btn.textContent = "栽培アイテムを使用";
    }
  },

  triggerBadEnd(badEndId) {
    this.stop();
    const badEnd = BAD_ENDS[badEndId];
    const run = Game.state.currentRun;
    // その周の種を失う(所持金は減らない)
    Game.state.currentRun = null;
    if (!Game.state.badEndsSeen) Game.state.badEndsSeen = {};
    Game.state.badEndsSeen[badEndId] = true;
    saveState(Game.state);

    document.getElementById("badend-illust").innerHTML = BADEND_ILLUSTRATIONS[badEndId] || "";
    document.getElementById("badend-name").textContent = badEnd.name;
    document.getElementById("badend-message").textContent = badEnd.message || `原因:${badEnd.condition}`;
    showScreen("badend");
    checkTitleUnlocks();
  },

  finishGrowing() {
    // 「栽培終了」バナーを出している間は時間を止める
    // (自動保存は出荷画面に移るまで残しておき、この間にリロードしても終了処理をやり直せるようにする)
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.persistAutosave();
    this.showBanner("栽培終了!", () => {
      this.stop();
      showScreen("shipping");
      ShippingScreen.calculateAndShow(Game.state.currentRun);
    });
  },

  // ---------- 描画 ----------
  renderAll() {
    this.renderGauges();
    this.renderScores();
    this.renderStatus();
    this.renderTime();
    this.renderGrowingItemButton();
    this.renderGrowthStage();
    this.renderSproutChanUI();
  },

  // 12時間ごとに成長段階のイラストを切り替える(全14段階)
  renderGrowthStage() {
    const run = Game.state.currentRun;
    if (!run) return;
    const stage = Math.min(14, Math.max(1, Math.floor(run.gameHoursElapsed / 12) + 1));
    if (this.currentGrowthStage === stage) return; // 変化がなければ何もしない(無駄なDOM更新を避ける)
    this.currentGrowthStage = stage;
    const stageStr = String(stage).padStart(2, "0");
    const img = document.getElementById("growing-pot-illust");
    if (img) img.src = `assets/growth/stage_${stageStr}.jpg`;
  },

  renderGauges() {
    const run = Game.state.currentRun;
    if (!run) return;
    const tempLamp = getTempLamp(run.temp);
    const humLamp = getHumidityLamp(run.hum);
    document.getElementById("temp-value").textContent = `${run.temp.toFixed(1)}℃`;
    document.getElementById("hum-value").textContent = `${run.hum.toFixed(1)}%`;
    const tempLampEl = document.getElementById("temp-lamp");
    const humLampEl = document.getElementById("hum-lamp");
    tempLampEl.className = `lamp lamp-${tempLamp}`;
    humLampEl.className = `lamp lamp-${humLamp}`;
  },

  // pests配列とDOMの差分だけを更新する(タップ中に要素が作り直されてタップが外れるのを防ぐ)
  syncPestElements() {
    const run = Game.state.currentRun;
    if (!run) return;
    const layer = document.getElementById("pest-layer");
    const currentIds = new Set(run.pests.map((p) => p.id));

    // 消えた菌・カビの要素を削除
    Object.keys(this.pestElements).forEach((idStr) => {
      const id = Number(idStr);
      if (!currentIds.has(id)) {
        this.pestElements[id].remove();
        delete this.pestElements[id];
      }
    });

    // 新しく発生した菌・カビの要素を追加
    run.pests.forEach((pest) => {
      if (this.pestElements[pest.id]) return; // 既存のものは触らない
      const el = document.createElement("div");
      el.className = "pest";
      el.style.left = pest.x + "%";
      el.style.top = pest.y + "%";
      const icon = PEST_ICONS[pest.type];
      const size = pest.size === "L" ? 32 : pest.size === "M" ? 24 : 16;
      el.innerHTML = `
        <div style="width:${size}px;height:${size}px;">${icon}</div>
        <div class="pest-bar-bg"><div class="pest-bar-fill" style="width:100%"></div></div>
      `;
      el.addEventListener("click", () => this.tapPest(pest.id));
      layer.appendChild(el);
      this.pestElements[pest.id] = el;
    });
  },

  // fairies配列とDOMの差分だけを更新する
  syncFairyElements() {
    const run = Game.state.currentRun;
    if (!run) return;
    const layer = document.getElementById("fairy-layer");
    const currentIds = new Set(run.fairies.map((f) => f.id));

    Object.keys(this.fairyElements).forEach((idStr) => {
      const id = Number(idStr);
      if (!currentIds.has(id)) {
        this.fairyElements[id].remove();
        delete this.fairyElements[id];
      }
    });

    run.fairies.forEach((fairy) => {
      if (this.fairyElements[fairy.id]) return;
      const el = document.createElement("div");
      el.className = "fairy";
      el.style.left = fairy.x + "%";
      el.style.top = fairy.y + "%";
      const size = fairy.size === "L" ? 44 : fairy.size === "M" ? 32 : 22;
      el.innerHTML = `<img src="assets/moyashi_fairy.png" style="width:${size}px;height:${Math.round(size * 0.958)}px;" alt="もやしの妖精" />`;
      el.addEventListener("click", () => this.tapFairy(fairy.id));
      layer.appendChild(el);
      this.fairyElements[fairy.id] = el;
    });
  },

  // タップ時、該当の菌・カビのゲージだけを更新する(全体は作り直さない)
  updatePestBar(pest) {
    const el = this.pestElements[pest.id];
    if (!el) return;
    const pct = (pest.tapsRemaining / pest.tapsTotal) * 100;
    const bar = el.querySelector(".pest-bar-fill");
    if (bar) bar.style.width = pct + "%";
  },

  renderScores() {
    const run = Game.state.currentRun;
    if (!run) return;
    document.getElementById("score-temp").textContent = Math.floor(run.scoreTemp);
    document.getElementById("score-hum").textContent = Math.floor(run.scoreHum);
    document.getElementById("score-clean").textContent = Math.floor(run.scoreClean);
  },

  renderStatus() {
    document.getElementById("growing-gold").textContent = formatNumber(Game.state.gold);
  },

  renderTime() {
    const run = Game.state.currentRun;
    if (!run) return;
    const day = Math.floor(run.gameHoursElapsed / 24) + 1;
    const hour = Math.floor(run.gameHoursElapsed % 24);
    document.getElementById("growing-daytime").textContent = `${day}日目 ${hour}時`;

    if (run.weatherId) {
      const weather = WEATHER_LIST.find((w) => w.id === run.weatherId);
      const timeOfDay = getTimeOfDay(hour);
      let text = `${timeOfDay.name}　${weather.name}`;
      if (run.tropicalNightTimer > 0) text += "　熱帯夜";
      if (run.heavyRainTimer > 0) text += "　集中豪雨";
      document.getElementById("growing-status").textContent = text;
    }
  },
};
