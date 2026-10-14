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
