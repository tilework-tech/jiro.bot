'use strict';
// Arcade-only decoration. All original collision geometry, timing and input stay in the engines.
(() => {
  const baseFloor = ART.mazeFloor, baseTiles = ART.mazeTiles, baseHud = ART.mazeHud;
  const palette = { bg:'#13232d', floor:'#182f3b', wall:'#304e5c', edge:'#789399' };

  function waves(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
    ctx.strokeStyle = '#496370'; ctx.lineWidth = 0.7;
    for (let row = 0; row < height / 16 + 2; row++) {
      for (let col = -1; col < width / 32 + 1; col++) {
        const cx = x + col * 32 + (row % 2) * 16, cy = y + row * 16;
        for (const r of [6, 11, 16]) { ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, TAU); ctx.stroke(); }
      }
    }
    ctx.restore();
  }

  ART.runnerBg = (g, ctx) => {
    ctx.save();
    ctx.fillStyle = '#13232d'; ctx.fillRect(0, 0, g.W, g.H);
    // Quiet noren curtain and a timber rail, above the jump path.
    ctx.fillStyle = '#213d4c';
    for (let x = 160; x < 460; x += 75) ctx.fillRect(x, 0, 71, 81);
    ctx.fillStyle = '#c9d0c5'; ctx.textAlign = 'center'; ctx.font = '18px "Arcade JP", serif';
    ['寿','司','処',''].forEach((s, i) => ctx.fillText(s, 195 + i * 75, 57));
    ctx.fillStyle = '#86664d'; ctx.fillRect(0, 91, g.W, 3);
    // Two small paper lanterns; deliberately static and away from hazards.
    for (const x of [117, 506]) {
      ctx.strokeStyle = '#987f60'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 53); ctx.stroke();
      ctx.fillStyle = '#c46448'; ell(ctx, x, 70, 12, 18); ctx.fill();
      ctx.strokeStyle = '#ecaa78';
      for (const y of [60, 67, 74, 81]) { ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.stroke(); }
      ctx.fillStyle = '#332a26'; ctx.fillRect(x - 7, 51, 14, 3); ctx.fillRect(x - 7, 86, 14, 3);
    }
    ctx.fillStyle = '#1b303b'; ctx.fillRect(0, 160, g.W, 42);
    ctx.strokeStyle = '#34505b'; ctx.lineWidth = 1;
    for (let x = -(g.dist * .12 % 96); x < g.W; x += 96) {
      ctx.beginPath(); ctx.moveTo(x, 160); ctx.lineTo(x, 202); ctx.stroke();
    }
    ctx.restore();
  };
  ART.runnerGround = (g, ctx) => {
    ctx.save();
    ctx.fillStyle = '#795d44'; ctx.fillRect(0, g.ground, g.W, g.H - g.ground);
    ctx.strokeStyle = '#a68963'; ctx.lineWidth = 1;
    for (let y = g.ground + 9; y < g.H; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(g.W, y); ctx.stroke();
    }
    ctx.restore();
  };

  // Pass a drawing-only view so map themes and seeded game state are never mutated.
  const themed = m => Object.assign(Object.create(m), { theme:palette });
  ART.mazeFloor = (m, ctx) => {
    ctx.save(); baseFloor(themed(m), ctx);
    const right = m.ox + m.cols * m.ts;
    waves(ctx, right + 12, m.H - 62, m.W - right - 24, 48);
    ctx.restore();
  };
  ART.mazeTiles = (m, ctx) => { ctx.save(); baseTiles(themed(m), ctx); ctx.restore(); };
  ART.mazeHud = (m, ctx) => {
    ctx.save(); baseHud(m, ctx);
    const x = m.ox + m.cols * m.ts + 18;
    ctx.fillStyle = '#ecaa78'; ctx.font = '12px "Arcade JP", serif'; ctx.textAlign = 'left';
    ctx.fillText(m.o.boss ? 'ふぐ · PUFFER' : '本日の巻物', x, m.H - 76);
    ctx.restore();
  };
})();
