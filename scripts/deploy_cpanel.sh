#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${CPANEL_DEPLOY_CONFIG:-$ROOT_DIR/.deploy.env}"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Deployment ayar dosyası bulunamadı: $CONFIG_FILE" >&2
    exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

: "${CPANEL_HOST:?CPANEL_HOST eksik}"
: "${CPANEL_USER:?CPANEL_USER eksik}"
: "${CPANEL_TOKEN:?CPANEL_TOKEN eksik}"
: "${CPANEL_REPOSITORY_ROOT:?CPANEL_REPOSITORY_ROOT eksik}"
: "${PRODUCTION_URL:?PRODUCTION_URL eksik}"

api_call() {
    local endpoint="$1"
    shift

    local response
    response="$(
        curl --fail --silent --show-error --get \
            --header "Authorization: cpanel ${CPANEL_USER}:${CPANEL_TOKEN}" \
            "https://${CPANEL_HOST}:2083/execute/${endpoint}" \
            "$@"
    )"

    if ! jq -e '.result.status == 1' >/dev/null <<<"$response"; then
        jq -r '.result.errors // ["Bilinmeyen cPanel API hatası"] | join("; ")' <<<"$response" >&2
        return 1
    fi
}

echo "cPanel repository güncelleniyor..."
api_call "VersionControl/update" \
    --data-urlencode "repository_root=${CPANEL_REPOSITORY_ROOT}" \
    --data-urlencode "branch=main"

echo "Production deployment başlatılıyor..."
api_call "VersionControlDeployment/create" \
    --data-urlencode "repository_root=${CPANEL_REPOSITORY_ROOT}"

expected_asset="$(jq -r '.["resources/js/pages/welcome.tsx"].file' "$ROOT_DIR/public/build/manifest.json")"
expected_asset="$(basename "$expected_asset")"

for attempt in {1..30}; do
    if curl --fail --silent --show-error "$PRODUCTION_URL" | grep --fixed-strings --quiet "$expected_asset"; then
        echo "Deployment doğrulandı: $expected_asset"
        exit 0
    fi

    sleep 2
done

echo "Deployment başlatıldı ancak yeni asset 60 saniye içinde doğrulanamadı: $expected_asset" >&2
exit 1
