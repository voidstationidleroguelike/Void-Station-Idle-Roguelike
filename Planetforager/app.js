"use strict";

const FPS = 30;
const FRAME_MS = 1000 / FPS;
const ROTATION_PERIOD = 90;
const FREE_CRATE_COOLDOWN = 30 * 60 * 1000;
const SAVE_KEY = "planet-breaker-prototype-v1";
const materials = {
  crust: { hp: 1, color: "#ef7a2d", value: 0, minerals: 0 },
  rock: { hp: 4, color: "#bb5630", value: 0, minerals: 0 },
  iron: { hp: 10, color: "#667687", value: 1.2, minerals: .08 },
  crystal: { hp: 6, color: "#884cf4", value: 9, minerals: 1 },
  gold: { hp: 7, color: "#ffc936", value: 18, minerals: .35 },
  core: { hp: 18, color: "#9d2945", value: 2.5, minerals: .04 },
};

const planetThemes = [
  { name: "DUST ROCK", lobes: 5, roughness: .45, phase: .3, colors: { crust: "#ef7a2d", rock: "#bb5630", iron: "#667687", crystal: "#884cf4", gold: "#ffc936", core: "#9d2945" } },
  { name: "FROZEN MOON", lobes: 7, roughness: .75, phase: 1.2, colors: { crust: "#bfeaff", rock: "#6598b8", iron: "#526779", crystal: "#66f5ff", gold: "#d9ff75", core: "#28507a" } },
  { name: "TOXIC WORLD", lobes: 4, roughness: 1.0, phase: 2.1, colors: { crust: "#91d34f", rock: "#477d43", iron: "#536b55", crystal: "#d8ff43", gold: "#ffd44e", core: "#315834" } },
  { name: "CRIMSON GIANT", lobes: 9, roughness: .65, phase: .7, colors: { crust: "#f05252", rock: "#8d2f3c", iron: "#71555d", crystal: "#ff7bd4", gold: "#ffb83e", core: "#501c30" } },
  { name: "VIOLET CORE", lobes: 6, roughness: 1.15, phase: 1.7, colors: { crust: "#9b64ef", rock: "#593889", iron: "#6d6580", crystal: "#eb77ff", gold: "#ffd35d", core: "#321f5c" } },
  { name: "MACHINE PLANET", lobes: 12, roughness: .35, phase: 0, colors: { crust: "#9da9b5", rock: "#596774", iron: "#344554", crystal: "#58e5ff", gold: "#ffcf48", core: "#25313d" } },
];

const roomDefs = [
  { name: "Mining Bay", icon: "⛏", base: 8, cycle: 2.0, unlock: 0, crew: "Mara", autoLevel: 1, autoCost: 250 },
  { name: "Refinery", icon: "▣", base: 55, cycle: 4.0, unlock: 700, crew: "Kip", autoLevel: 2, autoCost: 4200 },
  { name: "Trade Deck", icon: "↗", base: 310, cycle: 7.0, unlock: 9000, crew: "Vex", autoLevel: 3, autoCost: 52000 },
  { name: "Cargo Exchange", icon: "◆", base: 1800, cycle: 12.0, unlock: 85000, crew: "Unit-8", autoLevel: 4, autoCost: 480000 },
  { name: "Quantum Bank", icon: "◎", base: 12000, cycle: 20.0, unlock: 750000, crew: "Nyx", autoLevel: 5, autoCost: 4200000 },
];

const defaultState = () => ({
  money: 80,
  minerals: 0,
  world: 1,
  weapon: { damage: 1, speed: 1, splash: 1 },
  rooms: roomDefs.map((r, i) => ({ level: i === 0 ? 1 : 0, unlocked: i === 0, progress: 0, ready: false, crewLevel: i === 0 ? 1 : 0, autoPurchased: false })),
  slots: { left: false, right: false },
  crewCards: roomDefs.map(() => 0),
  nextFreeCrateAt: 0,
  nextAdCrateAt: 0,
  lastSeen: Date.now(),
});

let state = loadState();
let planet = null;
let shots = [];
let particles = [];
let target = null;
let lastRender = 0;
let lastTime = performance.now();
let autosaveClock = 0;
let toastTimer;

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const roomsEl = document.querySelector("#rooms");
const moneyLabel = document.querySelector("#moneyLabel");
const mineralLabel = document.querySelector("#mineralLabel");
const worldLabel = document.querySelector("#worldLabel");
const planetPercent = document.querySelector("#planetPercent");
const planetName = document.querySelector("#planetName");
const weaponDialog = document.querySelector("#weaponDialog");
const crewDialog = document.querySelector("#crewDialog");

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!stored) return defaultState();
    const fresh = defaultState();
    return {
      ...fresh,
      ...stored,
      weapon: { ...fresh.weapon, ...stored.weapon },
      slots: { ...fresh.slots, ...stored.slots },
      crewCards: fresh.crewCards.map((cards, i) => stored.crewCards?.[i] ?? cards),
      rooms: fresh.rooms.map((room, i) => ({ ...room, ...(stored.rooms?.[i] || {}) })),
    };
  } catch { return defaultState(); }
}

function saveState() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function formatNumber(value) {
  if (value < 1000) return Math.floor(value).toLocaleString("en-US");
  const units = ["K", "M", "B", "T"];
  let n = value;
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return `${n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)}${units[i]}`;
}

function worldScale() { return Math.pow(1.3, state.world - 1); }
function roomIncome(i) {
  const room = state.rooms[i];
  if (!room.unlocked) return 0;
  const milestone = Math.pow(2, Math.floor(room.level / 10));
  const crewMultiplier = 1 + room.crewLevel * 0.5;
  return roomDefs[i].base * room.level * milestone * crewMultiplier * worldScale();
}
function isNextRoomLevelMilestone(i) { return (state.rooms[i].level + 1) % 10 === 0; }
function roomUpgradeCost(i) {
  const base = roomDefs[i].base * 6 * Math.pow(1.16, state.rooms[i].level) * worldScale();
  return base * (isNextRoomLevelMilestone(i) ? 3 : 1);
}
function roomAutoCost(i) { return roomDefs[i].autoCost * worldScale(); }
function weaponCost(type) {
  const level = state.weapon[type];
  const bases = { damage: 250, speed: 450, splash: 800 };
  return bases[type] * Math.pow(2.05, level - 1) * worldScale();
}
function weaponDamage() { return Math.pow(1.1, state.weapon.damage - 1); }
function fireRateMultiplier() { return Math.pow(1.1, state.weapon.speed - 1); }
function fireInterval() { return Math.max(0.2, 1.2 / fireRateMultiplier()); }
function splashPercent() { return state.weapon.splash * 10; }
function cardsRequired(i) { return Math.max(2, state.rooms[i].crewLevel * 3); }
function crewUpgradeCost(i) { return 20 * Math.pow(1.8, state.rooms[i].crewLevel - 1); }

function createPlanet() {
  const themeIndex = (state.world - 1) % planetThemes.length;
  const themeCycle = Math.floor((state.world - 1) / planetThemes.length);
  const theme = planetThemes[themeIndex];
  const cols = Math.min(81, 51 + (state.world - 1) * 4);
  const rows = cols;
  const radius = cols / 2 - 1.4;
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cols / 2;
      const dy = y + 0.5 - rows / 2;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const edgeNoise = Math.sin(angle * theme.lobes + theme.phase) * theme.roughness + Math.sin(angle * (theme.lobes + 5) - theme.phase) * .28;
      const localRadius = radius + edgeNoise;
      if (distance > localRadius) continue;
      const depth = 1 - distance / localRadius;
      const roll = Math.random();
      let type = depth > 0.72 ? "core" : depth > 0.3 ? "rock" : "crust";
      if (roll < 0.035) type = "gold";
      else if (roll < 0.085) type = "crystal";
      else if (roll < 0.16 && depth > 0.2) type = "iron";
      const base = materials[type].hp * Math.pow(1.4, state.world - 1);
      cells.push({ x, y, type, hp: base, maxHp: base, alive: true });
    }
  }
  planet = { cols, rows, cells, total: cells.length, remaining: cells.length, shotClock: 0, rotation: 0, theme };
  target = { x: cols / 2, y: rows - 3 };
  planetName.textContent = `${theme.name}${themeCycle ? ` MK ${themeCycle + 1}` : ""} · ${cols}×${rows}`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function layoutPlanet() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const size = Math.min(w * 0.93, h * 0.86);
  const cell = size / planet.cols;
  return { cell, left: (w - size) / 2, top: Math.max(6, (h - size) / 2 - 7), size };
}

function cellScreenPosition(c, layout = layoutPlanet()) {
  const centerX = layout.left + layout.size / 2;
  const centerY = layout.top + layout.size / 2;
  const localX = (c.x + .5 - planet.cols / 2) * layout.cell;
  const localY = (c.y + .5 - planet.rows / 2) * layout.cell;
  const cos = Math.cos(planet.rotation);
  const sin = Math.sin(planet.rotation);
  return { x: centerX + localX * cos - localY * sin, y: centerY + localX * sin + localY * cos };
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.fillStyle = "#07111d";
  ctx.fillRect(0, 0, w, h);
  const l = layoutPlanet();
  const centerX = l.left + l.size / 2;
  const centerY = l.top + l.size / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(planet.rotation);
  for (const c of planet.cells) {
    if (!c.alive) continue;
    const damage = 1 - c.hp / c.maxHp;
    ctx.fillStyle = damage > 0.65 ? "#402d36" : (planet.theme.colors[c.type] || materials[c.type].color);
    const x = (c.x + .5 - planet.cols / 2) * l.cell;
    const y = (c.y + .5 - planet.rows / 2) * l.cell;
    ctx.fillRect(x - l.cell / 2 - .12, y - l.cell / 2 - .12, l.cell + .24, l.cell + .24);
  }
  ctx.restore();
  if (target) {
    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const targetCell = nearestAliveTarget(target);
    const pos = targetCell ? cellScreenPosition(targetCell, l) : null;
    if (pos) ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const shot of shots) {
    ctx.fillStyle = "#fff0a4";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, Math.max(1.5, l.cell * .28), Math.max(1.5, l.cell * .28));
  }
  ctx.globalAlpha = 1;
}

function nearestAliveTarget(desired) {
  let best = null;
  let bestDist = Infinity;
  for (const c of planet.cells) {
    if (!c.alive) continue;
    const d = Math.hypot(c.x - desired.x, c.y - desired.y);
    if (d < bestDist) { best = c; bestDist = d; }
  }
  return best;
}

function spawnShot() {
  const l = layoutPlanet();
  const aim = nearestAliveTarget(target || { x: planet.cols / 2, y: planet.rows - 1 });
  if (!aim) return;
  const pos = cellScreenPosition(aim, l);
  const tx = pos.x;
  const ty = pos.y;
  const sx = canvas.clientWidth / 2;
  const sy = canvas.clientHeight + 8;
  shots.push({ x: sx, y: sy, tx, ty, cell: aim, speed: 850 });
}

function hitPlanet(cell, x, y) {
  const l = layoutPlanet();
  let reward = 0;
  let mineralReward = 0;
  const splash = splashPercent();
  const maxRing = Math.ceil(splash / 100);
  for (const c of planet.cells) {
    if (!c.alive) continue;
    const ring = Math.max(Math.abs(c.x - cell.x), Math.abs(c.y - cell.y));
    if (ring > maxRing) continue;
    const damageFactor = ring === 0 ? 1 : Math.max(0, Math.min(1, (splash - (ring - 1) * 100) / 100));
    if (damageFactor <= 0) continue;
    c.hp -= weaponDamage() * damageFactor;
    if (c.hp <= 0) {
      c.alive = false;
      planet.remaining--;
      reward += materials[c.type].value * worldScale();
      mineralReward += materials[c.type].minerals;
      const pos = cellScreenPosition(c, l);
      for (let i = 0; i < 2; i++) particles.push({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - .5) * 60,
        vy: (Math.random() - .5) * 60,
        life: 1,
        color: planet.theme.colors[c.type] || materials[c.type].color,
      });
    }
  }
  if (reward > 0) {
    state.money += reward;
    showToast(`Credits +${formatNumber(reward)}`);
  }
  if (mineralReward > 0) {
    state.minerals += mineralReward;
  }
  if (planet.remaining <= 0) completeWorld();
}

function completeWorld() {
  const bonus = 350 * Math.pow(1.55, state.world - 1);
  state.money += bonus;
  state.world++;
  state.rooms.forEach((room, i) => {
    room.progress = 0;
    room.ready = false;
    room.autoPurchased = false;
    if (i > 0) { room.level = 0; room.unlocked = false; }
    else room.level = Math.max(1, room.level);
  });
  showToast(`World cleared! +${formatNumber(bonus)}`);
  createPlanet();
  renderUI();
  openCrate("planet");
}

function update(dt) {
  planet.rotation = (planet.rotation + dt * Math.PI * 2 / ROTATION_PERIOD) % (Math.PI * 2);
  planet.shotClock += dt;
  if (planet.shotClock >= fireInterval()) {
    planet.shotClock %= fireInterval();
    spawnShot();
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    const dx = s.tx - s.x;
    const dy = s.ty - s.y;
    const dist = Math.hypot(dx, dy);
    const step = s.speed * dt;
    if (dist <= step) {
      hitPlanet(s.cell, s.tx, s.ty);
      shots.splice(i, 1);
    } else {
      s.x += dx / dist * step;
      s.y += dy / dist * step;
    }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 1.7;
    if (p.life <= 0) particles.splice(i, 1);
  }
  roomDefs.forEach((def, i) => {
    const room = state.rooms[i];
    if (!room.unlocked || room.ready) return;
    room.progress += dt / def.cycle;
    if (room.progress >= 1) {
      room.progress = 1;
      if (room.crewLevel >= def.autoLevel && room.autoPurchased) {
        state.money += roomIncome(i);
        room.progress = 0;
      } else room.ready = true;
    }
  });
  autosaveClock += dt;
  if (autosaveClock > 5) { autosaveClock = 0; saveState(); }
}

function gameLoop(now) {
  const elapsed = Math.min(.12, (now - lastTime) / 1000);
  lastTime = now;
  if (!document.hidden) update(elapsed);
  if (now - lastRender >= FRAME_MS) {
    lastRender = now - ((now - lastRender) % FRAME_MS);
    draw();
    refreshDynamicUI();
  }
  requestAnimationFrame(gameLoop);
}

function roomCard(i) {
  const def = roomDefs[i];
  const room = state.rooms[i];
  if (!room.unlocked) {
    return `<article class="room room--locked"><div class="room__top"><div class="room__icon">🔒</div><div class="room__info"><h3 class="room__name">${def.name}</h3><span class="room__level">Unlock ${formatNumber(def.unlock * worldScale())}</span></div></div><button class="action unlock-room" data-room="${i}">UNLOCK<small>${formatNumber(def.unlock * worldScale())}</small></button></article>`;
  }
  const qualified = room.crewLevel >= def.autoLevel;
  const auto = qualified && room.autoPurchased;
  const autoButton = auto
    ? `<button class="action action--auto" disabled>AUTO ACTIVE</button>`
    : `<button class="action action--auto buy-auto" data-room="${i}" ${qualified ? "" : "disabled"}>${qualified ? "ACTIVATE AUTO" : `REQUIRES ${def.crew.toUpperCase()} LV.${def.autoLevel}`}<small>${qualified ? formatNumber(roomAutoCost(i)) : "CREW REQUIRED"}</small></button>`;
  const milestone = isNextRoomLevelMilestone(i);
  return `<article class="room" data-room-card="${i}">
    <div class="room__top">
      <div class="room__icon">${def.icon}</div>
      <div class="room__info"><h3 class="room__name">${def.name}</h3><div class="room__income">+${formatNumber(roomIncome(i))} / ${def.cycle}s</div><span class="room__level">LEVEL ${room.level}</span></div>
      <div class="crew"><div class="crew__portrait">${room.crewLevel ? "👤" : "+"}</div><small class="${auto ? "auto" : ""}">${auto ? "AUTO" : `${def.crew} ${room.crewLevel}/${def.autoLevel}`}</small></div>
    </div>
    <div class="progress"><i data-progress="${i}"></i></div>
    <div class="room__actions">
      <button class="action action--secondary collect-room" data-room="${i}" ${room.ready ? "" : "disabled"}>${room.ready ? `COLLECT ${formatNumber(roomIncome(i))}` : "PRODUCING"}</button>
      <button class="action upgrade-room" data-room="${i}">${milestone ? "MILESTONE ×2" : "UPGRADE"}<small>${formatNumber(roomUpgradeCost(i))}${milestone ? " · 1 CREW CARD" : ""}</small></button>
      ${autoButton}
    </div>
  </article>`;
}

function renderRooms() {
  roomsEl.innerHTML = roomDefs.map((_, i) => roomCard(i)).join("");
}

function renderWeaponMenu() {
  document.querySelector("#weaponStats").innerHTML = `
    <div class="stat"><strong>${weaponDamage().toFixed(1)}</strong><small>DAMAGE</small></div>
    <div class="stat"><strong>${(1 / fireInterval()).toFixed(1)}/s</strong><small>FIRE RATE</small></div>
    <div class="stat"><strong>${splashPercent()}%</strong><small>SPLASH</small></div>`;
  const data = [
    ["damage", "Damage", "+10% damage"],
    ["speed", "Fire Rate", "+10% firing speed"],
    ["splash", "Splash", "+10 percentage points"],
  ];
  document.querySelector("#weaponUpgrades").innerHTML = data.map(([key, name, desc]) => `<div class="upgrade"><div><strong>${name} Lv.${state.weapon[key]}</strong><p>${desc}</p></div><button class="action weapon-upgrade" data-type="${key}">UPGRADE<small>${formatNumber(weaponCost(key))}</small></button></div>`).join("");
}

function renderCrewMenu() {
  document.querySelector("#crewList").innerHTML = roomDefs.map((def, i) => {
    const room = state.rooms[i];
    const needed = cardsRequired(i);
    const canUpgrade = state.crewCards[i] >= needed && state.minerals >= crewUpgradeCost(i);
    return `<article class="crew-card">
      <div class="crew-card__portrait">👤</div>
      <div><strong>${def.crew} · Lv.${room.crewLevel}</strong><p>${def.name} income ×${(1 + room.crewLevel * .5).toFixed(1)} · Cards ${state.crewCards[i]}/${needed}</p></div>
      <button type="button" class="action crew-upgrade" data-room="${i}" ${canUpgrade ? "" : "disabled"}>LEVEL UP<small>◆ ${formatNumber(crewUpgradeCost(i))}</small></button>
    </article>`;
  }).join("");
  refreshCrateUI();
}

function refreshCrateUI() {
  const remaining = Math.max(0, state.nextFreeCrateAt - Date.now());
  const button = document.querySelector("#freeCrate");
  const label = document.querySelector("#freeCrateTimer");
  if (!button || !label) return;
  button.disabled = remaining > 0;
  if (remaining <= 0) label.textContent = "READY";
  else {
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    label.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  const adButton = document.querySelector("#adCrate");
  if (adButton) {
    const adRemaining = Math.max(0, state.nextAdCrateAt - Date.now());
    adButton.disabled = adRemaining > 0;
    const adLabel = adButton.querySelector("small");
    if (adRemaining <= 0) adLabel.textContent = "WATCH AD · PROTOTYPE";
    else adLabel.textContent = `AVAILABLE IN ${Math.ceil(adRemaining / 60000)} MIN`;
  }
}

function openCrate(kind) {
  const config = {
    free: { cards: 3, minerals: 15, label: "Free Supply Pod" },
    ad: { cards: 6, minerals: 30, label: "Rewarded Crate" },
    mineral: { cards: 9, minerals: 0, label: "Mineral Crate" },
    planet: { cards: 5, minerals: 25, label: "Planet Chest" },
  }[kind];
  if (!config) return;
  for (let n = 0; n < config.cards; n++) {
    const i = Math.floor(Math.random() * roomDefs.length);
    state.crewCards[i]++;
  }
  state.minerals += config.minerals;
  showToast(`${config.label}: ${config.cards} cards${config.minerals ? ` + ◆${config.minerals}` : ""}`);
  renderCrewMenu();
  renderRooms();
  saveState();
}

function renderUI() {
  worldLabel.textContent = state.world;
  renderRooms();
  renderWeaponMenu();
  renderCrewMenu();
  refreshDynamicUI();
}

function refreshDynamicUI() {
  moneyLabel.textContent = formatNumber(state.money);
  mineralLabel.textContent = formatNumber(state.minerals);
  planetPercent.textContent = `${Math.ceil(planet.remaining / planet.total * 100)}%`;
  roomDefs.forEach((_, i) => {
    const room = state.rooms[i];
    const bar = document.querySelector(`[data-progress="${i}"]`);
    if (bar) bar.style.width = `${room.progress * 100}%`;
    const collect = document.querySelector(`.collect-room[data-room="${i}"]`);
    if (collect) {
      collect.disabled = !room.ready;
      collect.textContent = room.ready ? `COLLECT ${formatNumber(roomIncome(i))}` : "PRODUCING";
    }
  });
  refreshCrateUI();
}

function spend(amount) {
  if (state.money + 1e-9 < amount) { showToast("Not enough credits"); return false; }
  state.money -= amount;
  return true;
}

function showToast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("toast--show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("toast--show"), 1500);
}

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const l = layoutPlanet();
  const centerX = l.left + l.size / 2;
  const centerY = l.top + l.size / 2;
  const screenX = event.clientX - rect.left - centerX;
  const screenY = event.clientY - rect.top - centerY;
  const cos = Math.cos(-planet.rotation);
  const sin = Math.sin(-planet.rotation);
  const localX = screenX * cos - screenY * sin;
  const localY = screenX * sin + screenY * cos;
  const x = localX / l.cell + planet.cols / 2 - .5;
  const y = localY / l.cell + planet.rows / 2 - .5;
  const picked = nearestAliveTarget({ x, y });
  if (picked) target = { x: picked.x, y: picked.y };
});

document.querySelector("#scrollEconomy").addEventListener("click", () => document.querySelector("#economy").scrollIntoView());
document.querySelector("#openWeapons").addEventListener("click", () => { renderWeaponMenu(); weaponDialog.showModal(); });
document.querySelector("#openCrew").addEventListener("click", () => { renderCrewMenu(); crewDialog.showModal(); });
document.querySelector("#freeCrate").addEventListener("click", () => {
  if (Date.now() < state.nextFreeCrateAt) return;
  state.nextFreeCrateAt = Date.now() + FREE_CRATE_COOLDOWN;
  openCrate("free");
});
document.querySelector("#adCrate").addEventListener("click", () => {
  if (Date.now() < state.nextAdCrateAt) return;
  state.nextAdCrateAt = Date.now() + 30 * 60 * 1000;
  openCrate("ad");
});
document.querySelector("#mineralCrate").addEventListener("click", () => {
  if (state.minerals < 100) { showToast("Not enough minerals"); return; }
  state.minerals -= 100;
  openCrate("mineral");
});
document.querySelector("#resetGame").addEventListener("click", () => {
  if (!confirm("Reset all progress and start again from World 1?")) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  shots = [];
  particles = [];
  target = null;
  createPlanet();
  renderUI();
  saveState();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Save reset — World 1");
});

document.addEventListener("click", (event) => {
  const upgrade = event.target.closest(".upgrade-room");
  if (upgrade) {
    const i = Number(upgrade.dataset.room);
    const cost = roomUpgradeCost(i);
    if (spend(cost)) {
      state.rooms[i].level++;
      if (state.rooms[i].level % 10 === 0) {
        state.crewCards[i]++;
        showToast(`${roomDefs[i].name} milestone ×2 + 1 ${roomDefs[i].crew} card`);
      }
      renderRooms();
      renderCrewMenu();
    }
  }
  const collect = event.target.closest(".collect-room");
  if (collect) {
    const i = Number(collect.dataset.room);
    const room = state.rooms[i];
    if (room.ready) { state.money += roomIncome(i); room.ready = false; room.progress = 0; renderRooms(); }
  }
  const unlock = event.target.closest(".unlock-room");
  if (unlock) {
    const i = Number(unlock.dataset.room);
    const cost = roomDefs[i].unlock * worldScale();
    if (spend(cost)) { state.rooms[i].unlocked = true; state.rooms[i].level = 1; renderRooms(); showToast(`${roomDefs[i].name} unlocked`); }
  }
  const weapon = event.target.closest(".weapon-upgrade");
  if (weapon) {
    const type = weapon.dataset.type;
    const cost = weaponCost(type);
    if (spend(cost)) { state.weapon[type]++; renderWeaponMenu(); }
  }
  const auto = event.target.closest(".buy-auto");
  if (auto) {
    const i = Number(auto.dataset.room);
    const room = state.rooms[i];
    const def = roomDefs[i];
    if (room.crewLevel < def.autoLevel) showToast(`${def.crew} must reach level ${def.autoLevel}`);
    else if (spend(roomAutoCost(i))) {
      room.autoPurchased = true;
      room.ready = false;
      room.progress = 0;
      renderRooms();
      showToast(`${def.name} automation activated`);
    }
  }
  const crewUpgrade = event.target.closest(".crew-upgrade");
  if (crewUpgrade) {
    const i = Number(crewUpgrade.dataset.room);
    const needed = cardsRequired(i);
    const mineralCost = crewUpgradeCost(i);
    if (state.crewCards[i] < needed) showToast("Not enough character cards");
    else if (state.minerals < mineralCost) showToast("Not enough minerals");
    else {
      state.crewCards[i] -= needed;
      state.minerals -= mineralCost;
      state.rooms[i].crewLevel++;
      renderCrewMenu();
      renderRooms();
      showToast(`${roomDefs[i].crew} reached level ${state.rooms[i].crewLevel}`);
    }
  }
  const slot = event.target.closest(".weapon-slot--empty");
  if (slot) showToast("Extra weapons arrive in the next prototype");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveState();
  else lastTime = performance.now();
});
window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", saveState);

function applyOfflineProgress() {
  const away = Math.min(4 * 3600, Math.max(0, (Date.now() - (state.lastSeen || Date.now())) / 1000));
  let earned = 0;
  roomDefs.forEach((def, i) => {
    const room = state.rooms[i];
    if (room.unlocked && room.crewLevel >= def.autoLevel && room.autoPurchased) earned += away / def.cycle * roomIncome(i);
  });
  if (earned >= 1) { state.money += earned; setTimeout(() => showToast(`Offline income +${formatNumber(earned)}`), 300); }
}

applyOfflineProgress();
createPlanet();
resizeCanvas();
renderUI();
requestAnimationFrame(gameLoop);
