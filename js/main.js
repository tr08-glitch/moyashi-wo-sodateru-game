// ============================================================
// メイン制御
// ============================================================

const Game = {
  state: null,
};

const SCREEN_IDS = ["title", "story", "prep", "sowing", "growing", "badend", "shipping"];

// 数値を桁数そのまま文字列にする(10の21乗以上でも「1e+21」のような指数表記にならないようにする)
function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  return Number(n).toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 0 });
}

function showScreen(id) {
  SCREEN_IDS.forEach((s) => {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== id);
  });
}

// ---- 称号(実績)判定 ----
// 累計データを更新した後に呼び出す。新規解除があれば通知して返す
function checkTitleUnlocks() {
  const s = Game.state;
  if (!s) return [];
  if (!s.unlockedTitles) s.unlockedTitles = {};
  if (!s.badEndsSeen) s.badEndsSeen = {};
  const newlyUnlocked = [];
  TITLE_LIST.forEach((t) => {
    if (!s.unlockedTitles[t.id] && t.check(s)) {
      s.unlockedTitles[t.id] = true;
      newlyUnlocked.push(t);
    }
  });
  if (newlyUnlocked.length > 0) {
    saveState(s);
    newlyUnlocked.forEach((t) => {
      alert(`称号「${t.name}」を獲得しました!\n(${t.desc})`);
    });
  }
  return newlyUnlocked;
}

// 称号一覧ポップアップ(未解除は?表示、解除済みは名前・説明を表示)
function openTitleListPopup(screenId) {
  const container = document.getElementById(screenId);
  if (!container) return;
  const state = Game.state || (hasSaveData() ? loadState() : null);
  const unlocked = (state && state.unlockedTitles) || {};
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.innerHTML = `
    <div class="popup-box">
      <button class="popup-close">×</button>
      <div class="popup-title">称号一覧</div>
      <div class="scroll-list" style="max-height:340px;">
        ${TITLE_LIST.map((t) => {
          const got = !!unlocked[t.id];
          return `
            <div class="list-item">
              <div>
                <span class="name">${got ? t.name : "？？？"}</span>
                <div class="popup-desc" style="margin:2px 0 0;">${got ? t.desc : "未解除"}</div>
              </div>
              ${got ? `<span class="owned">獲得済み</span>` : ""}
            </div>`;
        }).join("")}
      </div>
    </div>
  `;
  container.appendChild(overlay);
  overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
}

// ============================================================
// サウンド(BGM・SE)
// ============================================================
const AUDIO_SETTINGS_KEY = "moyashi_audio_settings_v1";

const BGM_LIST = [
  { id: "bgm1", name: "BGM1", src: "assets/bgm.mp3" },
  { id: "bgm2", name: "BGM2", src: "assets/bgm2.mp3" },
  { id: "bgm3", name: "BGM3", src: "assets/bgm3.mp3" },
  { id: "bgm4", name: "BGM4", src: "assets/bgm4.mp3" },
  { id: "bgm5", name: "BGM5", src: "assets/bgm5.mp3" },
  { id: "bgm6", name: "BGM6", src: "assets/bgm6.mp3" },
];

const AudioManager = {
  bgmAudio: null,
  currentBgmId: null,
  seSources: {
    button: "assets/se_button.mp3",
    rank: "assets/se_rank.mp3",
    warning: "assets/se_warning.mp3",
  },
  settings: {
    bgmVolume: 70,
    seVolume: 70,
    bgmEnabled: { bgm1: true, bgm2: true, bgm3: true, bgm4: true, bgm5: true, bgm6: true },
  }, // 音量は0〜100

  init() {
    this.loadSettings();
    this.bgmAudio = document.getElementById("bgm-audio");
    this.applyBgmVolume();
    this.pickAndLoadRandomBgm();

    this.bgmAudio.addEventListener("ended", () => {
      this.pickAndLoadRandomBgm();
      this.bgmAudio.play().catch(() => {});
    });

    // ブラウザの自動再生制限があるため、最初のタップ/クリックで再生開始する
    const startOnFirstInteraction = () => {
      if (this.bgmAudio) this.bgmAudio.play().catch(() => {});
      document.removeEventListener("click", startOnFirstInteraction);
      document.removeEventListener("touchstart", startOnFirstInteraction);
    };
    document.addEventListener("click", startOnFirstInteraction);
    document.addEventListener("touchstart", startOnFirstInteraction);

    // ボタンタップ時の効果音(全画面共通、イベント委譲で一括対応)
    document.addEventListener("click", (e) => {
      if (e.target.closest("button")) this.playSE("button");
    });
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = {
          ...this.settings,
          ...parsed,
          bgmEnabled: { ...this.settings.bgmEnabled, ...(parsed.bgmEnabled || {}) },
        };
      }
    } catch (e) {
      console.error("音量設定の読み込みに失敗しました", e);
    }
  },

  saveSettings() {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error("音量設定の保存に失敗しました", e);
    }
  },

  applyBgmVolume() {
    if (this.bgmAudio) this.bgmAudio.volume = this.settings.bgmVolume / 100;
  },

  setBgmVolume(v) {
    this.settings.bgmVolume = v;
    this.applyBgmVolume();
    this.saveSettings();
  },

  setSeVolume(v) {
    this.settings.seVolume = v;
    this.saveSettings();
  },

  // ランダム再生に含める/含めないを切り替える
  toggleBgmEnabled(bgmId) {
    const enabledIds = BGM_LIST.map((b) => b.id).filter((id) => this.settings.bgmEnabled[id]);
    // 最後の1曲だけはオフにできないようにする(BGMが完全に鳴らなくなるのを防ぐ)
    if (enabledIds.length === 1 && enabledIds[0] === bgmId) return;
    this.settings.bgmEnabled[bgmId] = !this.settings.bgmEnabled[bgmId];
    this.saveSettings();
  },

  // 有効になっている曲の中からランダムに1曲選んで読み込む(再生はしない)
  pickAndLoadRandomBgm() {
    const enabled = BGM_LIST.filter((b) => this.settings.bgmEnabled[b.id]);
    const pool = enabled.length > 0 ? enabled : BGM_LIST; // 全部オフなら保険で全曲から選ぶ
    // 直前と同じ曲が連続しにくいようにする(2曲以上ある場合)
    let choices = pool;
    if (pool.length > 1) choices = pool.filter((b) => b.id !== this.currentBgmId);
    const picked = choices[Math.floor(Math.random() * choices.length)];
    this.playBgm(picked.id);
  },

  // 指定した曲を直接再生する(設定画面の再生ボタン・自動ローテーション両方から使う)
  playBgm(bgmId) {
    const track = BGM_LIST.find((b) => b.id === bgmId);
    if (!track || !this.bgmAudio) return;
    this.currentBgmId = bgmId;
    this.bgmAudio.src = track.src;
    this.bgmAudio.play().catch(() => {});
  },

  playSE(name) {
    const src = this.seSources[name];
    if (!src) return;
    const a = new Audio(src);
    a.volume = this.settings.seVolume / 100;
    a.play().catch(() => {});
  },
};

// ---- ゲームコード ----
// 戻り値: { ok: true/false, message: 画面に出す文言 }
function redeemGameCode(raw) {
  // 全角の英数字は半角に直し、大文字に統一する
  const code = String(raw || "").normalize("NFKC").trim().toUpperCase();
  if (!code) return { ok: false, message: "コードを入力してください" };
  if (!/^[A-Z0-9]+$/.test(code)) return { ok: false, message: "半角の英字・数字で入力してください" };

  const entry = GAME_CODES[code];
  if (!entry) return { ok: false, message: "無効なコードです" };

  // タイトル画面などゲームを開始していない時は、既存のセーブデータに対して適用する
  const state = Game.state || (hasSaveData() ? loadState() : null);
  if (!state) return { ok: false, message: "セーブデータがありません。ゲームを始めてから入力してください" };

  if (!state.redeemedCodes) state.redeemedCodes = {};
  if (entry.once && state.redeemedCodes[code]) return { ok: false, message: "このコードは使用済みです" };

  const message = entry.apply(state);
  state.redeemedCodes[code] = true;

  // 栽培中は進行中の状態ごと保存できる自動保存へ、それ以外は通常のセーブへ反映する
  if (Game.state && Game.state.currentRun) GrowingScreen.persistAutosave();
  else saveState(state);

  return { ok: true, message };
}

// 設定ポップアップ(BGM音量・SE音量・BGM選択・ゲームコード)。タイトル/種まき/栽培画面の⚙から共通で開く
function openSettingsPopup(screenId) {
  const container = document.getElementById(screenId);
  if (!container) return;
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const render = () => {
    const s = AudioManager.settings;
    overlay.querySelector(".popup-box").innerHTML = `
      <button class="popup-close">×</button>
      <div class="popup-title">設定</div>
      <div class="settings-row">
        <label>BGMの音量</label>
        <input type="range" id="bgm-volume-slider" min="0" max="100" value="${s.bgmVolume}" />
      </div>
      <div class="settings-row">
        <label>SEの音量</label>
        <input type="range" id="se-volume-slider" min="0" max="100" value="${s.seVolume}" />
      </div>
      <div class="popup-desc" style="margin-top:14px;">BGM一覧(再生・ランダム再生に含めるか)</div>
      <div class="bgm-table">
        ${BGM_LIST.map(
          (b) => `
          <div class="bgm-table-row">
            <button class="btn btn-small bgm-play-btn" data-bgm="${b.id}">▶</button>
            <span class="bgm-name">${b.name}</span>
            <label class="bgm-check-label">
              <input type="checkbox" class="bgm-check" data-bgm="${b.id}" ${s.bgmEnabled[b.id] ? "checked" : ""} />
              ランダム再生
            </label>
          </div>`
        ).join("")}
      </div>
      <div class="popup-desc" style="margin-top:14px;">ゲームコード</div>
      <div class="code-row">
        <input id="game-code-input" type="text" maxlength="32" placeholder="半角英数字" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" />
        <button id="game-code-submit" class="btn btn-small btn-primary">送信</button>
      </div>
      <div id="game-code-result" class="code-result"></div>
    `;
    overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#bgm-volume-slider").addEventListener("input", (e) => {
      AudioManager.setBgmVolume(Number(e.target.value));
    });
    overlay.querySelector("#se-volume-slider").addEventListener("input", (e) => {
      AudioManager.setSeVolume(Number(e.target.value));
      AudioManager.playSE("button"); // 音量の変化を確認しやすいよう試し鳴らし
    });
    overlay.querySelectorAll(".bgm-play-btn").forEach((btn) => {
      btn.addEventListener("click", () => AudioManager.playBgm(btn.dataset.bgm));
    });
    overlay.querySelectorAll(".bgm-check").forEach((cb) => {
      cb.addEventListener("change", () => {
        AudioManager.toggleBgmEnabled(cb.dataset.bgm);
        render(); // 最後の1曲はオフにできない制約があるため再描画してチェック状態を同期
      });
    });

    // ゲームコード:入力は半角英数字だけ残す(全角は半角に直す)
    const codeInput = overlay.querySelector("#game-code-input");
    const codeResult = overlay.querySelector("#game-code-result");
    const sanitizeCode = () => {
      codeInput.value = codeInput.value.normalize("NFKC").replace(/[^A-Za-z0-9]/g, "");
    };
    codeInput.addEventListener("input", (e) => { if (!e.isComposing) sanitizeCode(); });
    codeInput.addEventListener("compositionend", sanitizeCode);
    const submitCode = () => {
      sanitizeCode();
      const result = redeemGameCode(codeInput.value);
      codeResult.textContent = result.message;
      codeResult.className = `code-result ${result.ok ? "ok" : "ng"}`;
      if (result.ok) codeInput.value = "";
    };
    overlay.querySelector("#game-code-submit").addEventListener("click", submitCode);
    codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitCode(); });
  };

  overlay.innerHTML = `<div class="popup-box"></div>`;
  container.appendChild(overlay);
  render();
}

function init() {
  AudioManager.init();
  TitleScreen.init();
  StoryScreen.init();
  TutorialOverlay.init();
  PrepScreen.init();
  SowingScreen.init();
  GrowingScreen.init();
  ShippingScreen.init();

  // ---- 栽培中の離脱チェック(5分猶予) ----
  const autosaveRaw = localStorage.getItem(AUTOSAVE_KEY);
  if (autosaveRaw) {
    try {
      const autosave = JSON.parse(autosaveRaw);
      const elapsedMs = Date.now() - autosave.lastActive;
      Game.state = autosave.state;

      if (elapsedMs >= GAME_CONFIG.BAD_END_GRACE_SECONDS * 1000) {
        // 5分以上離脱していた → 寂しさバッドエンド
        Game.state.currentRun = null;
        saveState(Game.state);
        localStorage.removeItem(AUTOSAVE_KEY);
        const badEnd = BAD_ENDS.loneliness;
        document.getElementById("badend-illust").innerHTML = BADEND_ILLUSTRATIONS[badEnd.id] || "";
        document.getElementById("badend-name").textContent = badEnd.name;
        document.getElementById("badend-message").textContent = badEnd.message;
        showScreen("badend");
        return;
      } else if (Game.state.currentRun) {
        // 猶予内 → 栽培フェイズを再開
        showScreen("growing");
        GrowingScreen.start();
        return;
      }
    } catch (e) {
      console.error("autosaveの読み込みに失敗しました", e);
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }

  // ---- 通常起動 ----
  showScreen("title");
}

document.addEventListener("DOMContentLoaded", init);
