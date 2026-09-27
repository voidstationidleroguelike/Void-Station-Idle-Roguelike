// Infinity Merge web advertising configuration.
//
// Display ads = Google AdSense
// Rewarded / game interstitial = Google Ad Manager

window.INFINITY_WEB_ADS_CONFIG = {
  adsense: {
    enabled: true,

    // Real AdSense publisher/client ID:
    client: "ca-pub-1531025343110744",

    // Infinity Merge display ad units:
    topSlot: "8371043010",
    leftSlot: "9349082765",
    rightSlot: "7652857712"
  },

  adManager: {
    enabled: false,

    // Fill this after Google Ad Manager becomes available.
    rewardedAdUnitPath: "/NETWORK_CODE/infinity_merge_rewarded"
  }
};
