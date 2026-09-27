"use strict";

const FPS = 30;
const FRAME_MS = 1000 / FPS;
const PLANET_DENSITY_SCALE = 51 / 35;
const SAVE_KEY = "planet-breaker-prototype-v1";
const materials = {
  crust: { hp: 4, color: "#ef7a2d", value: 0 },
  rock: { hp: 12, color: "#bb5630", value: 0 },
  iron: { hp: 30, color: "#667687", value: 1.2 },
  crystal: { hp: 18, color: "#884cf4", value: 9 },
  gold: { hp: 22, color: "#ffc936", value: 18 },
  core: { hp: 55, color: "#9d2945", value: 2.5 },
};

const roomDefs = [
  { name: "Mining Bay", icon: "⛏", base: 8, cycle: 2.0, unlock: 0, crew: "Mara", autoLevel: 1, autoCost: 250 },
  { name: "Refinery", icon: "▣", base: 55, cycle: 4.0, unlock: 700, crew: "Kip", autoLevel: 2, autoCost: 4200 },
  { name: "Trade Deck", icon: "↗", base: 310, cycle: 7.0, unlock: 9000, crew: "Vex", autoLevel: 3, autoCost: 52000 },
  { name: "Cargo Exchange", icon: "◆", base: 1800, cycle: 12.0, unlock: 85000, crew: "Unit-8", autoLevel: 4, autoCost: 480000 },
  { name: "Quantum Bank", icon: "◎", base: 12000, cycle: 20.0, unlock: 750000, crew: "Nyx", autoLevel: 5, autoCost: 4200000 },
];

const defaultState = () => ({
  money: 80,
  world: 1,
  weapon: { damage: 1, speed: 1, splash: 1 },
  rooms: roomDefs.map((r, i) => ({ level: i === 0 ? 1 : 0, unlocked: i === 0, progress: 0, ready: false, crewLevel: i === 0 ? 1 : 0, autoPurchased: false })),
  slots: { left: false, right: false },
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
const worldLabel = document.querySelector("#worldLabel");
const planetPercent = document.querySelector("#planetPercent");
const planetName = document.querySelector("#planetName");
const weaponDialog = document.querySelector("#weaponDialog");

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
function roomUpgradeCost(i) { return roomDefs[i].base * 6 * Math.pow(1.16, state.rooms[i].level) * worldScale(); }
function roomAutoCost(i) { return roomDefs[i].autoCost * worldScale(); }
function weaponCost(type) {
  const level = state.weapon[type];
  const bases = { damage: 65, speed: 120, splash: 180 };
  return bases[type] * Math.pow(1.72, level - 1) * worldScale();
}
function weaponDamage() { return (3 + state.weapon.damage * 3.5) * Math.pow(1.13, state.world - 1); }
function fireInterval() { return Math.max(0.16, 1.05 * Math.pow(0.9, state.weapon.speed - 1)); }
function splashRadius() { return (0.7 + state.weapon.splash * 0.48) * PLANET_DENSITY_SCALE; }

function createPlanet() {
  const cols = 51;
  const rows = 51;
  const radius = 24.1;
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x + 0.5 - cols / 2;
      const dy = y + 0.5 - rows / 2;
      const distance = Math.hypot(dx, dy);
      if (distance > radius) continue;
      const depth = 1 - distance / radius;
      const roll = Math.random();
      let type = depth > 0.72 ? "core" : depth > 0.3 ? "rock" : "crust";
      if (roll < 0.035) type = "gold";
      else if (roll < 0.085) type = "crystal";
      else if (roll < 0.16 && depth > 0.2) type = "iron";
      const base = materials[type].hp * Math.pow(1.22, state.world - 1);
      cells.push({ x, y, type, hp: base, maxHp: base, alive: true });
    }
  }
  planet = { cols, rows, cells, total: cells.length, remaining: cells.length, shotClock: 0 };
  target = { x: cols / 2, y: rows - 3 };
  planetName.textContent = ["DUST ROCK", "IRON MOON", "VIOLET CORE", "GOLDEN GIANT", "EMBER WORLD"][(state.world - 1) % 5];
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

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.fillStyle = "#07111d";
  ctx.fillRect(0, 0, w, h);
  const l = layoutPlanet();
  for (const c of planet.cells) {
    if (!c.alive) continue;
    const damage = 1 - c.hp / c.maxHp;
    ctx.fillStyle = damage > 0.65 ? "#402d36" : materials[c.type].color;
    ctx.fillRect(l.left + c.x * l.cell + 0.25, l.top + c.y * l.cell + 0.25, l.cell - 0.5, l.cell - 0.5);
  }
  if (target) {
    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(l.left + (target.x + .5) * l.cell, l.top + (target.y + .5) * l.cell, 7, 0, Math.PI * 2);
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
  const tx = l.left + (aim.x + .5) * l.cell;
  const ty = l.top + (aim.y + .5) * l.cell;
  const sx = canvas.clientWidth / 2;
  const sy = canvas.clientHeight + 8;
  shots.push({ x: sx, y: sy, tx, ty, cell: aim, speed: 850 });
}

function hitPlanet(cell, x, y) {
  const radius = splashRadius();
  const l = layoutPlanet();
  let reward = 0;
  for (const c of planet.cells) {
    if (!c.alive) continue;
    const d = Math.hypot(c.x - cell.x, c.y - cell.y);
    if (d > radius) continue;
    c.hp -= weaponDamage() * Math.max(.25, 1 - d / (radius + .5));
    if (c.hp <= 0) {
      c.alive = false;
      planet.remaining--;
      reward += materials[c.type].value * worldScale();
      for (let i = 0; i < 2; i++) particles.push({
        x: l.left + (c.x + .5) * l.cell,
        y: l.top + (c.y + .5) * l.cell,
        vx: (Math.random() - .5) * 60,
        vy: (Math.random() - .5) * 60,
        life: 1,
        color: materials[c.type].color,
      });
    }
  }
  if (reward > 0) {
    state.money += reward;
    showToast(`Minerals +${formatNumber(reward)}`);
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
  saveState();
}

function update(dt) {
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
  return `<article class="room" data-room-card="${i}">
    <div class="room__top">
      <div class="room__icon">${def.icon}</div>
      <div class="room__info"><h3 class="room__name">${def.name}</h3><div class="room__income">+${formatNumber(roomIncome(i))} / ${def.cycle}s</div><span class="room__level">LEVEL ${room.level}</span></div>
      <div class="crew"><div class="crew__portrait">${room.crewLevel ? "👤" : "+"}</div><small class="${auto ? "auto" : ""}">${auto ? "AUTO" : `${def.crew} ${room.crewLevel}/${def.autoLevel}`}</small></div>
    </div>
    <div class="progress"><i data-progress="${i}"></i></div>
    <div class="room__actions">
      <button class="action action--secondary collect-room" data-room="${i}" ${room.ready ? "" : "disabled"}>${room.ready ? `COLLECT ${formatNumber(roomIncome(i))}` : "PRODUCING"}</button>
      <button class="action upgrade-room" data-room="${i}">UPGRADE<small>${formatNumber(roomUpgradeCost(i))}</small></button>
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
    <div class="stat"><strong>${splashRadius().toFixed(1)}</strong><small>SPLASH</small></div>`;
  const data = [
    ["damage", "Damage", "+3.5 direct damage"],
    ["speed", "Fire Rate", "10% faster firing"],
    ["splash", "Splash", "Damage a larger pixel area"],
  ];
  document.querySelector("#weaponUpgrades").innerHTML = data.map(([key, name, desc]) => `<div class="upgrade"><div><strong>${name} Lv.${state.weapon[key]}</strong><p>${desc}</p></div><button class="action weapon-upgrade" data-type="${key}">UPGRADE<small>${formatNumber(weaponCost(key))}</small></button></div>`).join("");
}

function renderUI() {
  worldLabel.textContent = state.world;
  renderRooms();
  renderWeaponMenu();
  refreshDynamicUI();
}

function refreshDynamicUI() {
  moneyLabel.textContent = formatNumber(state.money);
  planetPercent.textContent = `${Math.ceil(planet.remaining / planet.total * 100)}%`;
  roomDefs.forEach((_, i) => {
    const bar = document.querySelector(`[data-progress="${i}"]`);
    if (bar) bar.style.width = `${state.rooms[i].progress * 100}%`;
  });
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
  const x = (event.clientX - rect.left - l.left) / l.cell;
  const y = (event.clientY - rect.top - l.top) / l.cell;
  const picked = nearestAliveTarget({ x, y });
  if (picked) target = { x: picked.x, y: picked.y };
});

document.querySelector("#scrollEconomy").addEventListener("click", () => document.querySelector("#economy").scrollIntoView());
document.querySelector("#openWeapons").addEventListener("click", () => { renderWeaponMenu(); weaponDialog.showModal(); });
document.querySelector("#resetGame").addEventListener("click", () => {
  if (!confirm("Reset the entire prototype?")) return;
  state = defaultState();
  createPlanet();
  renderUI();
  saveState();
});

document.addEventListener("click", (event) => {
  const upgrade = event.target.closest(".upgrade-room");
  if (upgrade) {
    const i = Number(upgrade.dataset.room);
    const cost = roomUpgradeCost(i);
    if (spend(cost)) { state.rooms[i].level++; renderRooms(); }
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
