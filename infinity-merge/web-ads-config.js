// Infinity Merge web advertising configuration.
//
// Keep everything disabled until the site is online and your ad accounts are ready.
// Then replace the placeholder IDs and change enabled to true.
//
// Display ads: Google AdSense.
// Rewarded + game manual interstitial: Google Ad Manager / Google Publisher Tag.

window.INFINITY_WEB_ADS_CONFIG = {
  adsense: {
    enabled: false,

    // Example format: ca-pub-1234567890123456
    client: "ca-pub-XXXXXXXXXXXXXXXX",

    // Create two responsive Display ad units in AdSense and paste the numeric slot IDs.
    topSlot: "XXXXXXXXXX",
    bottomSlot: "XXXXXXXXXX"
  },

  adManager: {
    enabled: false,

    // Full Google Ad Manager ad-unit paths.
    // Example: /1234567/infinity_merge_rewarded
    rewardedAdUnitPath: "/NETWORK_CODE/infinity_merge_rewarded",

    // GAME_MANUAL_INTERSTITIAL is a limited-access GPT format.
    // Leave this blank or disabled if your account does not support it.
    gameInterstitialAdUnitPath: "/NETWORK_CODE/infinity_merge_interstitial"
  }
};
