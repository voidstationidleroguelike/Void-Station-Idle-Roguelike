# Infinity Merge — web ads setup

The Android app uses AdMob. The website does **not** use the Android AdMob unit IDs.

For the website:

- Display/banner ads: Google AdSense.
- Rewarded ads: Google Ad Manager + Google Publisher Tag (GPT).
- Manual game interstitial: Google Ad Manager GPT `GAME_MANUAL_INTERSTITIAL` if the account has access.

All settings are in:

```text
web-ads-config.js
```

---

## 1. Publish the website first

Upload the `infinity-merge` folder to GitHub and make sure this opens:

```text
https://voidstationidleroguelike.com/infinity-merge/
```

It is fine that the two reserved ad boxes still say `AD SPACE`.

---

## 2. AdSense display ads

In AdSense:

1. Add/verify the site `voidstationidleroguelike.com` if it is not already present.
2. Create a responsive **Display ad unit** for the top slot.
3. Create a second responsive **Display ad unit** for the bottom slot.
4. Copy:
   - your client ID, for example `ca-pub-1234567890123456`;
   - the numeric ad slot ID for the top unit;
   - the numeric ad slot ID for the bottom unit.
5. Open `web-ads-config.js` and change:

```js
adsense: {
  enabled: true,
  client: "ca-pub-YOUR_ID",
  topSlot: "YOUR_TOP_SLOT",
  bottomSlot: "YOUR_BOTTOM_SLOT"
}
```

The file `web-ads.js` will then load the AdSense script and place the responsive units into the two reserved spaces automatically.

You can also enable Auto ads later in AdSense if you want Google to place additional formats.

---

## 3. ads.txt

AdSense normally gives you a line similar to:

```text
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

That line belongs in the **root of the domain**, not inside the game folder.

So in this GitHub repository it should be:

```text
/ads.txt
```

and publicly available at:

```text
https://voidstationidleroguelike.com/ads.txt
```

`ROOT-ads.txt.example` is included only as a reminder/template.

---

## 4. Rewarded ads for Moves, Gold and Hammer

The game already calls the web ad bridge for:

- `moves`
- `gold`
- `hammer`

The actual gameplay reward is granted only after GPT fires the rewarded-ad grant event.

To enable it:

1. Use Google Ad Manager.
2. Create/configure a web rewarded ad unit / line item.
3. Get the full ad-unit path, for example:

```text
/1234567/infinity_merge_rewarded
```

4. Put it in `web-ads-config.js`:

```js
adManager: {
  enabled: true,
  rewardedAdUnitPath: "/1234567/infinity_merge_rewarded",
  gameInterstitialAdUnitPath: ""
}
```

Once configured, the three rewarded buttons become active automatically.

---

## 5. Interstitial every 100 merges

The game already calls:

```js
InfinityAds.showInterstitial("merge100")
```

at 100 merges.

The implementation uses GPT's `GAME_MANUAL_INTERSTITIAL` format because that is the web format that lets a game decide when to show it.

This Google format is limited-access. If your Ad Manager account does not support it, leave:

```js
gameInterstitialAdUnitPath: ""
```

The game will simply continue normally at 100 merges.

If access is available, add the full ad-unit path and the web bridge will show it when GPT reports the ad ready.

---

## 6. Consent / privacy

Before switching production web ads on for real traffic, configure the consent/privacy flow required for your audience and regions in the relevant Google publisher tools.

---

## Files you normally edit later

For ad setup, almost everything is intentionally isolated to:

```text
web-ads-config.js
```

You should not need to edit `app.js` just to insert publisher/ad-unit IDs.
