# Planet Breaker prototype

A dependency-free browser prototype for a portrait idle game where a starship destroys pixel planets while five income rooms finance weapon upgrades.

## Run

Open `index.html` directly, or serve the directory:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Included

- Canvas renderer capped at 30 FPS
- Pixel-cell planet with material HP and mineral rewards
- Slow 90-second planet rotation with tap-to-aim support
- Tap-to-aim automatic cannon
- Damage, fire-rate and splash upgrades
- Steep weapon costs so early worlds reward economic investment
- Five escalating income rooms
- Crew-level requirements plus a separate per-world automation purchase
- Room milestones every 10 levels with 3x milestone cost, 2x income and a crew card
- Free 30-minute Supply Pod, prototype rewarded crate and mineral-funded crates
- Crew cards, crew levels and mineral upgrade costs
- Manual collection for rooms without qualified crew
- Offline income and local saving
- World progression
- Mobile portrait layout ready to wrap with Capacitor later

This is a gameplay prototype. Purchases, ads, loot boxes, backend validation and native projects are intentionally excluded.
