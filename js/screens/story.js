// ============================================================
// ストーリー会話(NEW GAME開始時のオープニング)
// ============================================================

// もやし?の種を初めて出荷成功した後に流れるストーリー
const STORY_MYSTERY_LINES = [
  { speaker: "茂野士郎", text: "……まさか、もやし?の種から、あんなのが出てくるとはな。" },
  { speaker: "茂野士郎", text: "こんなことは初めてだ。あいつは一体、何者なんだ……?" },
  { flash: "assets/flashback_girl.jpg", duration: 1200 }, // フラッシュバック(一瞬だけ表示)
  { speaker: "???", text: "隕九※縺ｿ縺ｦ�√♀縺ｨ縺�＆繧�!!" }, // 文字化けはわざと
  { speaker: "茂野士郎", text: "!??...", blackout: true }, // このセリフの後、画面が暗転する
  { speaker: "ナレーション", text: "目を開けるとそこは草原だった。" },
  { speaker: "ナレーション", text: "知らない植物や生き物ばかりだった。" },
  { speaker: "ナレーション", text: "横にはさっきの少女が立っていた。" },
  { speaker: "ナレーション", text: "もやし？が仲間になった。設備強化から、栽培のお手伝いをお願いできるようになるぞ。" },
];

const STORY_INTRO_LINES = [
  { speaker: "???", text: "いつからだったか。俺がもやしを育てるようになったのは。" },
  { speaker: "???", text: "俺の名前は茂野士郎。ただのどこにでもいるサラリーマンさ。" },
  { speaker: "???", text: "いや、だった。" },
  { speaker: "茂野士郎", text: "もやしなんて、これまで何百回も食ってきた。安い、味気ない、脇役の代名詞。そう思っていた。" },
  { speaker: "茂野士郎", text: "だが、違った!" },
  { speaker: "茂野士郎", text: "残業帰りのコンビニで、値引き前のもやし袋をふと手に取った瞬間——俺は雷に打たれた。" },
  { speaker: "茂野士郎", text: "なんだ、これは。この、まっすぐな白さ。この、静かな力強さ。俺は今まで、何を見ていたんだ……。" },
  { speaker: "茂野士郎", text: "気づいたら、会社に辞表を出し、もやしを栽培していた。" },
  { speaker: "茂野士郎", text: "そうだったよな…。" },
  { speaker: "茂野士郎", text: "おっと、そろそろもやし栽培のお時間だ!" },
  { speaker: "茂野士郎", text: "だが後悔はない。俺はこれから、もやしと生きていく。" },
  { speaker: "茂野士郎", text: "それだけだ、今はまだそれだけで十分だ。" },
  { speaker: "ナレーション", text: "さあ、最初のもやしを育ててみよう。" },
];

// セリフ一覧(栽培チュートリアル、初回の栽培画面で表示)
const TUTORIAL_LINES = [
  { speaker: "茂野士郎", text: "よし、まずは基本を教えてやる。今回は初心者の種、気楽にいこう。" },
  { speaker: "茂野士郎", text: "もやし栽培は1周間、つまり1もやし生で7日間だ。現実の2秒がゲーム内の1時間にあたる。", highlight: "#growing-daytime" },
  { speaker: "茂野士郎", text: "まずは温度だ。左のメーター、−/+ボタンをタップすると0.1度ずつ、長押しすると連続で変えられる。", highlight: "#gauge-box-temp" },
  { speaker: "茂野士郎", text: "適温は15〜25度。中でも19〜21度(緑ランプ)が最も理想的だ。青は少しズレてるがまだ大丈夫、黄色は注意、赤は危険信号だぞ。", highlight: "#gauge-box-temp" },
  { speaker: "茂野士郎", text: "赤ランプのまま5秒以上放っておくと、もやしがダメになっちまう。気をつけろ。", highlight: "#gauge-box-temp" },
  { speaker: "茂野士郎", text: "次は湿度だ。操作の仕方は温度と同じ。適湿は90〜95%、91〜93%(緑ランプ)が理想値になる。", highlight: "#gauge-box-hum" },
  { speaker: "茂野士郎", text: "湿度も赤ランプが5秒続くと危険だ。乾燥しすぎても、逆に水っぽくなりすぎてもダメなんだ。", highlight: "#gauge-box-hum" },
  { speaker: "茂野士郎", text: "最後は衛生だ。ほうっておくと、鉢に菌やカビが湧いてくる。見つけたらタップして退治してやれ。", highlight: "#pot-area" },
  { speaker: "茂野士郎", text: "サイズが大きいほどタップ回数が必要だ。放置して同時に何匹も湧かせると、スコアが伸びなくなるし、6匹も溜めるともやしが腐っちまう。", highlight: "#pot-area" },
  { speaker: "茂野士郎", text: "画面上には「時間帯」と「天候」も表示される。夜は気温が下がりやすい、雨の日は湿度が上がりやすい、みたいにな。", highlight: "#growing-status" },
  { speaker: "茂野士郎", text: "たまに「熱帯夜」や「集中豪雨」みたいなアクシデントが起きて、変化がさらに激しくなることもある。表示をよく見て対応しろよ。", highlight: "#growing-status" },
  { speaker: "茂野士郎", text: "ここまでの3つ、温度・湿度・衛生は、それぞれ緑ランプでいる時間が長いほど「温度スコア」「湿度スコア」「衛生スコア」として貯まっていく。", highlight: "#growing-score-panel" },
  { speaker: "茂野士郎", text: "出荷の時には、この3つのスコアに種の性能や設備の補正をかけ合わせて「総合スコア」が決まり、そこからランクと報酬のGが決まる仕組みだ。", highlight: "#growing-score-panel" },
  { speaker: "茂野士郎", text: "画面下の「栽培アイテムを使用」ボタンからは、栽培中いつでもアイテムを使える。温度を安定させたり、菌カビを一掃したりできるやつだ。", highlight: "#btn-use-growing-item" },
  { speaker: "茂野士郎", text: "ただし1回使うと24時間はクールタイムで使えなくなる。ここぞという時に使うといい。", highlight: "#btn-use-growing-item" },
  { speaker: "茂野士郎", text: "右上の「一時停止」を押せば、いつでも操作をひと休みできる。トイレでも行ってこい。", highlight: "#btn-pause" },
  { speaker: "茂野士郎", text: "その隣の「×1」は倍速ボタンだ。押すたびに×2、×3と加速する。", highlight: "#btn-speed" },
  { speaker: "茂野士郎", text: "今時のドパガキにとって、待つという行為は苦痛でしかないからな。特別に倍速ボタンを設置してやったぜ!", highlight: "#btn-speed" },
  { speaker: "茂野士郎", text: "ただし、変化のスピードまで上がっちまうから、油断すると大変なことになるぞ。", highlight: "#btn-speed" },
  { speaker: "茂野士郎", text: "……まあ、御託はこれくらいにしておこう。習うより慣れろだ。" },
  { speaker: "茂野士郎", text: "では実際に、もやしを育ててみよう。" },
];

// 1文字ずつ表示するタイプライター風アニメーションのヘルパー
// (会話画面・チュートリアル画面で共通利用できるよう、都度新しいインスタンスを作れる形にしてある)
function createTypewriter(speedMs) {
  return {
    timer: null,
    charIndex: 0,
    fullText: "",
    targetEl: null,

    start(el, text) {
      this.stop();
      this.targetEl = el;
      this.fullText = text;
      this.charIndex = 0;
      el.textContent = "";
      this.timer = setInterval(() => {
        this.charIndex++;
        el.textContent = this.fullText.slice(0, this.charIndex);
        if (this.charIndex >= this.fullText.length) this.stop();
      }, speedMs);
    },

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    isTyping() {
      return this.timer !== null;
    },

    // アニメーション中にタップされた時、即座に全文を表示する
    complete() {
      if (this.targetEl) this.targetEl.textContent = this.fullText;
      this.stop();
    },
  };
}

const StoryScreen = {
  lines: [],
  lineIndex: 0,
  onFinish: null,
  typewriter: createTypewriter(20),
  flashActive: false,
  flashTimeout: null,

  init() {
    document.getElementById("story-box").addEventListener("click", () => this.advance());
  },

  // 表示するセリフ配列と、会話が終わった後に呼び出すコールバックを渡して開始する
  // セリフ配列には { flash: "画像パス", duration: ミリ秒 } という項目も入れられる
  // (画像を一瞬だけ表示して、タップ不要で次のセリフへ進む=フラッシュバック演出)
  start(lines, onFinish) {
    this.lines = lines;
    this.lineIndex = 0;
    this.onFinish = onFinish;
    // 画像は先に読み込んでおく(表示の瞬間に読み込みが間に合わず、真っ暗になるのを防ぐ)
    lines.forEach((l) => { if (l.flash) new Image().src = l.flash; });
    document.querySelector("#screen-story .story-bg").classList.remove("blackout");
    showScreen("story");
    this.render();
  },

  advance() {
    if (this.flashActive) return; // フラッシュ中のタップは無視する
    // アニメーション中のタップは、まず全文表示だけ行う(次のセリフには進まない)
    if (this.typewriter.isTyping()) {
      this.typewriter.complete();
      return;
    }
    this.next();
  },

  next() {
    // 今抜けるセリフに blackout 指定があれば、画面を暗転させる(以降のセリフはこの暗転背景のまま続く)
    const leaving = this.lines[this.lineIndex];
    if (leaving && leaving.blackout) {
      document.querySelector("#screen-story .story-bg").classList.add("blackout");
    }
    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      const callback = this.onFinish;
      this.onFinish = null;
      if (callback) callback();
      return;
    }
    this.render();
  },

  render() {
    const line = this.lines[this.lineIndex];
    if (!line) return;
    if (line.flash) {
      this.playFlash(line);
      return;
    }
    document.getElementById("story-speaker").textContent = line.speaker;
    this.typewriter.start(document.getElementById("story-text"), line.text);
  },

  // フラッシュバック直前に一瞬VHSノイズを挟んでから、画像を一瞬だけ全画面に表示する
  // 終わったら自動で次のセリフへ進む
  playFlash(line) {
    const ms = line.duration || 1200;
    const noiseMs = 350;
    const overlay = document.getElementById("story-flash");
    overlay.querySelector("img").src = line.flash;
    overlay.classList.remove("hidden");
    overlay.classList.add("noise");
    this.flashActive = true;
    clearTimeout(this.flashTimeout);
    this.flashTimeout = setTimeout(() => {
      overlay.classList.remove("noise");
      this.flashTimeout = setTimeout(() => {
        overlay.classList.add("hidden");
        this.flashActive = false;
        this.next();
      }, ms);
    }, noiseMs);
  },
};

// 栽培画面に重ねて表示するチュートリアル会話(画面遷移はせず、栽培画面の上にオーバーレイする)
const TutorialOverlay = {
  lineIndex: 0,
  onFinish: null,
  typewriter: createTypewriter(20),
  highlightedEl: null,

  init() {
    document.getElementById("tutorial-box").addEventListener("click", () => this.advance());
  },

  start(onFinish) {
    this.lineIndex = 0;
    this.onFinish = onFinish;
    document.getElementById("tutorial-overlay").classList.remove("hidden");
    this.render();
  },

  advance() {
    if (this.typewriter.isTyping()) {
      this.typewriter.complete();
      return;
    }
    this.lineIndex++;
    if (this.lineIndex >= TUTORIAL_LINES.length) {
      document.getElementById("tutorial-overlay").classList.add("hidden");
      this.clearHighlight();
      const callback = this.onFinish;
      this.onFinish = null;
      if (callback) callback();
      return;
    }
    this.render();
  },

  clearHighlight() {
    if (this.highlightedEl) this.highlightedEl.classList.remove("tutorial-highlight");
    this.highlightedEl = null;
  },

  render() {
    const line = TUTORIAL_LINES[this.lineIndex];
    if (!line) return;
    const overlay = document.getElementById("tutorial-overlay");
    const box = document.getElementById("tutorial-box");
    const textEl = document.getElementById("tutorial-text");
    document.getElementById("tutorial-speaker").textContent = line.speaker;

    // 文字送りの途中でボックスが伸びて位置がズレないよう、全文を入れた時の高さを先に測って固定しておく
    overlay.classList.remove("tutorial-top");
    box.style.minHeight = "";
    textEl.textContent = line.text;
    box.style.minHeight = box.offsetHeight + "px";

    this.clearHighlight();
    let target = null;
    if (line.highlight) {
      target = document.querySelector(line.highlight);
      if (target) {
        target.classList.add("tutorial-highlight");
        this.highlightedEl = target;
        target.scrollIntoView({ block: "nearest" });
      }
    }

    // 説明対象が会話ボックス(下側表示)と重なる位置にある場合は、会話を上側に表示する
    if (target) {
      const b = box.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      if (r.bottom > b.top && r.top < b.bottom) overlay.classList.add("tutorial-top");
    }

    this.typewriter.start(textEl, line.text);
  },
};
