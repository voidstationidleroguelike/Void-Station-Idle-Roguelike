// Infinity Merge web advertising configuration.
//
// Display ads = Google AdSense
// Rewarded / game interstitial = Google Ad Manager
//
// AdSense is currently under review.
// Leave enabled:false until the site is approved and you have created the ad units.

window.INFINITY_WEB_ADS_CONFIG = {
  adsense: {
    enabled: false,

    // Your real AdSense publisher/client ID:
    client: "ca-pub-1531025343110744",

    // Create three Display ad units after AdSense approval.
    // Paste only the numeric data-ad-slot values here.
    topSlot: "TOP_SLOT_ID",
    leftSlot: "LEFT_SLOT_ID",
    rightSlot: "RIGHT_SLOT_ID"
  },

  adManager: {
    enabled: false,

    // Fill this after Google Ad Manager becomes available.
    rewardedAdUnitPath: "/NETWORK_CODE/infinity_merge_rewarded"
  }
};
