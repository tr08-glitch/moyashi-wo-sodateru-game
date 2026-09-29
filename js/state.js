// ============================================================
// セーブデータ管理(ブラウザ内 localStorage、端末ごと)
// ============================================================

const SAVE_KEY = "moyashi_save_v1";

function createInitialState() {
  return {
    generation: 1, // もやし〇世
    gold: 0, // 初期所持金
    seedInventory: { beginner: Infinity }, // 種の在庫(id -> 個数)
    equipmentLevels: {
      aircon: 0,
      comfort: 0,
      humidifier: 0,
      freshness: 0,
      airpurifier: 0,
      bleach: 0,
      sproutchan: 0,
    },
    itemInventory: {}, // アイテムの在庫(id -> 個数)
    sproutChanUnlocked: false, // もやし?の種(ノーマル帯最上位)を出荷成功すると true になる。ハード帯解禁の条件も兼ねる
    sproutChanTarget: null, // "temp" | "humidity" | "both"(Lv5のみ)
    hardCleared: false, // 魔王の種(ハード帯最上位)を出荷成功すると true になる。インポッシブル帯解禁の条件
    // 称号(実績)システム用の累計データ
    totalShipments: 0,
    totalGoldEarned: 0,
    totalFairiesCaught: 0,
    badEndsSeen: {}, // { salamander: true, ... }
    gsAchieved: false,
    unlockedTitles: {}, // { first_shipment: true, ... }
    redeemedCodes: {}, // 使用済みのゲームコード { MOYASHI: true, ... }
    // 進行中の栽培データ(準備フェイズに戻ると null)
    currentRun: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    // Infinity は JSON化できないため復元する
    if (parsed.seedInventory && parsed.seedInventory.beginner === null) {
      parsed.seedInventory.beginner = Infinity;
    }
    return parsed;
  } catch (e) {
    console.error("セーブデータの読み込みに失敗しました", e);
    return createInitialState();
  }
}

function saveState(state) {
  try {
    // Infinity は null に変換してJSON化
    const toSave = JSON.parse(JSON.stringify(state, (key, value) =>
      value === Infinity ? null : value
    ));
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error("セーブデータの保存に失敗しました", e);
    return false;
  }
}

function hasSaveData() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function deleteSaveData() {
  localStorage.removeItem(SAVE_KEY);
}
