#!/usr/bin/env python3
"""Check the current scroll buddy preview in the session's headed Chrome.

Run with: uv run --no-project --with playwright python qa/check_motion.py
The preview server should be listening on port 4320 and the session browser on 9222.
"""

import argparse
import json

from playwright.sync_api import sync_playwright


def snapshot(page):
    return page.evaluate(
        """() => {
          const buddy = document.querySelector('.jiro-buddy');
          return {
            moves: window.jiroMoves.splice(0),
            direction: buddy.dataset.jiroDirection,
            idle: buddy.dataset.jiroMotion,
            state: buddy.dataset.jiroState,
            bubbleHidden: buddy.querySelector('.jiro-buddy__bubble').hidden
          };
        }"""
    )


def check_pass(page, direction):
    page.evaluate(
        "direction => window.scrollTo({top: direction === 'down' ? document.documentElement.scrollHeight : 0, behavior: 'instant'})",
        direction,
    )
    page.wait_for_timeout(8300)
    result = snapshot(page)
    labels = [event["move"] for event in result["moves"]]
    assert result["direction"] == direction, result
    assert sum(label.startswith("large-") for label in labels) >= 1, result
    assert sum(label.startswith("small-") for label in labels) >= 2, result
    assert result["idle"] == "game" and result["state"] == "idle", result
    assert result["bubbleHidden"], result
    print(direction, json.dumps(result))


def check_heading_clearance(page, width):
    page.set_viewport_size({"width": width, "height": 844 if width < 768 else 900})
    page.goto(page.url.split("?", 1)[0] + "?qa=" + str(width))
    page.wait_for_timeout(1200)
    for section_id in ("hero", "pricing", "bakeoff"):
        page.evaluate(
            """id => {
              const r = document.getElementById(id).getBoundingClientRect();
              window.scrollTo({top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant'});
            }""",
            section_id,
        )
        page.wait_for_timeout(4300)
        collision = page.evaluate(
            """id => {
              const section = document.getElementById(id);
              const mascot = document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
              return [...section.querySelectorAll('h1,h2,h3')].some(heading => {
                const range = document.createRange();
                range.selectNodeContents(heading);
                return [...range.getClientRects()].some(r =>
                  r.width && r.height && mascot.left < r.right && mascot.right > r.left &&
                  mascot.top < r.bottom && mascot.bottom > r.top);
              });
            }""",
            section_id,
        )
        assert not collision, f"Jiro covers a heading in {section_id} at {width}px"
    print(f"heading clearance {width}px: clear")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:4320/")
    parser.add_argument("--cdp", default="http://127.0.0.1:9222")
    args = parser.parse_args()
    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(args.cdp)
        page = browser.contexts[0].new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.set_viewport_size({"width": 1440, "height": 900})
            page.goto(args.url)
            page.wait_for_timeout(1200)
            page.evaluate(
                """() => {
                  window.jiroMoves = [];
                  const buddy = document.querySelector('.jiro-buddy');
                  new MutationObserver(() => window.jiroMoves.push({
                    move: buddy.dataset.jiroMove,
                    direction: buddy.dataset.jiroDirection
                  })).observe(buddy, {attributes: true, attributeFilter: ['data-jiro-move']});
                }"""
            )
            check_pass(page, "down")
            check_pass(page, "up")
            check_heading_clearance(page, 1440)
            check_heading_clearance(page, 390)
            assert not errors, errors
            print("PASS: motion quotas, game idle, silent comments, heading clearance, no page errors")
        finally:
            page.close()
            browser.close()


if __name__ == "__main__":
    main()
