# monsuto_rank_tool

Rank experience data is stored in `docs/data/rank_table.csv` as
`rank,cumulative_experience`, without a header.

## Experience estimates after rank 2500

- Rank 2500 → 2501: **51,970,572**, confirmed by the user on 2026-10-14.
- Cumulative experience at rank 3000: **35,903,744,670**, estimated.
- The existing cumulative experience at rank 2500 is **9,918,458,670**.
- Starting at rank 2500, the experience required per rank is multiplied by
  **4 every 500 ranks**. Values before and including rank 2500 are preserved.

For a transition from rank `r` to `r + 1`, where `r >= 2500`:

```text
required_experience = 51,970,572 × 4 ^ floor((r - 2500) / 500)
```

Regenerate the estimated rows in the CSV with:

```sh
python3 scripts/update_rank_table.py
```

The browser uses the CSV through rank 4500 and applies the same rule beyond
the table. If the table is extended, regenerate its estimates with the script.
These future values are estimates, rather than confirmed game data.

## スタミナ計算

- 要塞は1周30、危地・魔境・険所・魔殿は1周27。
- 総消費 = 必要周回数 × 1周消費。還元後必要量 = 必要周回数 ×（消費 − 1周の各還元）。
- 滋養はメインアンテナ20%、サブアンテナ10%、＋はそれぞれ30%・20%。プルダウンで通常・＋・王者（メイン30%・サブ20%）を直接選択します。王者はモンパスプレミアム会員向けの効果です。滋養と王者は重ねず、1つのスポット効果を使用します。
- マルチバック期間の還元は、消費の15%を切り捨てた値 × ゲスト人数。各周の還元端数は切り捨てとして計算します。
- 必要枠数 = ceil(還元後必要量 / 現在ランクの最大スタミナ)。最初の1枠も含む総枠数です。自然回復・自動回復・ランクアップ・会員無料回復などは差し引きません。目標日・目標ランクによって分母は増えません。
- 最大スタミナの参照ランクは3000で打ち止め。ゲーム内の値を直接入力できます。
- `docs/data/stamina_table.csv` は `rank,maximum_stamina`。1500以下は公開表にVer.31.0の+70を反映。1501〜2000は公開推計、2001〜2500は10ランクにつき+1、2501〜3000は同じ増分による推定（3000は1170）です。未確認の推定値は画面にも表示し、実値で修正できます。

確認元：

- クエスト消費: https://game8.jp/monst/73743
- アンテナの変更（Ver.24.0、2022年7月）: https://www.monster-strike.com/news/20220710_2.html
- 現行の滋養とモンパス会員の＋: https://www.monster-strike.com/blog/20181005_1.html
- プレミアム: https://www.monster-strike.com/news/20250807_3.html
- 王者: https://www.monster-strike.com/news/20251106_2.html
- マルチ還元: https://www.monster-strike.com/news/20260227_2.html
- Ver.31.0のスタミナ+70: https://www.monster-strike.com/news/20251010_5.html
- 1500以下: https://zcross.net/monst/monst_rankup/monst-hituyou-keikenchi
- 1501〜2000: https://louis.cloudfree.jp/2025/03/25/monst-rank-1501-to-2000/
