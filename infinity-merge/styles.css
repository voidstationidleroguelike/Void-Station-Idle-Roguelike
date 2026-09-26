
@keyframes upgradePulse{
  0%,100%{box-shadow:0 0 0 0 transparent}
  50%{box-shadow:0 0 0 4px var(--upgrade-pulse-color, rgba(255,255,255,.24)),0 0 18px var(--upgrade-pulse-color, rgba(255,255,255,.18))}
}
.control-btn.spawn-upgrade-ready{
  animation:upgradePulse 1.2s ease-in-out infinite;
}

/* Center the half-width controls as balanced icon + text groups. */
.controls .control-btn:not(.spawn-main-btn){
  justify-content:center;
  text-align:center;
}
.controls .control-btn:not(.spawn-main-btn) .control-copy{
  align-items:center;
}
.controls .control-btn:not(.spawn-main-btn) .control-icon{
  margin-right:1px;
}
.currency-icon{
  color:var(--accent);
  text-shadow:0 0 10px rgba(242,207,91,.25);
}
.reward-btn{
  justify-content:center !important;
  text-align:center;
}
.reward-btn .control-copy{
  align-items:center !important;
}

.top-actions{display:flex;align-items:center;gap:10px}
.settings-btn{width:34px;height:34px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:#aaaab3;display:grid;place-items:center;font-size:17px;padding:0}
.settings-btn:active{transform:scale(.96)}
.settings-list{display:flex;flex-direction:column;gap:9px;margin-top:15px}
.settings-row{width:100%;min-height:64px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 13px;text-align:left}
.settings-row span{display:flex;flex-direction:column;gap:3px;min-width:0}
.settings-row strong{font-size:13px}
.settings-row small{color:var(--muted);font-size:10px;line-height:1.25}
.settings-row b{color:var(--accent);font-size:12px;white-space:nowrap}
.settings-info{border-top:1px solid var(--line);margin-top:3px;padding:12px 3px 0;display:flex;justify-content:space-between;gap:10px;color:var(--muted);font-size:11px}
.settings-info strong{color:#d5d5db;font-size:11px}
.interstitial-demo{text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 20px}
.interstitial-demo>strong{font-size:20px}
.interstitial-demo>small{color:var(--muted);max-width:280px;line-height:1.4}
.interstitial-badge{font-size:10px;letter-spacing:.16em;color:#aaaab3;border:1px solid var(--line);border-radius:999px;padding:6px 9px}
.interstitial-close{margin-top:7px;min-width:140px;border:1px solid #4d4d55;background:#19191c;color:white;border-radius:11px;padding:11px 16px;font-weight:800}
.ad-slot.ads-removed{display:none}

.settings-row.purchase-owned{
  border-color:#2ecc71;
  background:#10271a;
}


/* Web-only details */
.web-purchase-note:disabled{opacity:.55;cursor:not-allowed}
.world-record-card{text-align:center}
.world-record-card strong{font-size:48px}
@media (min-width:900px){
  body{
    background:
      radial-gradient(circle at 50% 0%, rgba(122,48,210,.09), transparent 40%),
      var(--bg);
  }
}


/* Desktop ad rails.
   Hidden until there is enough room for the game + both side ads. */
@media (min-width:1280px){
  .page-layout{
    grid-template-columns:minmax(160px,300px) minmax(620px,760px) minmax(160px,300px);
    column-gap:22px;
    align-items:start;
    max-width:1420px;
    margin:0 auto;
    padding:0 14px;
  }

  #app{
    grid-column:2;
    grid-row:1;
    width:100%;
    max-width:760px;
    margin:0;
    padding-left:14px;
    padding-right:14px;
    align-self:start;
  }

  .web-ad-shell{
    margin-left:-14px;
    margin-right:-14px;
  }

  .side-ad{
    display:flex;
    justify-content:center;
    align-items:flex-start;
    min-width:0;
    padding-top:110px;
    position:sticky;
    top:0;
    height:100dvh;
  }

  .side-ad-left{
    grid-column:1;
    grid-row:1;
    align-self:start;
  }

  .side-ad-right{
    grid-column:3;
    grid-row:1;
    align-self:start;
  }

  .web-ad-slot-side{
    width:100%;
    max-width:300px;
    min-height:600px;
    border:1px solid var(--line);
    border-radius:10px;
    background:#09090a;
  }
}

/* Keep side ads hidden on phones/tablets/smaller laptops. */
@media (max-width:1279px){
  .side-ad{display:none!important}
}

