"""Regenerate estimates after rank 2500, preserving the earlier CSV rows."""

import csv
from pathlib import Path

TABLE = Path(__file__).resolve().parents[1] / "docs/data/rank_table.csv"
ANCHOR_RANK = 2500
CONFIRMED_STEP = 51_970_572
INTERVAL = 500
MULTIPLIER = 4


def main():
    rows = list(csv.reader(TABLE.read_text().splitlines()))
    cumulative = int(rows[ANCHOR_RANK - 1][1])
    step = CONFIRMED_STEP
    for index in range(ANCHOR_RANK, len(rows)):
        rank = index + 1
        if rank > ANCHOR_RANK + 1 and (rank - 1) % INTERVAL == 0:
            step *= MULTIPLIER
        cumulative += step
        rows[index] = [str(rank), str(cumulative)]
    TABLE.write_text("\n".join(",".join(row) for row in rows))


if __name__ == "__main__":
    main()
