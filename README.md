# jiro.bot

Placeholder landing page for jiro.bot: the 16x14 Jiro sprite on a pixel heatmap and a sign-up link.
The previous interactive site work is preserved on the
`backup/jiro-site-2026-10-09` branch (and `jiro-site`, which open PRs target).

- `site/` — static files published as-is
- `infra/site.cfn.yaml` — CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role)
- `.github/workflows/deploy.yml` — manual-dispatch deploy from `main`

Preview locally: `python3 -m http.server -d site 4310`
