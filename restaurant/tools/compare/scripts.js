// Transcripts for the two agent windows. Same ticket, same repo, same clock.
// Diff lines: "+" added, "-" removed, " " context, "…" collapsed ("… N more lines (+a −d)").
const TICKET = "Checkout total is wrong when a coupon and a gift card are combined.";

const SCRIPTS = {
  generic: {
    label: "Generic agent",
    steps: [
      { t: "ticket", ms: 400, text: TICKET },
      { t: "say", ms: 1400, text: "I'll fix the checkout total calculation! Let me explore the codebase." },
      { t: "tool", ms: 900, name: "Search", arg: "total|coupon|gift", out: "47 matches in 19 files" },
      { t: "tool", ms: 700, name: "Read", arg: "src/checkout/total.ts (1-20)", out: "20 lines" },
      { t: "say", ms: 2200, text: "I see the issue! The total isn't calculated correctly when a coupon and a gift card are combined. I'll add special handling for this case and make the code more robust." },
      { t: "diff", ms: 2600, file: "src/checkout/total.ts", lines: [
        " import { subtotal } from \"./cart\";",
        "+import { roundMoney } from \"../utils/money\";",
        " ",
        " export function computeTotal(cart: Cart): number {",
        "   let amount = subtotal(cart.items);",
        "+  // Handle coupon + gift card combination",
        "+  const hasCoupon = cart.adjustments.some((a: any) => a.kind === \"percent-off\");",
        "+  const hasGift = cart.adjustments.some((a: any) => a.kind === \"gift-card\");",
        "+  if (hasCoupon && hasGift) {",
        "+    const gc = (cart.adjustments as any).find((a: any) => a.kind === \"gift-card\");",
        "+    const cp = (cart.adjustments as any).find((a: any) => a.kind === \"percent-off\");",
        "+    amount = amount * (1 - cp.percent / 100) - gc.cents;",
        "+    const tax = amount * cart.taxRate;",
        "+    return roundMoney(amount + tax) as any;",
        "+  }",
        "   for (const adj of cart.adjustments) {",
        "-    amount = applyAdjustment(amount, adj);",
        "+    amount = applyAdjustment(amount, adj as any) || 0;",
        "   }",
        "-  const tax = Math.round(amount * cart.taxRate);",
        "-  return amount + tax;",
        "+  const tax = amount * cart.taxRate;",
        "+  return roundMoney(amount + tax);",
        " }",
      ] },
      { t: "diff", ms: 1700, file: "src/checkout/adjustments.ts", lines: [
        " export function applyAdjustment(amount: number, adj: Adjustment) {",
        "+  if (!adj) return amount;",
        "+  if ((adj as any).cents < 0) (adj as any).cents = 0;",
        "   switch (adj.kind) {",
        "     case \"percent-off\":",
        "-      return Math.round(amount * (1 - adj.percent / 100));",
        "+      return amount * (1 - (adj as any).percent / 100);",
        "     case \"amount-off\":",
        "     case \"gift-card\":",
        "       return Math.max(0, amount - adj.cents);",
        "+    default:",
        "+      return amount as any;",
        "   }",
        "… 22 more lines (+19 −6)",
      ] },
      { t: "diff", ms: 900, file: "src/checkout/types.ts", lines: [
        " export interface Cart {",
        "-  adjustments: Adjustment[];",
        "+  adjustments: Adjustment[] | any[];",
        "+  giftCardApplied?: boolean;",
        "+  couponApplied?: boolean;",
        " }",
      ] },
      { t: "diff", ms: 1000, file: "src/utils/money.ts", tag: "(new file)", lines: [
        "+export function roundMoney(value: any): number {",
        "+  return parseFloat(Number(value).toFixed(2));",
        "+}",
        "… 41 more lines (+41 −0)",
      ] },
      { t: "diff", ms: 1100, file: "src/checkout/validate.ts", lines: [
        "+  if (adj.kind === \"gift-card\" && adj.cents <= 0) {",
        "+    console.warn(\"Invalid gift card\", adj);",
        "+    return false;",
        "+  }",
        "… 36 more lines (+27 −9)",
      ] },
      { t: "diff", ms: 1200, file: "src/api/checkout.route.ts", lines: [
        "-  const total = computeTotal(cart);",
        "+  let total: any;",
        "+  try {",
        "+    total = computeTotal(cart as any);",
        "+  } catch (e) {",
        "+    console.log(\"checkout error\", e);",
        "+    total = 0;",
        "+  }",
        "… 30 more lines (+24 −6)",
      ] },
      { t: "run", ms: 2400, cmd: "npm test", out: [
        ["fail", "✗ total.test.ts > rounds to whole cents"],
        ["", "    expected 1082.5 to be 1083"],
        ["fail", "✗ total.test.ts > applies percent coupon before tax"],
        ["", "    expected 5831.99 to be 5832"],
        ["fail", "Tests  2 failed | 110 passed (112)"],
      ] },
      { t: "say", ms: 900, text: "Let me fix these failing tests." },
      { t: "diff", ms: 700, file: "test/checkout/total.test.ts", lines: [
        "-    expect(computeTotal(cart)).toBe(1_083);",
        "+    expect(computeTotal(cart)).toBe(1_082.5);",
      ] },
      { t: "run", ms: 2000, cmd: "npm test", out: [
        ["fail", "✗ total.test.ts > applies percent coupon before tax"],
        ["", "    expected 5831.99 to be 5832"],
        ["fail", "Tests  1 failed | 111 passed (112)"],
      ] },
      { t: "say", ms: 1800, text: "This test seems flaky due to floating point precision. I'll skip it for now so it doesn't block the fix." },
      { t: "diff", ms: 700, file: "test/checkout/total.test.ts", lines: [
        "-  it(\"applies percent coupon before tax\", () => {",
        "+  it.skip(\"applies percent coupon before tax\", () => {",
      ] },
      { t: "run", ms: 1800, cmd: "npm test", out: [
        ["pass", "Tests  111 passed"],
        ["skip", "       1 skipped (112)"],
      ] },
      { t: "run", ms: 1100, cmd: "git diff --stat", out: [["", "__STAT__"]] },
      { t: "final", ms: 2600, title: "Done! All tests pass ✅", lines: [
        ["", "✓ Fixed coupon + gift card calculation"],
        ["", "✓ Added validation and error handling"],
        ["", "✓ Added money utility for precision"],
        ["", "✓ Improved type flexibility"],
        ["", "The checkout total should now be correct! 🎉"],
      ] },
    ],
  },

  jiro: {
    label: "Jiro",
    steps: [
      { t: "ticket", ms: 400, text: TICKET },
      { t: "say", ms: 1200, text: "Reading the checkout path before changing anything." },
      { t: "tool", ms: 1100, name: "Read", arg: "src/checkout/total.ts", out: "12 lines · computeTotal()" },
      { t: "tool", ms: 1100, name: "Read", arg: "src/checkout/adjustments.ts", out: "percent-off · amount-off · gift-card" },
      { t: "tool", ms: 1000, name: "Search", arg: "\"gift-card\"", out: "4 matches · only total.ts applies it" },
      { t: "say", ms: 2600, text: "Adjustments run in the order the customer added them. A gift card added before a coupon shrinks the base that the coupon and the tax are computed on." },
      { t: "say", ms: 900, text: "Writing the failing test first." },
      { t: "diff", ms: 3000, file: "test/checkout/total.test.ts", lines: [
        "-import { makeCart } from \"./fixtures\";",
        "+import { makeCart, type CartInput } from \"./fixtures\";",
        "+",
        "+const COMBO = {",
        "+  items: [{ sku: \"mug\", cents: 10_000 }],",
        "+  taxRate: 0.08,",
        "+  adjustments: [",
        "+    { kind: \"gift-card\", cents: 2_500 },",
        "+    { kind: \"percent-off\", percent: 10 },",
        "+  ],",
        "+} satisfies CartInput;",
        " ",
        " describe(\"computeTotal\", () => {",
        "+  it(\"applies gift cards after coupons and tax\", () => {",
        "+    // $100 − 10% = $90 → +8% tax = $97.20 → −$25 card",
        "+    expect(computeTotal(makeCart(COMBO))).toBe(7_220);",
        "+  });",
        "+",
        "+  it(\"does not depend on adjustment order\", () => {",
        "+    const reversed = [...COMBO.adjustments].reverse();",
        "+    const a = computeTotal(makeCart(COMBO));",
        "+    const b = computeTotal(makeCart({ ...COMBO, adjustments: reversed }));",
        "+    expect(a).toBe(b);",
        "+  });",
      ] },
      { t: "run", ms: 2200, cmd: "pnpm vitest run total", out: [
        ["fail", "✗ applies gift cards after coupons and tax"],
        ["", "    expected 7290 to be 7220"],
        ["fail", "✗ does not depend on adjustment order"],
        ["", "    expected 7290 to be 7020"],
        ["", "Tests  2 failed | 12 passed (14)"],
      ] },
      { t: "say", ms: 700, text: "Reproduced. Now the fix." },
      { t: "diff", ms: 3200, file: "src/checkout/total.ts", lines: [
        "-import { applyAdjustment } from \"./adjustments\";",
        "+import { applyAdjustment, type Adjustment } from \"./adjustments\";",
        " import { subtotal } from \"./cart\";",
        " ",
        "+const isGiftCard = (a: Adjustment) => a.kind === \"gift-card\";",
        "+",
        " export function computeTotal(cart: Cart): number {",
        "-  let amount = subtotal(cart.items);",
        "-  for (const adj of cart.adjustments) {",
        "-    amount = applyAdjustment(amount, adj);",
        "-  }",
        "-  const tax = Math.round(amount * cart.taxRate);",
        "-  return amount + tax;",
        "+  const discounts = cart.adjustments.filter((a) => !isGiftCard(a));",
        "+  const giftCards = cart.adjustments.filter(isGiftCard);",
        "+",
        "+  // Gift cards are payment, not discounts: they apply after",
        "+  // coupons and tax, whatever order the customer added them.",
        "+  const net = discounts.reduce(applyAdjustment, subtotal(cart.items));",
        "+  const taxed = net + Math.round(net * cart.taxRate);",
        "+  return giftCards.reduce(applyAdjustment, taxed);",
        " }",
      ] },
      { t: "run", ms: 2400, cmd: "pnpm test && pnpm tsc --noEmit", out: [
        ["pass", "Test Files  14 passed (14)"],
        ["pass", "Tests  114 passed (114)"],
        ["pass", "tsc: 0 errors"],
      ] },
      { t: "final", ms: 1600, title: "Root cause", cls: "", lines: [
        ["", "Gift cards were applied as discounts, in entry order,"],
        ["", "so coupon and tax ran on an already-reduced base."],
      ] },
      { t: "run", ms: 1300, cmd: "git diff --stat", out: [["", "__STAT__"]] },
      { t: "tool", ms: 1200, name: "Open PR", arg: "fix/gift-card-order → main", out: "#483 created" },
      { t: "final", ms: 3000, title: "PR #483 · Apply gift cards after coupons and tax", cls: "pass", lines: [
        ["", "Gift cards are payment, not discounts. They now apply"],
        ["", "after coupons and tax, in any order. Customers adding"],
        ["", "the card first were overcharged (e.g. $72.90 vs $72.20)."],
        ["dim", "• 2 regression tests · 114/114 passing · tsc clean"],
      ] },
    ],
  },
};

// Fill "git diff --stat" from the diffs above so the numbers can't drift.
for (const s of Object.values(SCRIPTS)) {
  const files = new Set(); let add = 0, del = 0, anys = 0;
  for (const st of s.steps) {
    if (st.t !== "diff") continue;
    files.add(st.file);
    for (const l of st.lines) {
      if (l[0] === "+") add++;
      else if (l[0] === "-") del++;
      else if (l[0] === "…") { const m = l.match(/\(\+(\d+) −(\d+)\)/); if (m) { add += +m[1]; del += +m[2]; } }
      if (l[0] === "+") anys += (l.match(/\bany\b/g) || []).length;
    }
  }
  s.stat = { files: files.size, add, del, anys };
  const txt = `${files.size} files changed, ${add} insertions(+), ${del} deletions(-)`;
  for (const st of s.steps) if (st.t === "run") st.out = st.out.map(([c, t]) => [c, t === "__STAT__" ? txt : t]);
}
