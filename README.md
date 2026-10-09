# jiro.bot placeholder

Placeholder landing page for jiro.bot: the Jiro onigiri and a sign-up link.
The full interactive site is in progress in `tilework-tech/jiro.bot`.

- `site/` — static files published as-is
- `infra/site.cfn.yaml` — CloudFormation stack `jiro-bot-site` (S3, CloudFront, ACM, Route 53, deploy role)
- `.github/workflows/deploy.yml` — manual-dispatch deploy from `main`

Preview locally: `python3 -m http.server -d site 4310`
