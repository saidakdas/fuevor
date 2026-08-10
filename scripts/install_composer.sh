#!/usr/bin/env bash

set -euo pipefail

composer_path="${1:-}"

if [[ -z "$composer_path" ]]; then
    echo "Kullanım: $0 /tam/yol/composer.phar" >&2
    exit 1
fi

if [[ -f "$composer_path" ]]; then
    /usr/bin/env php "$composer_path" --version --no-ansi
    exit 0
fi

composer_dir="$(dirname "$composer_path")"
composer_filename="$(basename "$composer_path")"
installer_path="$(mktemp /tmp/composer-setup.XXXXXX.php)"

cleanup() {
    rm -f -- "$installer_path"
}

trap cleanup EXIT

expected_checksum="$(/usr/bin/env php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
/usr/bin/env php -r 'copy("https://getcomposer.org/installer", $argv[1]);' "$installer_path"
actual_checksum="$(/usr/bin/env php -r 'echo hash_file("sha384", $argv[1]);' "$installer_path")"

if [[ -z "$expected_checksum" || ! "$expected_checksum" =~ ^[a-f0-9]{96}$ ]]; then
    echo "Composer installer imzası alınamadı." >&2
    exit 1
fi

if [[ ! "$actual_checksum" =~ ^[a-f0-9]{96}$ ]] || [[ "$expected_checksum" != "$actual_checksum" ]]; then
    echo "Composer installer imza doğrulaması başarısız." >&2
    exit 1
fi

mkdir -p -- "$composer_dir"
/usr/bin/env php "$installer_path" --quiet --install-dir="$composer_dir" --filename="$composer_filename"
/usr/bin/env php "$composer_path" --version --no-ansi
