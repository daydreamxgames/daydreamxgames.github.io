"""Fetch public Roblox stats for every Day Dream game and write data/stats.json.

Runs weekly in GitHub Actions (.github/workflows/update-stats.yml). Uses only the
Python standard library and Roblox's public, no-login APIs.

Peak CCU (all-time high) is NOT available from Roblox's public API, so it is kept
by hand in data/peaks.json. This script never touches that file.
"""
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PEAKS = ROOT / "data" / "peaks.json"
OUT = ROOT / "data" / "stats.json"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "daydream-site-stats/1.0", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))


def main():
    peaks = json.loads(PEAKS.read_text(encoding="utf-8"))
    ids = ",".join(peaks.keys())

    games = {g["id"]: g for g in get(f"https://games.roblox.com/v1/games?universeIds={ids}")["data"]}
    votes = {v["id"]: v for v in get(f"https://games.roblox.com/v1/games/votes?universeIds={ids}")["data"]}

    out = {"updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "games": {}}
    for uid in peaks:
        g = games.get(int(uid))
        if not g:
            continue
        v = votes.get(int(uid), {})
        out["games"][uid] = {
            "visits": g["visits"],
            "favorites": g["favoritedCount"],
            "playing": g["playing"],
            "upVotes": v.get("upVotes", 0),
            "downVotes": v.get("downVotes", 0),
        }

    if len(out["games"]) < len(peaks) // 2:
        raise SystemExit("Roblox returned too few games; keeping the old stats.json")

    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out['games'])} games to {OUT}")


if __name__ == "__main__":
    main()
