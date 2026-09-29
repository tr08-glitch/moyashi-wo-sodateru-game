# もやしを育てるゲーム

もやし育成ローグライク(スマホ縦画面向け、単一プレイヤー)。
セーブデータはブラウザの localStorage に保存されます(サーバー不要)。

## 現在の実装状況(初版)

- タイトル → 準備 → 種まき → 栽培 → 出荷 の一連の流れが遊べます
- 準備フェイズ:種購入・設備強化・アイテム購入(個数買い対応)
- 種まきフェイズ:種選択・アイテム使用(3つまで)
- 栽培フェイズ:温度/湿度の手動調整(タップ0.1/長押し連続)、信号機ランプ、菌・カビのタップ除去、バッドエンド判定(サラマンダー/ブリザード/ミイラ/土左衛門/ゾンビ/寂しさ)
- 出荷フェイズ:TP/HP/CP×スコア×設備補正の計算式、ランク・称号・獲得G表示

### 未実装・今後の調整ポイント
- もやしの成長イラスト(12時間ごと、計14枚)は仮表示(絵文字)のまま。ChatGPT等で素材を用意後に差し替え
- アイテムの効果の一部(抗菌シートのサイズ偏りなど)は簡易実装。プレイテストして数値調整が必要
- 種のTP/HP/CPと各種価格はすべて叩き台の数値。プレイして調整してください
- タイトル画面・種まき画面の鉢イラストも絵文字の仮表示
- 「もやし?の種」(ランダム特殊枠)は未実装

## ローカルで動かす

ビルド不要の素のHTML/CSS/JSです。ブラウザで `index.html` を直接開くか、
簡易サーバーを立てて確認してください。

```bash
# 例: Pythonの簡易サーバー
python3 -m http.server 8000
# → http://localhost:8000 をスマホ幅表示(ブラウザの検証ツールでスマホ表示に切替)で開く
```

## GitHubへの登録

```bash
cd moyashi-wo-sodateru-game
git init
git add .
git commit -m "初版:タイトル〜出荷の一連の流れを実装"
git branch -M main
git remote add origin https://github.com/tr08-glitch/moyashi-wo-sodateru-game.git
git push -u origin main
```

## Renderへのデプロイ(Static Site)

1. Renderのダッシュボードで **New +** → **Static Site** を選択
2. 上記GitHubリポジトリ(`tr08-glitch/moyashi-wo-sodateru-game`)を接続
3. 設定:
   - **Build Command**: (空欄のままでOK。ビルド不要)
   - **Publish Directory**: `.` (リポジトリのルート)
4. デプロイすると `moyashi-wo-sodateru-game.onrender.com` のようなURLが発行されます

## ファイル構成

```
moyashi-wo-sodateru-game/
├── index.html          全画面のDOM構造
├── css/style.css        スタイル(スマホ縦画面前提)
├── js/
│   ├── data.js           定数データ(温度湿度閾値・種・設備・アイテム・ランク)
│   ├── state.js           セーブデータ管理(localStorage)
│   ├── main.js            画面切り替え・起動時の離脱チェック
│   └── screens/
│       ├── title.js        タイトル画面
│       ├── prep.js         準備フェイズ
│       ├── sowing.js       種まきフェイズ
│       ├── growing.js      栽培フェイズ(コアロジック)
│       └── shipping.js     出荷フェイズ
└── assets/              (今後、成長イラスト等を配置)
```
