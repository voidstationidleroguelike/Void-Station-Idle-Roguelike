(() => {
  const SAVE_KEY = "infinityMergePrototype_v12";
  const SIZE = 4;
  const SWIPE_THRESHOLD = 28;
  const DAILY_SPAWN_UPS_FROM_ADS_MAX = 10;
  const MERGES_PER_HAMMER = 25;
  const COLORS = ["#c72323","#21d255","#8e1edd","#dac42b","#20aecb","#d61d81","#52d626","#2f27dd","#ce581c","#24cf8f","#cb22da","#b9e123","#2375c7","#d22145","#1edd2e","#6d2bda","#cb9220","#1dd6cf","#d626a9","#7add27","#1c39ce","#cf3a24","#22da6f","#aa23e1","#c7c723","#219ed2","#dd1e6d","#40da2b","#3d20cb","#d6731d","#26d6ab","#dd27d5","#92ce1c","#2464cf","#da2230","#23e14c","#7623c7","#d2ae21","#1ecddd","#da2b97","#58cb20","#1d24d6","#d65326","#27dd8b","#b21cce","#b8cf24","#228cda","#e12359","#23c724","#5621d2"];
  const $ = id => document.getElementById(id);

  const els = {
    grid:$("grid"), movesStat:$("movesStat"), coins:$("coins"), moves:$("movesLabel"), best:$("bestLevelLabel"), worldBest:$("worldBestLabel"),
    worldBestBtn:$("worldBestBtn"), msg:$("message"), spawnBtn:$("spawnBtn"), spawnCostLabel:$("spawnCostLabel"),
    spawnUpgradeBtn:$("spawnUpgradeBtn"), spawnUpgradeLabel:$("spawnUpgradeLabel"), buyMoveBtn:$("buyMoveBtn"),
    buyMoveLabel:$("buyMoveLabel"), hammerBtn:$("hammerBtn"), hammerLabel:$("hammerLabel"), hammerProgress:$("hammerProgress"),
    moveAdBtn:$("moveAdBtn"), moveAdLabel:$("moveAdLabel"), goldAdBtn:$("goldAdBtn"), goldAdLabel:$("goldAdLabel"),
    leaderboardModal:$("leaderboardModal"), closeLeaderboardBtn:$("closeLeaderboardBtn"), leaderboardBest:$("leaderboardBest"),
    restartRunBtn:$("restartRunBtn"), restartConfirmModal:$("restartConfirmModal"),
    closeRestartConfirmBtn:$("closeRestartConfirmBtn"), cancelRestartBtn:$("cancelRestartBtn"),
    confirmRestartBtn:$("confirmRestartBtn")
  };

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  }

  function fresh() {
    return {
      coins: 4,
      spawnLevel: 1,
      bestLevel: 1,
      moves: 4,
      totalMerges: 0,
      hammers: 0,
      hammerMode: false,
      nextId: 1,
      board: Array(SIZE * SIZE).fill(null),
      moveAdsWatched: 0,
      adSpawnUpgradeDay: todayKey(),
      adSpawnUpgradeCountToday: 0
    };
  }

  let state = load() || fresh();
  let gesture = null;
  let animating = false;
  let lastPopIds = new Set();
  let lastSpawnId = null;
  let globalBestLevel = window.InfinityFirebase?.getCachedBest?.() || 1;

  function makeTile(level){ return { id: state.nextId++, level }; }
  function save(){ localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, hammerMode: false })); }
  function load(){
    try{
      const x = JSON.parse(localStorage.getItem(SAVE_KEY));
      if(!x || !Array.isArray(x.board) || x.board.length !== SIZE * SIZE) return null;
      x.hammerMode = false;
      if(typeof x.moveAdsWatched !== "number") x.moveAdsWatched = 0;
      if(typeof x.adSpawnUpgradeDay !== "string") x.adSpawnUpgradeDay = todayKey();
      if(typeof x.adSpawnUpgradeCountToday !== "number") x.adSpawnUpgradeCountToday = 0;
      delete x.soundEnabled;
      return x;
    }catch{ return null; }
  }

  function ensureDailyReset() {
    const tk = todayKey();
    if (state.adSpawnUpgradeDay !== tk) {
      state.adSpawnUpgradeDay = tk;
      state.adSpawnUpgradeCountToday = 0;
    }
  }

  function color(level){ return COLORS[(Math.max(1,level)-1) % COLORS.length]; }
  function withAlpha(hex, alpha="55"){ return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex; }
  function msg(text, ms=1500){
    els.msg.textContent = text;
    clearTimeout(msg.t);
    msg.t = setTimeout(() => { if (els.msg.textContent === text) els.msg.textContent = ""; }, ms);
  }

  function randomEmpty(board=state.board){
    const a=[]; for(let i=0;i<board.length;i++) if(board[i]==null) a.push(i);
    return a.length ? a[Math.floor(Math.random() * a.length)] : -1;
  }

  const spawnCost = () => state.spawnLevel;
  const spawnUpgradeCost = () => state.spawnLevel * (20 + 5 * (state.spawnLevel - 1));
  const moveCost = () => state.spawnLevel * 5;
  const goldAdReward = () => state.spawnLevel * 10;

  function addRandomTile(free=false){
    const idx = randomEmpty();
    if(idx < 0) return null;

    const cost = spawnCost();
    if(!free && state.coins < cost) return null;
    if(!free) state.coins -= cost;

    const tile = makeTile(state.spawnLevel);
    state.board[idx] = tile;
    state.bestLevel = Math.max(state.bestLevel, tile.level);
    return { index: idx, tile };
  }

  function ensureStart(){
    if(state.board.some(Boolean)) return;
    for(let i=0;i<4;i++) addRandomTile(true);
    save();
  }

  function indices(direction,line){
    const a=[];
    if(direction==="left") for(let c=0;c<SIZE;c++) a.push(line*SIZE+c);
    if(direction==="right") for(let c=SIZE-1;c>=0;c--) a.push(line*SIZE+c);
    if(direction==="up") for(let r=0;r<SIZE;r++) a.push(r*SIZE+line);
    if(direction==="down") for(let r=SIZE-1;r>=0;r--) a.push(r*SIZE+line);
    return a;
  }

  function calcSwipe(direction){
    const old = state.board;
    const next = Array(SIZE * SIZE).fill(null);
    const animations = [], mergedLevels = [], resultIds = [];
    let changed = false;

    for(let line=0; line<SIZE; line++){
      const idxs = indices(direction,line);
      const src = [];
      for(const idx of idxs) if(old[idx]) src.push({ tile: old[idx], from: idx });

      const groups = [];
      for(const s of src){
        const p = groups[groups.length - 1];
        if(p && p.level === s.tile.level && !p.merged){
          p.sources.push(s);
          p.level += 1;
          p.merged = true;
        } else {
          groups.push({ level: s.tile.level, sources: [s], merged: false });
        }
      }

      groups.forEach((g, slot) => {
        const to = idxs[slot];
        let result;
        if(g.merged){
          result = makeTile(g.level);
          mergedLevels.push(g.level);
          resultIds.push(result.id);
        } else {
          result = g.sources[0].tile;
        }
        next[to] = result;

        g.sources.forEach(s => {
          animations.push({ tile: s.tile, from: s.from, to });
          if(s.from !== to || g.merged) changed = true;
        });
      });
    }
    return { changed, newBoard: next, animations, mergedLevels, resultIds };
  }

  function cellRect(i){ return els.grid.querySelector(`.cell[data-index="${i}"]`)?.getBoundingClientRect() || null; }
  function tileEl(id){ return els.grid.querySelector(`.tile[data-id="${id}"]`); }

  function makeGhost(a){
    const src = tileEl(a.tile.id), fr = cellRect(a.from), tr = cellRect(a.to);
    if(!src || !fr || !tr) return null;

    src.classList.add("hidden-for-swipe");
    const g = document.createElement("div");
    g.className = "swipe-ghost";
    g.textContent = a.tile.level;
    g.style.left = `${fr.left}px`;
    g.style.top = `${fr.top}px`;
    g.style.width = `${fr.width}px`;
    g.style.height = `${fr.height}px`;
    g.style.borderRadius = getComputedStyle(src).borderRadius;
    g.style.fontSize = getComputedStyle(src).fontSize;
    g.style.background = color(a.tile.level);
    g.style.transform = "translate3d(0,0,0)";
    g.dataset.dx = String(tr.left - fr.left);
    g.dataset.dy = String(tr.top - fr.top);
    document.body.appendChild(g);
    return g;
  }

  function animate(result, done){
    const ghosts = result.animations.map(makeGhost).filter(Boolean);
    if(!ghosts.length){ done(); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ghosts.forEach(g => {
        g.style.transition = "transform 145ms cubic-bezier(.22,.72,.22,1)";
        g.style.transform = `translate3d(${g.dataset.dx}px,${g.dataset.dy}px,0)`;
      });
    }));
    setTimeout(() => { ghosts.forEach(g => g.remove()); done(); }, 155);
  }

  function hammerAwards(mergeCount){
    const before = Math.floor(state.totalMerges / MERGES_PER_HAMMER);
    state.totalMerges += mergeCount;
    const after = Math.floor(state.totalMerges / MERGES_PER_HAMMER);
    const earned = Math.max(0, after - before);
    state.hammers += earned;
    return earned;
  }

  function performSwipe(direction){
    ensureDailyReset();
    if(animating) return;
    if(state.moves <= 0){ msg("No moves left. Buy +1 Move or watch an ad."); return; }

    const result = calcSwipe(direction);
    if(!result.changed){ msg("No movement."); return; }

    animating = true;
    animate(result, () => {
      state.board = result.newBoard;
      state.moves -= 1;

      const merges = result.mergedLevels.length;
      const coins = result.mergedLevels.reduce((s,v)=>s+v,0);
      const previousBestLevel = state.bestLevel;

      if(merges){
        state.coins += coins;
        state.moves += merges; // +1 move per merge
        result.mergedLevels.forEach(v => state.bestLevel = Math.max(state.bestLevel, v));
      }

      const h = hammerAwards(merges);
      const spawned = addRandomTile(true);

      lastPopIds = new Set(result.resultIds);
      lastSpawnId = spawned?.tile?.id ?? null;
      save();
      render();

      if(state.bestLevel > previousBestLevel){
        window.InfinityFirebase?.submitWorldBest?.(state.bestLevel).then(result => {
          if(result?.bestLevel){
            globalBestLevel = Number(result.bestLevel);
            render();
          }
        });
      }

      if(merges){
        msg(`${merges} merge${merges===1 ? "" : "s"} • +${coins} coins • +${merges} Move${merges===1 ? "" : "s"}${h ? ` • +${h} hammer` : ""}`, 1800);
      }
      animating = false;
    });
  }

  function dir(dx,dy){
    if(Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return null;
    if(Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  function useHammer(index){
    if(!state.hammerMode || state.hammers <= 0 || animating) return;
    const tile = state.board[index];
    if(!tile) return;
    state.board[index] = null;
    state.hammers -= 1;
    state.hammerMode = false;
    const refund = Math.floor(tile.level / 2);
    state.coins += refund;
    save(); render();
    msg(`Recycled Lv. ${tile.level} • +${refund} coins.`);
  }

  function styleAvailable(el, can, bg, border) {
    el.classList.toggle("available", can);
    el.style.background = can ? bg : "";
    el.style.borderColor = can ? border : "";
  }

  function render(){
    ensureDailyReset();

    els.grid.innerHTML = "";
    state.board.forEach((tile,index)=>{
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.index = String(index);
      if(state.hammerMode && tile) cell.classList.add("hammer-target");

      if(tile){
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.id = String(tile.id);
        t.style.background = color(tile.level);
        t.textContent = tile.level;
        if(lastPopIds.has(tile.id)) t.classList.add("pop");
        if(tile.id === lastSpawnId) t.classList.add("spawn-pop");
        cell.appendChild(t);
      }
      els.grid.appendChild(cell);
    });

    lastPopIds = new Set();
    lastSpawnId = null;

    const sp = spawnCost();
    const up = spawnUpgradeCost();
    const mv = moveCost();
    const gp = goldAdReward();
    const hp = state.totalMerges % MERGES_PER_HAMMER;
    const rewardedAvailable = !!window.InfinityAds?.isRewardedAvailable?.();

    els.coins.textContent = state.coins.toLocaleString();
    els.moves.textContent = state.moves.toLocaleString();
    els.movesStat.classList.toggle("danger", state.moves <= 0);
    els.best.textContent = state.bestLevel.toLocaleString();
    els.worldBest.textContent = globalBestLevel > 0 ? globalBestLevel.toLocaleString() : "—";
    els.leaderboardBest.textContent = globalBestLevel > 0 ? globalBestLevel.toLocaleString() : "—";

    els.spawnCostLabel.textContent = `Lv. ${state.spawnLevel} • ◆${sp}`;
    els.spawnBtn.disabled = state.coins < sp || randomEmpty() < 0;
    styleAvailable(els.spawnBtn, !els.spawnBtn.disabled, color(state.spawnLevel), color(state.spawnLevel));

    els.spawnUpgradeLabel.textContent = `Lv. ${state.spawnLevel + 1} • ◆${up.toLocaleString()}`;
    els.spawnUpgradeBtn.disabled = state.coins < up;
    const nextLevelColor = color(state.spawnLevel + 1);
    styleAvailable(els.spawnUpgradeBtn, !els.spawnUpgradeBtn.disabled, nextLevelColor, nextLevelColor);
    els.spawnUpgradeBtn.classList.toggle("spawn-upgrade-ready", !els.spawnUpgradeBtn.disabled);
    els.spawnUpgradeBtn.style.setProperty("--upgrade-pulse-color", withAlpha(nextLevelColor, "55"));

    els.buyMoveLabel.textContent = `◆${mv.toLocaleString()}`;
    els.buyMoveBtn.disabled = state.coins < mv;
    styleAvailable(els.buyMoveBtn, !els.buyMoveBtn.disabled, "#143221", "#2ecc71");
    els.buyMoveBtn.classList.toggle("move-rescue", state.moves <= 0 && !els.buyMoveBtn.disabled);

    els.hammerLabel.textContent = `Hammer ×${state.hammers}`;
    if(state.hammers <= 0){
      els.hammerProgress.textContent = rewardedAvailable ? "▶ Watch ad • +1 Hammer" : "Reward ad not connected";
      els.hammerBtn.disabled = !rewardedAvailable;
      els.hammerBtn.classList.remove("active");
      styleAvailable(els.hammerBtn, rewardedAvailable, "#23203b", "#6f62ff");
    } else {
      els.hammerProgress.textContent = `Next ${hp}/${MERGES_PER_HAMMER} merges`;
      els.hammerBtn.disabled = false;
      els.hammerBtn.classList.toggle("active", state.hammerMode);
      styleAvailable(els.hammerBtn, true, "#302512", "#f2cf5b");
    }

    const adsToNextBonus = 3 - (state.moveAdsWatched % 3);
    const spawnBonusesLeft = DAILY_SPAWN_UPS_FROM_ADS_MAX - state.adSpawnUpgradeCountToday;
    els.moveAdLabel.textContent = rewardedAvailable
      ? (spawnBonusesLeft > 0
          ? `+2 Moves • ${adsToNextBonus}/3 to Spawn Up`
          : `+2 Moves • Daily Spawn Up maxed`)
      : "Reward ad not connected";
    els.moveAdBtn.disabled = !rewardedAvailable;
    styleAvailable(els.moveAdBtn, rewardedAvailable, "#23203b", "#6f62ff");

    els.goldAdLabel.textContent = rewardedAvailable ? `+◆${gp.toLocaleString()}` : "Reward ad not connected";
    els.goldAdBtn.disabled = !rewardedAvailable;
    styleAvailable(els.goldAdBtn, rewardedAvailable, "#3a2e12", "#caa54b");
  }

  els.grid.addEventListener("pointerdown", e => {
    if(animating) return;
    const cell = e.target.closest(".cell");
    const index = cell ? Number(cell.dataset.index) : -1;

    if(state.hammerMode){
      if(index >= 0){ e.preventDefault(); useHammer(index); }
      return;
    }

    gesture = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
    els.grid.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  els.grid.addEventListener("pointerup", e => {
    if(!gesture || gesture.pointerId !== e.pointerId || state.hammerMode) return;
    const direction = dir(e.clientX - gesture.startX, e.clientY - gesture.startY);
    gesture = null;
    if(direction) performSwipe(direction);
  });

  els.grid.addEventListener("pointercancel", () => gesture = null);

  window.addEventListener("keydown", e => {
    if(!els.leaderboardModal.hidden || !els.restartConfirmModal.hidden) return;
    const map = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"up", ArrowDown:"down" };
    if(map[e.key]){ e.preventDefault(); performSwipe(map[e.key]); }
  });

  els.spawnBtn.addEventListener("click", () => {
    if(animating) return;
    const c = spawnCost();
    if(state.coins < c){ msg(`Need ${c} coins.`); return; }
    const s = addRandomTile(false);
    if(!s){ msg("Board full."); return; }
    lastSpawnId = s.tile.id;
    save(); render();
    msg(`Spawned Lv. ${state.spawnLevel}.`);
  });

  els.spawnUpgradeBtn.addEventListener("click", () => {
    if(animating) return;
    const c = spawnUpgradeCost();
    if(state.coins < c){ msg(`Need ${c} coins.`); return; }
    state.coins -= c;
    state.spawnLevel += 1;
    save(); render();
    msg(`Spawn Level ${state.spawnLevel} unlocked.`);
  });

  els.buyMoveBtn.addEventListener("click", () => {
    if(animating) return;
    const c = moveCost();
    if(state.coins < c){ msg(`Need ${c} coins.`); return; }
    state.coins -= c;
    state.moves += 1;
    save(); render();
    msg("+1 Move.");
  });

  els.hammerBtn.addEventListener("click", async () => {
    if(animating || els.hammerBtn.dataset.busy === "1") return;

    // No hammer available: the Hammer button becomes an optional rewarded ad.
    if(state.hammers <= 0){
      state.hammerMode = false;
      els.hammerBtn.dataset.busy = "1";
      els.hammerProgress.textContent = "Loading ad…";

      const adResult = await window.InfinityAds?.showRewarded?.("hammer");

      if(!adResult?.earned){
        els.hammerBtn.dataset.busy = "0";
        render();
        msg(adResult?.available === false ? "Rewarded ads are not available yet." : "Reward not earned.");
        return;
      }

      state.hammers = 1;
      els.hammerBtn.dataset.busy = "0";
      save();
      render();
      msg("Ad reward: +1 Hammer.");
      return;
    }

    // One or more hammers available: normal hammer mode, never an ad.
    state.hammerMode = !state.hammerMode;
    render();
    if(state.hammerMode) msg("Tap a tile to recycle it.");
  });

  els.moveAdBtn.addEventListener("click", async () => {
    if(animating || els.moveAdBtn.dataset.busy === "1") return;
    ensureDailyReset();

    els.moveAdBtn.dataset.busy = "1";
    const oldText = els.moveAdLabel.textContent;
    els.moveAdLabel.textContent = "Loading ad…";

    const adResult = await window.InfinityAds?.showRewarded?.("moves");

    if(!adResult?.earned){
      els.moveAdBtn.dataset.busy = "0";
      render();
      msg(adResult?.available === false ? "Rewarded ads are not available yet." : "Reward not earned.");
      return;
    }

    state.moves += 2;
    state.moveAdsWatched += 1;

    let text = "+2 Moves";
    if(state.moveAdsWatched % 3 === 0 && state.adSpawnUpgradeCountToday < DAILY_SPAWN_UPS_FROM_ADS_MAX){
      state.spawnLevel += 1;
      state.adSpawnUpgradeCountToday += 1;
      text += " • +1 Spawn Level";
    }

    els.moveAdBtn.dataset.busy = "0";
    save(); render();
    msg(`Ad reward: ${text}.`);
  });

  els.goldAdBtn.addEventListener("click", async () => {
    if(animating || els.goldAdBtn.dataset.busy === "1") return;

    els.goldAdBtn.dataset.busy = "1";
    els.goldAdLabel.textContent = "Loading ad…";

    const adResult = await window.InfinityAds?.showRewarded?.("gold");

    if(!adResult?.earned){
      els.goldAdBtn.dataset.busy = "0";
      render();
      msg(adResult?.available === false ? "Rewarded ads are not available yet." : "Reward not earned.");
      return;
    }

    const reward = goldAdReward();
    state.coins += reward;
    els.goldAdBtn.dataset.busy = "0";
    save(); render();
    msg(`Ad reward: +${reward} coins.`);
  });

  function restartRun(){
    if(animating) return;

    // Keep persistent / anti-abuse progress while resetting the active run.
    const preservedBestLevel = Math.max(1, Number(state.bestLevel) || 1);
    const preservedMoveAdsWatched = Math.max(0, Number(state.moveAdsWatched) || 0);
    const preservedAdDay = typeof state.adSpawnUpgradeDay === "string"
      ? state.adSpawnUpgradeDay
      : todayKey();
    const preservedAdCountToday = Math.max(0, Number(state.adSpawnUpgradeCountToday) || 0);

    state = fresh();
    state.bestLevel = preservedBestLevel;
    state.moveAdsWatched = preservedMoveAdsWatched;
    state.adSpawnUpgradeDay = preservedAdDay;
    state.adSpawnUpgradeCountToday = preservedAdCountToday;

    ensureDailyReset();
    ensureStart();
    save();
    render();
    msg("Run restarted.");
  }

  function closeRestartConfirm(){
    els.restartConfirmModal.hidden = true;
  }

  els.restartRunBtn.addEventListener("click", () => {
    if(animating) return;
    els.restartConfirmModal.hidden = false;
  });

  els.closeRestartConfirmBtn.addEventListener("click", closeRestartConfirm);
  els.cancelRestartBtn.addEventListener("click", closeRestartConfirm);

  els.restartConfirmModal.addEventListener("click", e => {
    if(e.target === els.restartConfirmModal) closeRestartConfirm();
  });

  els.confirmRestartBtn.addEventListener("click", () => {
    closeRestartConfirm();
    restartRun();
  });

  els.worldBestBtn.addEventListener("click", async () => {
    els.leaderboardBest.textContent = globalBestLevel > 0 ? globalBestLevel.toLocaleString() : "—";
    els.leaderboardModal.hidden = false;

    const result = await window.InfinityFirebase?.refreshWorldBest?.();
    if(result?.bestLevel){
      globalBestLevel = result.bestLevel;
      render();
      els.leaderboardBest.textContent = globalBestLevel.toLocaleString();
    }
  });

  els.closeLeaderboardBtn.addEventListener("click", () => els.leaderboardModal.hidden = true);
  els.leaderboardModal.addEventListener("click", e => { if(e.target === els.leaderboardModal) els.leaderboardModal.hidden = true; });

  window.addEventListener("infinity-ads-state", () => {
    render();
  });

  window.addEventListener("infinity-world-best", event => {
    const value = Number(event?.detail?.bestLevel);
    if(Number.isFinite(value) && value >= 1){
      globalBestLevel = Math.floor(value);
      els.worldBest.textContent = globalBestLevel.toLocaleString();
      if(!els.leaderboardModal.hidden){
        els.leaderboardBest.textContent = globalBestLevel.toLocaleString();
      }
    }
  });

  ensureStart();
  render();

  // Firestore: read the shared Android / iOS / web world record.
  window.InfinityFirebase?.refreshWorldBest?.().then(async result => {
    if(result?.bestLevel){
      globalBestLevel = Number(result.bestLevel);
      render();
    }

    if(state.bestLevel > globalBestLevel){
      const submitted = await window.InfinityFirebase?.submitWorldBest?.(state.bestLevel);
      if(submitted?.bestLevel){
        globalBestLevel = Number(submitted.bestLevel);
        render();
      }
    }
  });

  // Initialize web ads after the game UI exists.
  // With web-ads-config.js left disabled, the game remains fully playable
  // and simply reserves the display-ad spaces.
  window.InfinityAds?.init?.().then(() => render());
})();
