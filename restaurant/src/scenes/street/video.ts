import type { Api } from "../../engine/types";

const VIDEO = "video/street-clean.mp4";
const POSTER = "art/street/street-poster.png";
const LOOP_SECONDS = 7;
const INACTIVE_MS = 500;
const mod = (value: number, period: number) => ((value % period) + period) % period;

let video: HTMLVideoElement | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let lastDraw = -Infinity;
let lastClock = 0;
let lastDriftCheck = -Infinity;
let frozen = false;
let failed = false;
let playPending = false;
let retryPlayAfter = 0;
let needsSync = true;
let requestedSeek: number | undefined;

// The canvas may draw this room through either adjoining transition, so its
// lifetime follows draws rather than scene enter/leave callbacks.
function checkInactive() {
  const remaining = INACTIVE_MS - (performance.now() - lastDraw);
  if (remaining > 0) {
    idleTimer = setTimeout(checkInactive, remaining);
    return;
  }
  idleTimer = undefined;
  video?.pause();
  needsSync = true;
}

function duration(v: HTMLVideoElement) {
  return Number.isFinite(v.duration) && v.duration > 0
    ? Math.min(LOOP_SECONDS, v.duration)
    : LOOP_SECONDS;
}

function seek(v: HTMLVideoElement, target: number) {
  if (v.readyState < 1 || v.seeking) return;
  // Repeated draws of a debug frame must not restart an in-flight seek.
  if (requestedSeek !== target && Math.abs(v.currentTime - target) > 1 / 48) {
    requestedSeek = target;
    v.currentTime = target;
  }
  needsSync = false;
}

function play(v: HTMLVideoElement) {
  if (playPending || !v.paused || failed || performance.now() < retryPlayAfter) return;
  playPending = true;
  // Muted inline playback normally starts without a gesture. Handle browser
  // rejection quietly, preserving the poster/last frame and bounding retries.
  void v.play().catch(() => {
    retryPlayAfter = performance.now() + 2000;
  }).finally(() => { playPending = false; });
}

function media(): HTMLVideoElement {
  if (video) return video;
  const v = document.createElement("video");
  video = v;
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.loop = true;
  v.preload = "auto";
  v.poster = `${import.meta.env.BASE_URL}${POSTER}`;
  v.setAttribute("playsinline", "");
  v.setAttribute("muted", "");
  v.addEventListener("loadeddata", () => {
    if (performance.now() - lastDraw >= INACTIVE_MS) return;
    seek(v, mod(lastClock, duration(v)));
    if (!frozen) play(v);
  });
  v.addEventListener("error", () => {
    failed = true;
    v.pause();
  });
  v.src = `${import.meta.env.BASE_URL}${VIDEO}`;
  v.load();
  return v;
}

/** Draw the recorded perspective at native playback speed, independent of scroll. */
export function drawStreetVideo(g: CanvasRenderingContext2D, now: number, api: Api): boolean {
  const wallTime = performance.now();
  const fixed = new URLSearchParams(location.search).get("t");
  const fixedTime = fixed === null || fixed.trim() === "" ? NaN : Number(fixed);
  const shouldFreeze = api.reducedMotion || Number.isFinite(fixedTime);
  lastClock = Number.isFinite(fixedTime) ? fixedTime : api.reducedMotion ? 3 : now;
  if (shouldFreeze !== frozen) {
    needsSync = true;
    requestedSeek = undefined;
  }
  frozen = shouldFreeze;
  lastDraw = wallTime;
  if (idleTimer === undefined) idleTimer = setTimeout(checkInactive, INACTIVE_MS);

  const v = media();
  if (!failed) {
    const loop = duration(v);
    const target = mod(lastClock, loop);
    if (frozen) {
      v.pause();
      seek(v, target);
    } else {
      // Native media playback supplies all normal frames. Correct only a large
      // drift (e.g. background-tab suspension), never seek on each animation tick.
      if (wallTime - lastDriftCheck > 1000) {
        lastDriftCheck = wallTime;
        const distance = Math.abs(v.currentTime - target);
        if (Math.min(distance, loop - distance) > 1) needsSync = true;
      }
      if (needsSync) {
        requestedSeek = undefined;
        seek(v, target);
      }
      play(v);
    }
  }

  g.save();
  g.imageSmoothingEnabled = false;
  if (!failed && v.readyState >= 2 && v.videoWidth > 0) {
    g.drawImage(v, 0, 0, 1920, 1080);
    g.restore();
    return true;
  }
  const poster = api.img(POSTER);
  if (poster.complete && poster.naturalWidth) g.drawImage(poster, 0, 0, 1920, 1080);
  g.restore();
  return false;
}
