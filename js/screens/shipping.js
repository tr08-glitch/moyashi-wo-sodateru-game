// ============================================================
// 出荷フェイズ
// ============================================================

const ShippingScreen = {
  init() {
    document.getElementById("btn-to-prep").addEventListener("click", () => {
      const goToPrep = () => {
        showScreen("prep");
        PrepScreen.refresh();
      };
      // もやし?の種を初めて出荷成功した後は、準備に戻る前にストーリーを1回だけ挟む
      if (Game.state.pendingMysteryStory) {
        Game.state.pendingMysteryStory = false;
        saveState(Game.state);
        StoryScreen.start(STORY_MYSTERY_LINES, goToPrep);
      } else {
        goToPrep();
      }
    });
    document.getElementById("btn-badend-to-prep").addEventListener("click", () => {
      showScreen("prep");
      PrepScreen.refresh();
    });
  },

  calculateAndShow(run) {
    const seed = SEED_TIERS.find((s) => s.id === run.seedId);
    const eq = Game.state.equipmentLevels;

    // もやし?の種は種まき時に抽選済みのランダムステータスを使う
    const effTp = seed.isMystery ? run.mysteryStats.tp : seed.tp;
    const effHp = seed.isMystery ? run.mysteryStats.hp : seed.hp;
    const effCp = seed.isMystery ? run.mysteryStats.cp : seed.cp;

    const tempCorrection = 100 + (eq.comfort || 0) * 5;
    const humCorrection = 100 + (eq.freshness || 0) * 5;
    const cleanCorrection = 100 + (eq.bleach || 0) * 5;

    const tempTotal = effTp * run.scoreTemp * (tempCorrection / 100);
    const humTotal = effHp * run.scoreHum * (humCorrection / 100);
    const cleanTotal = effCp * run.scoreClean * (cleanCorrection / 100);

    let totalScore = tempTotal + humTotal + cleanTotal;

    // アイテム効果(出荷時)
    let itemNote = "";
    if (run.items.includes("omamori")) {
      totalScore *= 1.2;
      itemNote += "もやし大明神のお守り(+20%) ";
    }
    if (run.items.includes("mystery")) {
      const rand = (Math.random() * 0.6 - 0.3); // -30%〜+30%
      totalScore *= 1 + rand;
      itemNote += `謎の液体(${rand >= 0 ? "+" : ""}${Math.round(rand * 100)}%) `;
    }
    if (run.fairyBonusPercent > 0) {
      totalScore *= 1 + run.fairyBonusPercent / 100;
      itemNote += `もやしの妖精(+${run.fairyBonusPercent}%) `;
    }

    totalScore = Math.floor(totalScore);
    const rankInfo = getRankInfo(totalScore);
    const gold = getGoldForScore(totalScore);

    document.getElementById("shipping-seedname").textContent = `使用した種: ${seed.name}`;
    document.getElementById("shipping-calc").innerHTML = `
      <div>TP(${effTp}) × 温度スコア(${Math.floor(run.scoreTemp)}) × 補正(${tempCorrection}%) = ${Math.floor(tempTotal)}</div>
      <div>HP(${effHp}) × 湿度スコア(${Math.floor(run.scoreHum)}) × 補正(${humCorrection}%) = ${Math.floor(humTotal)}</div>
      <div>CP(${effCp}) × 衛生スコア(${Math.floor(run.scoreClean)}) × 補正(${cleanCorrection}%) = ${Math.floor(cleanTotal)}</div>
      ${itemNote ? `<div>アイテム効果: ${itemNote}</div>` : ""}
    `;
    document.getElementById("shipping-total-score").textContent = totalScore;
    document.getElementById("shipping-rank").textContent = rankInfo.rank;
    document.getElementById("shipping-title").textContent = rankInfo.title;
    document.getElementById("shipping-gold").textContent = gold;
    AudioManager.playSE("rank");

    // もやし?の種を無事出荷できた場合、初回だけスプラウトちゃんが登場する
    // 鉢から出てくる絵(sprout_chan_2)→数秒後に出た後の絵(sprout_chan)に切り替わる
    const sproutEl = document.getElementById("shipping-sprout");
    if (seed.isMystery && !Game.state.sproutChanUnlocked) {
      Game.state.sproutChanUnlocked = true; // 設備強化にスプラウトちゃんが解禁される(この演出も以降は出ない)
      Game.state.pendingMysteryStory = true; // 準備に戻る時にストーリーを1回だけ再生する
      sproutEl.classList.remove("hidden");
      sproutEl.innerHTML = `
        <img id="sprout-img" src="assets/sprout_chan_2.jpg" alt="もやし？" />
        <div id="sprout-caption" class="sprout-caption">もやし?の種から…何かが出てきた!</div>
      `;
      setTimeout(() => {
        const img = document.getElementById("sprout-img");
        const caption = document.getElementById("sprout-caption");
        if (img) {
          img.style.opacity = "0";
          setTimeout(() => {
            img.src = "assets/sprout_chan.jpg";
            img.style.opacity = "1";
          }, 300);
        }
        if (caption) caption.textContent = "もやし？が出てきた!";
      }, 1800);
    } else {
      sproutEl.classList.add("hidden");
      sproutEl.innerHTML = "";
    }

    // 報酬反映
    Game.state.gold += gold;
    Game.state.generation += 1;
    Game.state.totalShipments = (Game.state.totalShipments || 0) + 1;
    Game.state.totalGoldEarned = (Game.state.totalGoldEarned || 0) + gold;
    if (rankInfo.rank === "繧ゅｄ縺励ｓ") Game.state.gsAchieved = true;
    if (seed.id === "demonlord") Game.state.hardCleared = true; // ハード帯最上位クリア→インポッシブル解禁
    Game.state.currentRun = null;
    saveState(Game.state);
    checkTitleUnlocks();
  },
};
