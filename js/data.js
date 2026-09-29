// ============================================================
// もやしを育てるゲーム - データ定義
// ============================================================

const GAME_CONFIG = {
  // 現実時間2秒 = ゲーム内1時間
  REAL_SECONDS_PER_GAME_HOUR: 2,
  GAME_HOURS_PER_CYCLE: 24 * 7, // 1週間 = 168時間
  BAD_END_GRACE_SECONDS: 300, // アプリ離脱の猶予(5分)
  DANGER_LAMP_TOLERANCE_SECONDS: 5, // 赤ランプ継続でバッドエンドになるまでの秒数
};

// ---------- 温度ランプ ----------
// 0.1度単位。適温15〜25度。
function getTempLamp(temp) {
  if (temp >= 19 && temp < 21) return "green";
  if ((temp >= 15 && temp < 19) || (temp >= 21 && temp < 25)) return "blue";
  if ((temp >= 12 && temp < 15) || (temp >= 25 && temp < 28)) return "yellow";
  return "red"; // temp < 12 || temp >= 28
}

// ---------- 湿度ランプ ----------
// 0.1%単位。適湿90〜95%。
function getHumidityLamp(hum) {
  if (hum >= 91 && hum < 93) return "green";
  if ((hum >= 89 && hum < 91) || (hum >= 93 && hum < 95)) return "blue";
  if ((hum >= 87 && hum < 89) || (hum >= 95 && hum < 97)) return "yellow";
  return "red"; // hum < 87 || hum >= 97
}

// ---------- スコア加算レート(ランプ色ごと、1時間あたりの目安) ----------
// 緑にいる時間が長いほど高スコア。素点は下記を基準に調整可能。
const LAMP_SCORE_RATE = {
  green: 10,
  blue: 5,
  yellow: 1,
  red: 0,
};

// ---------- 菌・カビ発生率(1時間ごとの判定) ----------
const BACTERIA_SPAWN_RATE = 0.15; // 菌:湿度に関係なく一律15%
const MOLD_SPAWN_RATE_BY_HUMIDITY_LAMP = {
  green: 0.06,
  blue: 0.12,
  yellow: 0.2,
  red: 0.3,
};

// ---------- 菌・カビのサイズ(除去タップ回数、出現確率は均等) ----------
const PEST_SIZES = [
  { id: "L", taps: 15, weight: 1 },
  { id: "M", taps: 10, weight: 1 },
  { id: "S", taps: 5, weight: 1 },
];

// ---------- バッドエンド判定条件 ----------
const BAD_ENDS = {
  salamander: {
    id: "salamander",
    name: "サラマンダーもやし",
    condition: "温度ランプ赤(28度以上)が5秒以上継続",
  },
  blizzard: {
    id: "blizzard",
    name: "ブリザードもやし",
    condition: "温度ランプ赤(12度未満)が5秒以上継続",
  },
  mummy: {
    id: "mummy",
    name: "ミイラもやし",
    condition: "湿度ランプ赤(87%未満)が5秒以上継続",
  },
  dorowaemon: {
    id: "dorozaemon",
    name: "土左衛門もやし",
    condition: "湿度ランプ赤(97%以上)が5秒以上継続",
  },
  zombie: {
    id: "zombie",
    name: "ゾンビもやし",
    condition: "菌・カビが画面上に同時に6匹到達",
  },
  loneliness: {
    id: "loneliness",
    name: "寂しさによる死",
    condition: "アプリを5分以上離脱して復帰",
    message: "もやしはあまりの寂しさに死んでしまった!!",
  },
};

// ---------- 種ティア ----------
// TP/HP/CP はたたき台の数値(プレイテストで調整予定)
// difficulty: 種のランクが上がるほど大きくなる係数。温度・湿度の変動幅と
// 菌・カビの発生率に掛け合わせる(高ランクの種ほど管理が難しくなる)
const SEED_TIERS = [
  // ---------- ノーマル(1〜10) ----------
  { id: "beginner", name: "初心者の種", tp: 1, hp: 1, cp: 1, price: 0, infinite: true, difficulty: 0.5, rank: 1, category: "ノーマル" },
  { id: "homegrown", name: "自家栽培の種", tp: 2, hp: 2, cp: 2, price: 200, difficulty: 0.6, rank: 2, category: "ノーマル" },
  { id: "normal", name: "普通の種", tp: 3, hp: 3, cp: 3, price: 600, difficulty: 0.7, rank: 3, category: "ノーマル" },
  { id: "decent", name: "そこそこの種", tp: 5, hp: 5, cp: 5, price: 1800, difficulty: 0.8, rank: 4, category: "ノーマル" },
  { id: "premium", name: "ちょっと高い種", tp: 8, hp: 8, cp: 8, price: 5400, difficulty: 0.9, rank: 5, category: "ノーマル" },
  { id: "royal", name: "業物の種", tp: 13, hp: 13, cp: 13, price: 16200, difficulty: 1.0, rank: 6, category: "ノーマル" },
  { id: "kingdom", name: "ブランドの種", tp: 20, hp: 20, cp: 20, price: 48600, difficulty: 1.1, rank: 7, category: "ノーマル" },
  { id: "hibrand", name: "ハイブランドの種", tp: 32, hp: 32, cp: 32, price: 145800, difficulty: 1.2, rank: 8, category: "ノーマル" },
  { id: "divine", name: "５つ星の種", tp: 50, hp: 50, cp: 50, price: 437400, difficulty: 1.3, rank: 9, category: "ノーマル" },
  {
    id: "mysteryseed",
    name: "もやし?の種",
    price: 1312200, // ノーマル帯の中では最高額(ハード帯以降には及ばない)
    isMystery: true, // TP/HP/CPは購入後・使用時にランダムで大きくブレる(固定値を持たない)
    randomRange: { min: 10, max: 150 }, // 博打枠
    difficulty: 1.5,
    rank: 10,
    category: "ノーマル",
  },

  // ---------- ハード(11〜20、モンスターモチーフ) ----------
  { id: "slime", name: "スライムの種", tp: 80, hp: 80, cp: 80, price: 3936600, difficulty: 1.6, rank: 11, category: "ハード" },
  { id: "goblin", name: "ゴブリンの種", tp: 125, hp: 125, cp: 125, price: 11809800, difficulty: 1.7, rank: 12, category: "ハード" },
  { id: "skeleton", name: "骸骨の種", tp: 200, hp: 200, cp: 200, price: 35429400, difficulty: 1.8, rank: 13, category: "ハード" },
  { id: "orc", name: "オークの種", tp: 320, hp: 320, cp: 320, price: 106288200, difficulty: 1.9, rank: 14, category: "ハード" },
  { id: "spider", name: "大蜘蛛の種", tp: 500, hp: 500, cp: 500, price: 318864600, difficulty: 2.0, rank: 15, category: "ハード" },
  { id: "golem", name: "ゴーレムの種", tp: 800, hp: 800, cp: 800, price: 956593800, difficulty: 2.1, rank: 16, category: "ハード" },
  { id: "centaur", name: "ケンタウロスの種", tp: 1250, hp: 1250, cp: 1250, price: 2869781400, difficulty: 2.2, rank: 17, category: "ハード" },
  { id: "demonkin", name: "魔族の種", tp: 2000, hp: 2000, cp: 2000, price: 8609344200, difficulty: 2.3, rank: 18, category: "ハード" },
  { id: "blackdragon", name: "黒龍の種", tp: 3200, hp: 3200, cp: 3200, price: 25828032600, difficulty: 2.4, rank: 19, category: "ハード" },
  { id: "demonlord", name: "魔王の種", tp: 5000, hp: 5000, cp: 5000, price: 77484097800, difficulty: 2.5, rank: 20, category: "ハード" },

  // ---------- インポッシブル(21〜30、宇宙・概念モチーフ) ----------
  { id: "origin", name: "起源の種", tp: 8000, hp: 8000, cp: 8000, price: 232452293400, difficulty: 2.6, rank: 21, category: "インポッシブル" },
  { id: "ground", name: "大地の種", tp: 12500, hp: 12500, cp: 12500, price: 697356880200, difficulty: 2.7, rank: 22, category: "インポッシブル" },
  { id: "earth", name: "地球の種", tp: 20000, hp: 20000, cp: 20000, price: 2092070640600, difficulty: 2.8, rank: 23, category: "インポッシブル" },
  { id: "sun", name: "太陽の種", tp: 32000, hp: 32000, cp: 32000, price: 6276211921800, difficulty: 2.9, rank: 24, category: "インポッシブル" },
  { id: "galaxy", name: "銀河の種", tp: 50000, hp: 50000, cp: 50000, price: 18828635765400, difficulty: 3.0, rank: 25, category: "インポッシブル" },
  { id: "universe", name: "宇宙の種", tp: 80000, hp: 80000, cp: 80000, price: 56485907296200, difficulty: 3.1, rank: 26, category: "インポッシブル" },
  { id: "worldfinal", name: "世界の種", tp: 125000, hp: 125000, cp: 125000, price: 169457721888600, difficulty: 3.2, rank: 27, category: "インポッシブル" },
  { id: "gods", name: "神々の種", tp: 200000, hp: 200000, cp: 200000, price: 508373165665800, difficulty: 3.3, rank: 28, category: "インポッシブル" },
  { id: "apocalypse", name: "終末の種", tp: 320000, hp: 320000, cp: 320000, price: 1525119496997400, difficulty: 3.4, rank: 29, category: "インポッシブル" },
  {
    id: "spacetime",
    name: "時空の種",
    tp: 500000,
    hp: 500000,
    cp: 500000,
    price: 4575358490992200,
    difficulty: 3.5,
    rank: 30,
    category: "インポッシブル",
    triggersEnding: true, // これを出荷成功させるとエンディング「初心者??の種?」が発生する
  },
];

// ---------- 設備強化 ----------
// costForLevel(level) : そのレベルに上げるための価格(1始まり)
function equipmentCost(level) {
  return Math.round(200 * Math.pow(1.5, level - 1));
}

const EQUIPMENT_LIST = [
  { id: "aircon", name: "空調Lv", type: "uncapped", effect: "温度の変動幅を小さくする(Lv1〜10は1Lvにつき5%、Lv11〜20は2.5%、Lv21〜30は1.25%…と10Lvごとに効果が半減していく)" },
  { id: "comfort", name: "もやし快適度Lv", type: "uncapped", effect: "温度スコアに+5%/Lvの補正" },
  { id: "humidifier", name: "湿度調節器Lv", type: "uncapped", effect: "湿度の変動幅を小さくする(空調Lvと同じ逓減方式)" },
  { id: "freshness", name: "もやしスッキリ度", type: "uncapped", effect: "湿度スコアに+5%/Lvの補正" },
  { id: "airpurifier", name: "空気清浄機Lv", type: "uncapped", effect: "菌・カビの発生確率を割合で間接的に下げる(空調Lvと同じ逓減方式、Lv1〜10は1Lvにつき5%、Lv11〜20は2.5%…と10Lvごとに半減)" },
  { id: "bleach", name: "もやし漂白度", type: "uncapped", effect: "衛生スコアに+5%/Lvの補正" },
  {
    id: "sproutchan",
    name: "もやし？",
    type: "uncapped", // Lv上限なし
    effect: "栽培中、温度または湿度(Lv5以上で両方同時)を自動で最適値に近づけてくれる。1ゲーム内時間ごとに0.2×Lv分近づく",
    requiresSproutChan: true, // もやし?の種を出荷成功するまでは設備一覧に表示しない
  },
];

// 空調Lv/湿度調節器Lv/空気清浄機Lv共通:Lv1〜10は基準値そのまま、以降20Lvごとに効果が半減していく
// (種の難易度を今後大幅に上げても、高Lvまで育てれば追従できるように上限なし+逓減方式にしている)
function getTieredEquipmentValue(level, baseRatePerLevel) {
  if (level <= 0) return 0;
  let total = 0;
  let remaining = level;
  let tierRate = baseRatePerLevel;
  const tierSize = 10; // 10Lvごとに1Lvあたりの効果が半減していく
  while (remaining > 0) {
    const levelsInTier = Math.min(remaining, tierSize);
    total += levelsInTier * tierRate;
    remaining -= levelsInTier;
    tierRate /= 2;
  }
  return total;
}

// スプラウトちゃんが1ゲーム内時間あたりに理想値へ近づける量(温度は20.0度、湿度は92.0%へ)
function getSproutChanAdjustPerHour(level) {
  if (level <= 0) return 0;
  return 0.2 * level;
}

// ---------- アイテム(叩き台) ----------
const ITEM_LIST = [
  // 栽培フェイズ中に効果を発揮
  { id: "warmsheet", name: "保温シート", phase: "growing", effect: "温度低下速度-30%(12時間の間)", duration: 12, price: 300 },
  { id: "coolgel", name: "冷却ジェル", phase: "growing", effect: "温度上昇速度-30%(12時間の間)", duration: 12, price: 300 },
  { id: "tempstabilizer", name: "温度安定剤", phase: "growing", effect: "温度変動幅-20%(9時間の間)", duration: 9, price: 800 },
  { id: "desiccant", name: "乾燥剤", phase: "growing", effect: "湿度上昇速度-30%(12時間の間)", duration: 12, price: 300 },
  { id: "humidsheet", name: "加湿シート", phase: "growing", effect: "湿度低下速度-30%(12時間の間)", duration: 12, price: 300 },
  { id: "humidstabilizer", name: "湿度安定剤", phase: "growing", effect: "湿度変動幅-20%(9時間の間)", duration: 9, price: 800 },
  { id: "sanitizer", name: "除菌スプレー", phase: "growing", effect: "菌・カビ発生率-50%(12時間の間)", duration: 12, price: 400 },
  { id: "antibacsheet", name: "抗菌シート", phase: "growing", effect: "発生する菌・カビをSサイズ寄りに補正(12時間の間)", duration: 12, price: 500 },
  { id: "cureall", name: "万能消毒液", phase: "growing", effect: "発生済みの菌・カビを全消し(1回)", duration: "即時", price: 600 },
  // 出荷フェイズで効果を発揮
  { id: "omamori", name: "もやし大明神のお守り", phase: "shipping", effect: "最終スコア+20%", price: 4000 },
  // ネタ系
  { id: "bgm", name: "もやし用BGM", phase: "flavor", effect: "効果なし(フレーバーのみ)", price: 50 },
  { id: "mystery", name: "謎の液体", phase: "shipping", effect: "最終スコア±30%(ランダム)", price: 500 },
  { id: "cheer", name: "応援メッセージ", phase: "flavor", effect: "効果なし、種まき時の一言が変わる", price: 50 },
];

// ---------- ランク・称号・獲得G(スコア→連続値の線形補間用アンカー) ----------
// スコア閾値は「もやしの妖精」の期待補正値(+13.4%、出現期待値1.68匹×平均8%)を
// 吸収できるよう、素のスコアラインより約1.134倍に引き上げてある
const RANK_TABLE = [
  { score: 0, rank: "G", title: "圏外", gold: 0 },
  { score: 3400, rank: "F", title: "鼻毛", gold: 150 },
  { score: 6800, rank: "E", title: "ヒョロガリ", gold: 400 },
  { score: 11300, rank: "D", title: "落第もやし", gold: 900 },
  { score: 18100, rank: "C", title: "パンピーもやし", gold: 2000 },
  { score: 28300, rank: "B", title: "やりおるもやし", gold: 4500 },
  { score: 45300, rank: "A", title: "タワマンもやし", gold: 10000 },
  { score: 73700, rank: "S", title: "Sランクハンターもやし", gold: 22000 },
  { score: 113400, rank: "SS", title: "空中浮遊もやし", gold: 50000 },
  { score: 181400, rank: "SSS", title: "天上天下唯我独尊もやし", gold: 120000 },
  { score: 290000, rank: "HS", title: "超越もやし", gold: 276000 },
  { score: 464000, rank: "HSS", title: "次元突破もやし", gold: 635000 },
  { score: 742000, rank: "HSSS", title: "伝説の彼方もやし", gold: 1461000 },
  { score: 1187000, rank: "US", title: "概念崩壊もやし", gold: 3360000 },
  { score: 1899000, rank: "USS", title: "宇宙最強もやし", gold: 7728000 },
  { score: 3038000, rank: "USSS", title: "全知全能もやし", gold: 17774000 },
  { score: 4861000, rank: "GS", title: "創造主もやし", gold: 40880000 },
  { score: 7778000, rank: "GSS", title: "超創造主もやし", gold: 94024000 },
  { score: 12445000, rank: "GSSS", title: "究極神もやし", gold: 216255000 },
  { score: 19912000, rank: "繧ゅｄ縺励ｓ", title: "繧ゅｄ縺励ｓ(判定不能)", gold: 497387000 },
];

function getRankInfo(score) {
  let current = RANK_TABLE[0];
  for (const entry of RANK_TABLE) {
    if (score >= entry.score) current = entry;
  }
  return current;
}

// スコアに応じた獲得G(線形補間)
function getGoldForScore(score) {
  if (score <= RANK_TABLE[0].score) return RANK_TABLE[0].gold;
  const last = RANK_TABLE[RANK_TABLE.length - 1];
  if (score >= last.score) {
    // 最上位を超えたら最後の区間の傾きで延長
    const prev = RANK_TABLE[RANK_TABLE.length - 2];
    const slope = (last.gold - prev.gold) / (last.score - prev.score);
    return Math.round(last.gold + slope * (score - last.score));
  }
  for (let i = 0; i < RANK_TABLE.length - 1; i++) {
    const a = RANK_TABLE[i];
    const b = RANK_TABLE[i + 1];
    if (score >= a.score && score < b.score) {
      const t = (score - a.score) / (b.score - a.score);
      return Math.round(a.gold + t * (b.gold - a.gold));
    }
  }
  return 0;
}

// もやし?の種のTP/HP/CPを抽選する(使用時=種まき時に1回だけ決定)
function rollMysterySeedStats() {
  const seed = SEED_TIERS.find((s) => s.id === "mysteryseed");
  const { min, max } = seed.randomRange;
  const roll = () => Math.round(min + Math.random() * (max - min));
  return { tp: roll(), hp: roll(), cp: roll() };
}

// ---------- 天候(温度・湿度のバイアス、一定時間ごとに切り替わる) ----------
// tempBias/humBias: +が上がりやすい方向、-が下がりやすい方向(強さの目安値)
const WEATHER_LIST = [
  { id: "sunny", name: "晴れ", tempBias: 1.0, humBias: -1.0 },
  { id: "rain", name: "雨", tempBias: -0.5, humBias: 1.0 },
  { id: "snow", name: "雪", tempBias: -1.5, humBias: 1.0 },
];

// ---------- 時間帯(温度のみに影響、ゲーム内時刻から一意に決まる) ----------
const TIME_OF_DAY_LIST = [
  { id: "night", name: "夜", hourFrom: 22, hourTo: 4, tempBias: -1.0 },
  { id: "earlymorning", name: "早朝", hourFrom: 4, hourTo: 7, tempBias: -0.5 },
  { id: "morning", name: "朝", hourFrom: 7, hourTo: 11, tempBias: 0.5 },
  { id: "noon", name: "昼", hourFrom: 11, hourTo: 16, tempBias: 1.5 },
  { id: "evening", name: "夕方", hourFrom: 16, hourTo: 22, tempBias: 0 },
];

function getTimeOfDay(hourOfDay) {
  return TIME_OF_DAY_LIST.find((t) => {
    if (t.hourFrom < t.hourTo) {
      return hourOfDay >= t.hourFrom && hourOfDay < t.hourTo;
    }
    // 夜のように日をまたぐ場合(22時〜翌4時)
    return hourOfDay >= t.hourFrom || hourOfDay < t.hourTo;
  });
}

// ---------- アクシデント(特定の天候/時間帯の時、一定確率で発生する突発事象) ----------
const ACCIDENT_LIST = [
  {
    id: "tropicalnight",
    name: "熱帯夜",
    condition: "夜の間、毎時間一定確率で発生",
    requiresTimeOfDay: "night",
    hourlyChance: 0.15,
    durationHours: [2, 4], // 持続時間の範囲(ゲーム内時間)
    tempBiasBonus: 2.0, // 気温が大幅に上がりやすくなる
  },
  {
    id: "heavyrain",
    name: "集中豪雨",
    condition: "雨の間、毎時間一定確率で発生",
    requiresWeather: "rain",
    hourlyChance: 0.15,
    durationHours: [2, 4],
    humBiasBonus: 2.0, // 湿度が大幅に上がりやすくなる
  },
];

// ---------- もやしの妖精(低確率で出現、タップで消して最終スコアに補正) ----------
const FAIRY_SPAWN_CHANCE_PER_HOUR = 0.02; // 2時間に1回の抽選で2%
const FAIRY_SIZES = [
  { id: "L", scoreBonusPercent: 12, weight: 1 },
  { id: "M", scoreBonusPercent: 8, weight: 1 },
  { id: "S", scoreBonusPercent: 4, weight: 1 },
];

// ---------- 称号(実績システム。ランク判定とは別物、累計実績型+特定条件型) ----------
const TITLE_LIST = [
  { id: "first_shipment", name: "はじめの一歩", desc: "はじめて出荷に成功する", check: (s) => s.totalShipments >= 1 },
  { id: "shipments_10", name: "もやし農家見習い", desc: "累計10回出荷する", check: (s) => s.totalShipments >= 10 },
  { id: "shipments_50", name: "もやしマイスター", desc: "累計50回出荷する", check: (s) => s.totalShipments >= 50 },
  { id: "gold_100k", name: "資産家もやし", desc: "累計獲得100,000G", check: (s) => s.totalGoldEarned >= 100000 },
  { id: "gold_1m", name: "大富豪もやし", desc: "累計獲得1,000,000G", check: (s) => s.totalGoldEarned >= 1000000 },
  { id: "badend_salamander", name: "灰の中から", desc: "サラマンダーもやしを経験する", check: (s) => !!s.badEndsSeen.salamander },
  { id: "badend_blizzard", name: "氷漬けの記憶", desc: "ブリザードもやしを経験する", check: (s) => !!s.badEndsSeen.blizzard },
  { id: "badend_mummy", name: "からっからの記憶", desc: "ミイラもやしを経験する", check: (s) => !!s.badEndsSeen.mummy },
  { id: "badend_dorozaemon", name: "水底の住人", desc: "土左衛門もやしを経験する", check: (s) => !!s.badEndsSeen.dorozaemon },
  { id: "badend_zombie", name: "不衛生の果て", desc: "ゾンビもやしを経験する", check: (s) => !!s.badEndsSeen.zombie },
  { id: "fairy_10", name: "妖精の友", desc: "もやしの妖精を累計10匹捕まえる", check: (s) => s.totalFairiesCaught >= 10 },
  { id: "rank_gs", name: "判定不能への道", desc: "最上位ランク(判定不能)を1回でも達成する", check: (s) => !!s.gsAchieved },
  { id: "mystery_shipped", name: "禁断の種", desc: "もやし?の種を初めて出荷成功させる", check: (s) => !!s.sproutChanUnlocked },
];

// ---------- ゲームコード(設定画面の一番下から入力できる特典コード) ----------
// ・コードは半角英数字のみ。入力は大文字小文字を区別しない(内部では大文字に統一)ので、キーは必ず大文字で書く
// ・once: true → 1つのセーブデータにつき1回だけ使える(配布用) / false → 何度でも使える(テストプレイ用)
// ・apply(state) で特典をstateに反映し、画面に出すメッセージを返す
// ・新しいコードを増やす時は、下に1つ追加するだけでよい
const GAME_CODES = {
  // 配布用のサンプル(リリース記念など)。実際に配る時は好きなコード・内容に書き換える
  MOYASHI: {
    once: true,
    apply(s) {
      s.gold += 10000;
      return "10,000Gを受け取りました!";
    },
  },
  // テストプレイ用:所持金を大量に増やす
  DEVGOLD: {
    once: false,
    apply(s) {
      s.gold += 1000000000;
      return "【テスト用】1,000,000,000Gを受け取りました";
    },
  },
  // テストプレイ用:ハード帯・インポッシブル帯の種とスプラウトちゃんを解禁する
  DEVUNLOCK: {
    once: false,
    apply(s) {
      s.sproutChanUnlocked = true;
      s.hardCleared = true;
      return "【テスト用】ハード・インポッシブル帯の種ともやし？を解禁しました";
    },
  },
  // テストプレイ用:施設レベルを全て1000にし、所持金を1,000,000,000,000,000,000,000G(10の21乗)にする
  TESTGAME: {
    once: false,
    apply(s) {
      EQUIPMENT_LIST.forEach((eq) => { s.equipmentLevels[eq.id] = 1000; });
      s.gold = 1e21;
      return "【テスト用】施設レベルを全て1000に、所持金を1,000,000,000,000,000,000,000Gにしました";
    },
  },
};

// キャラクター
const CHARACTER = {
  name: "茂野もやしろう",
  age: 37,
};
