# Run from sessions/broker/ui/e2e/fixtures (reads chat-page.ts, writes restaurant-tour.ts).
import os
src = open('chat-page.ts').read()
start = src.index('const transcripts: TranscriptListItem[] = [')
end = src.index('const project = (id: string')
def s(**k): pass
T = [
 ("flaky-checkout","Fix flaky checkout test","originType: 'slack', kind: 'slack-channel', channelName: 'eng', threadUrl: 'https://acme.slack.com/archives/C1/p1', updatedAt: now - minutes(1), live: true"),
 ("tuna-inventory","jiro: refactor tuna-inventory service","updatedAt: now - minutes(34), live: true"),
 ("trigger-deps","Nightly dependency bumps","originType: 'trigger', kind: 'trigger', contributors: [], updatedAt: now - hours(4)"),
 ("slack-alerts","#alerts · payment webhook 500s","originType: 'slack', kind: 'slack-channel', channelName: 'alerts', threadUrl: 'https://acme.slack.com/archives/C2/p1', updatedAt: now - hours(6), unread: true"),
 ("cli-coupons","Add coupon codes to the cart API","originType: 'cli', updatedAt: now - days(1) - hours(3)"),
 ("slack-dm","Draft the Q4 on-call runbook","originType: 'slack', kind: 'slack-dm', updatedAt: now - days(1) - hours(7)"),
 ("web-omakase","Omakase menu page: dark mode","updatedAt: now - days(3)"),
 ("web-postgres","Postgres 17 upgrade plan","updatedAt: now - days(9)"),
 ("old-wasabi","Wasabi feature flag cleanup","updatedAt: now - days(40)"),
]
tx = "const transcripts: TranscriptListItem[] = [\n" + "".join(f"  session({{ transcriptId: '{i}', title: '{t}', {o} }}),\n" for i,t,o in T) + "];\n\n"
src = src[:start] + tx + src[end:]
src = src.replace("project('website', 'Website relaunch')", "project('checkout', 'Checkout v2')").replace("project('billing', 'Billing migration')", "project('inventory', 'Inventory service')")
src = src.replace("'clifford@tilework.tech'", "'hana@acme.dev'").replace("name: 'Cliff'", "name: 'Hana'")
src = src.replace("{ id: 'opus', name: 'Claude Opus 4.8', shortName: 'Opus 4.8' }", "{ id: 'opus', name: 'Claude Opus 5.5', shortName: 'Opus 5.5' }")
cs = src.index("if (state !== 'landing') {")
ce = src.index("if (state === 'past' || state === 'resume-failed')")
src = src[:cs] + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'convo.ts.txt')).read() + src[ce:]
a = "start ?? (state === 'landing' ? '/chat' : '/chat/live-redesign')"
assert a in src
src = src.replace(a, "start ?? (state === 'landing' ? '/chat' : state === 'done' ? '/chat/tuna-inventory' : '/chat/flaky-checkout')")
src = src.replace("const streaming = state === 'conversation';", "const streaming = state === 'conversation';\nconst done = state === 'done';")
src = src.replace("unreadStore.count = 2", "unreadStore.count = 1").replace("return json({ count: 2 })","return json({ count: 1 })")
a = "  if (url.includes('/api/transcripts/unread-count'))"
assert a in src
src = src.replace(a, """  if (url.includes('/api/integrations/mcp/catalog')) return json({ servers: [] });
  if (url.includes('/api/integrations/mcp')) {
    return json({
      servers: [
        { name: 'GitHub', provider: 'github', serverUrl: 'https://api.githubcopilot.com/mcp/', status: 'connected' },
        { name: 'Linear', provider: 'linear', serverUrl: 'https://mcp.linear.app/mcp', status: 'connected' },
        { name: 'Sentry', provider: 'sentry', serverUrl: 'https://mcp.sentry.dev/mcp', status: 'connected' },
      ],
    });
  }
""" + a, 1)
open('restaurant-tour.ts','w').write(src)
