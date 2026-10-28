#!/usr/bin/env bash
# Updates code only. Provision the function, its environment, and the API route separately.
set -euo pipefail
if [[ "${GITHUB_ACTIONS:-}" != "true" || "${GITHUB_EVENT_NAME:-}" != "workflow_dispatch" ]]; then
  echo "Deploy through the Deploy early access GitHub Actions workflow only." >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$PACKAGE_DIR"' EXIT
# The Node.js Lambda runtime ships the AWS SDK, so the handler is the whole package.
(cd "$HERE" && zip -q "$PACKAGE_DIR/function.zip" index.mjs)
aws lambda update-function-code \
  --function-name jirobot-early-access \
  --zip-file "fileb://${PACKAGE_DIR}/function.zip" \
  --region us-east-1 >/dev/null
aws lambda wait function-updated \
  --function-name jirobot-early-access --region us-east-1
