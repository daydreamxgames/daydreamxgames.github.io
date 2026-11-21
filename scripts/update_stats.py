"""Fetch public Roblox stats for every Tenfold game and write data/stats.json.

Runs weekly in GitHub Actions (.github/workflows/update-stats.yml). Uses only the
Python standard library and Roblox's public, no-login APIs.

The list of games lives in data/games.json (universe ID -> name). Add a game there
and it is picked up on the next run.
"""
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAMES = ROOT / "data" / "games.json"
OUT = ROOT / "data" / "stats.json"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "tenfold-site-stats/1.0", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))


def main():
    wanted = json.loads(GAMES.read_text(encoding="utf-8"))
    ids = ",".join(wanted.keys())

    games = {g["id"]: g for g in get(f"https://games.roblox.com/v1/games?universeIds={ids}")["data"]}
    votes = {v["id"]: v for v in get(f"https://games.roblox.com/v1/games/votes?universeIds={ids}")["data"]}

    out = {"updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "games": {}}
    for uid in wanted:
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

    if len(out["games"]) < len(wanted) // 2:
        raise SystemExit("Roblox returned too few games; keeping the old stats.json")

    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out['games'])} games to {OUT}")


if __name__ == "__main__":
    main()
