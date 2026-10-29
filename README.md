# 競馬予想シミュレーター（無料・初期版）

## 起動方法
1. `index.html` をMacのChrome / Safariで開く。
2. スマホでも使う場合、今のファイルをスマホに送って開くことはできますが、保存データは端末ごとです。共有利用にはHTTPSで公開し、クラウドDBを接続する必要があります。
3. レース管理でレース情報、購入想定額、払戻額を入力。成績に含めるには「結果確定済み」をチェックして保存。
4. データ管理からCSVを出力してバックアップ。

## ファイル構成
- `index.html`: 画面構成
- `style.css`: スマホ対応スタイル
- `app.js`: localStorage保存、登録・編集・削除、集計、CSV入出力、簡易ルールベース予想

## 初期版のデータ設計
1レース=1レコードとしてブラウザ内にJSON配列で保存。項目は `id`, `date`, `venue`, `raceNo`, `raceName`, `course`, `going`, `prediction`, `modelVersion`, `stake`, `payout`, `settled`, `notes`。
本格版では以下のテーブルを推奨:
- `races`: レース基本情報（race_id, date, venue, race_no, race_name, course, going, status）
- `runners`: 出走馬（race_id, horse_no, horse_name, jockey, weight, odds_snapshot）
- `predictions`: 予想スナップショット（race_id, model_version, created_at, picks_json, estimated_probabilities）
- `bets`: 買い目（race_id, bet_type, combination, stake, odds_at_prediction）
- `results`: 確定結果（race_id, finish_order_json, payout_json, confirmed_at）
- `backtest_runs`: 検証条件（period_from, period_to, model_version, created_at, metrics_json）

## 計算ルール
- 的中レース率 = 払戻額 > 0 の確定レース数 ÷ 確定レース数 × 100
- 回収率 = 確定レースの払戻合計 ÷ 購入額合計 × 100
- 収支 = 払戻合計 − 購入額合計
- 未確定レースは集計から除外
- 購入額が0円の場合、回収率は `—` と表示

## 制約
- 外部データ取得、自動更新、学習済み予想AI、クラウド同期は未実装。自動予想タブはオッズと手入力の近走評価を使う透明な簡易スコア方式で、勝率予測ではありません。
- ブラウザのデータ消去や別端末ではローカル保存データを失う可能性があります。定期的にCSVを出力してください。
- このアプリは賭けを実行しません。入力データを使って予想記録と検証を行います。
