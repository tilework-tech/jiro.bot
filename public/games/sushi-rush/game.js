'use strict';
/*
 * Sushi Rush: 12-second runner stages; every 3rd stage is a maze boss fight against the Giant Puffer.
 * Runner stages use Runner (shared/engine.js); the boss uses Maze with a single giant puffer ghost.
 * Events emitted here (in addition to the engine's): 'stage' {stage}, 'bossStart' {stage}, 'bossWin' {stage}.
 */
const RUSH_W = 640, RUSH_H = 300, STAGE_SECONDS = 12, BOSS_RICE = 40;

class Rush {
  constructor(W, H) { this.W = W; this.H = H; this.cssFilter = ''; this.reset(); }
  get score() { return this.cur.score; }
  get over() { return this.cur.over; }
  get overMsg() { return this.cur.overMsg; }
  get keys() { return this.cur.keys; }
  set keys(v) { this.cur.keys = v; if (this.cur.p) this.cur.p.duck = false; }
  reset() { this.stage = 1; this.carry = 0; this.newRunner(); }
  newRunner() {
    const self = this, stage = this.stage;
    this.phase = 'run';
    this.cur = new Runner(this.W, this.H, {
      id: 'rush', speed: 310 + stage * 22, rush: this,
      hud: (g) => [`Stage ${stage}`, (stage % 3 === 2 ? 'Boss next! ' : '') + `${Math.max(0, Math.ceil(STAGE_SECONDS - g.t))}s`],
      update(g) {
        if (g.t >= STAGE_SECONDS && !g.over) {
          self.carry = g.score; self.stage++;
          if ((self.stage - 1) % 3 === 0) self.startBoss();
          else { self.newRunner(); self.cur.say(`Stage ${self.stage}`); EVT.emit('stage', { rush: self, stage: self.stage }); }
        }
      },
    });
    this.cur.score = this.carry;
  }
  startBoss() {
    const self = this;
    this.phase = 'boss';
    this.cur = new Maze(this.W, this.H, {
      id: 'rush', lives: 1, maps: [MAPS.counter], caughtMsg: 'The Giant Puffer got you', noLives: true, rush: this, boss: true,
      ghosts: [cast('puffer', { label: 'GIANT PUFFER', boss: true, wait: 1.5, speed: 4.4, jitter: 0.2, size: 1.35, hitR: 0.85, baseHitR: 0.85 })],
      onRice(m) {
        if (m.eaten >= BOSS_RICE) {
          self.carry = m.score + 500; const beaten = self.stage; self.stage++;
          EVT.emit('bossWin', { rush: self, stage: beaten });
          self.newRunner(); self.cur.say('Boss beaten! +500');
        }
      },
      hud: (m) => [['BOSS STAGE', '#f2cc60'], `Eat ${Math.max(0, BOSS_RICE - m.eaten)} more rice`, ['One hit and you are out', '#9c8a74']],
    });
    this.cur.score = this.carry;
    // boss.js plays the full-screen boss intro on 'bossStart', so no engine banner here.
    EVT.emit('bossStart', { rush: this, stage: this.stage });
  }
  update(dt) { this.cur.update(dt); }
  draw(ctx) { this.cur.draw(ctx); }
  input(c, d) { this.cur.input(c, d); }
  tap() { this.cur.tap && this.cur.tap(); }
  swipe(d) { this.cur.swipe && this.cur.swipe(d); }
}

Shell.init({ canvas: document.getElementById('game'), id: 'rush', make: () => new Rush(RUSH_W, RUSH_H) });
