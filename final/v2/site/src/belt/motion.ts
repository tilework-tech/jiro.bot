/**
 * The belt's speed along its journey, in world units per second. It crawls forward at rest speed forever, and runs
 * half again as fast while the page glides from one scene to the next ("it registered the scroll"). Never backwards.
 */
export function createJourney(opts: { restSpeed?: number } = {}) {
  const restSpeed = opts.restSpeed ?? 6;
  const FAST = restSpeed * 1.5;
  let speed = restSpeed;
  let travel = 0;
  let gliding = false;

  return {
    restSpeed,
    /** The page started (true) or finished (false) gliding to a scene. */
    glide(on: boolean) { gliding = on; },
    tick(dt: number) {
      const target = gliding ? FAST : restSpeed;
      speed += (target - speed) * Math.min(1, dt * (gliding ? 10 : 4));
      speed = Math.min(Math.max(speed, restSpeed * 0.25), FAST);
      travel += speed * dt;
    },
    state: () => ({ speed, travel }),
  };
}
