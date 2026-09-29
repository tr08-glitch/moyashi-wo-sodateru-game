// ============================================================
// タイトル画面
// ============================================================

const TitleScreen = {
  init() {
    document.getElementById("btn-start").addEventListener("click", () => {
      // New Game:常に新規開始。既存セーブがある場合は確認の上で削除する
      if (hasSaveData()) {
        const confirmed = confirm("セーブデータが存在しますが、本当に新しく始めますか?(元のセーブデータは削除されます)");
        if (!confirmed) return;
        deleteSaveData();
        localStorage.removeItem(AUTOSAVE_KEY);
      }
      Game.state = createInitialState();
      StoryScreen.start(STORY_INTRO_LINES, () => {
        // 準備・種まきを飛ばし、初心者の種でいきなり栽培画面から始める
        Game.state.currentRun = createNewRun("beginner", []);
        saveState(Game.state);
        showScreen("growing");
        // 栽培の進行はまだ始めず、チュートリアル(またはスキップ)の後に「栽培開始」バナー→開始とする
        GrowingScreen.start("deferred");
        // チュートリアルの途中で離脱した場合はタイトルに戻すため、開始直後のautosaveは消しておく
        localStorage.removeItem(AUTOSAVE_KEY);
        const skipTutorial = confirm("チュートリアルをスキップしますか?");
        const startCultivation = () => GrowingScreen.beginTicking();
        if (skipTutorial) {
          startCultivation();
        } else {
          TutorialOverlay.start(startCultivation);
        }
      });
    });

    document.getElementById("btn-load").addEventListener("click", () => {
      if (!hasSaveData()) {
        alert("セーブデータがありません");
        return;
      }
      Game.state = loadState();
      showScreen("prep");
      PrepScreen.refresh();
    });

    document.getElementById("btn-credit").addEventListener("click", () => {
      alert("クレジット\n(準備中)");
    });
    document.getElementById("btn-rule").addEventListener("click", () => {
      alert(
        "ルール概要\n" +
        "・1周=1週間、温度/湿度/衛生を管理してもやしを育てる\n" +
        "・温度15〜25度、湿度90〜95%が適正範囲\n" +
        "・菌やカビが発生したらタップして除去\n" +
        "・管理を怠るとバッドエンドになることがある"
      );
    });

    document.getElementById("btn-titles").addEventListener("click", () => {
      openTitleListPopup("screen-title");
    });
    document.getElementById("btn-settings").addEventListener("click", () => {
      openSettingsPopup("screen-title");
    });

    document.getElementById("btn-delete-save").addEventListener("click", () => {
      if (!hasSaveData()) {
        alert("削除できるセーブデータがありません");
        return;
      }
      const confirmed = confirm("セーブデータを削除します。この操作は取り消せません。本当によろしいですか?");
      if (confirmed) {
        deleteSaveData();
        localStorage.removeItem(AUTOSAVE_KEY);
        alert("セーブデータを削除しました");
      }
    });
  },
};
