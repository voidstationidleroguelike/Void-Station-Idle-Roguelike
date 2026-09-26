# Infinity Merge — web version

This folder is ready to upload directly to the existing GitHub repository.

Suggested final path in the repository:

```text
/infinity-merge/
```

No npm, build command, Capacitor, Android Studio, or server code is required.

## Upload to GitHub

Upload the complete `infinity-merge` folder to the repository root.

The expected structure is:

```text
infinity-merge/
├── index.html
├── styles.css
├── app.js
├── firebase.js
├── web-ads.js
├── web-ads-config.js
├── ADS-SETUP.md
├── ROOT-ads.txt.example
└── assets/
    ├── logo-512x512.png
    └── promo-1024x500.png
```

If your custom domain already serves this GitHub Pages repository, the game should become available at:

```text
https://voidstationidleroguelike.com/infinity-merge/
```

## Firebase

The web version reads the same shared record as Android:

```text
Leaderboard/global/bestLevel
```

The client is read-only. It does not write new world records.

## Ads

All web ads are OFF by default.

The page already contains:

- a reserved responsive display-ad area above the game;
- a second reserved responsive display-ad area below the controls;
- rewarded-ad hooks for Moves, Gold and +1 Hammer at zero;
- a game-interstitial hook at 100 merges.

See `ADS-SETUP.md`.

Until rewarded ads are configured, the rewarded buttons are disabled and NO fake reward is granted.
