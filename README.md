# Fuevor V1

Fuevor; hedefleri kilometre taşlarına ve görevlere ayıran, ilerlemeyi görev tamamlanmalarından otomatik hesaplayan API-first bir SaaS temelidir.

## Teknoloji

- Laravel 13, PHP 8.4, MySQL 8+, Laravel Sanctum
- React 19, TypeScript, Inertia.js 3, Tailwind CSS 4

## Yerel kurulum

```bash
cp .env.example .env
composer install
php artisan key:generate
npm install
php artisan migrate --seed
npm run build
composer run dev
```

macOS/Homebrew üzerinde PHP 8.4 formülü kullanılıyorsa komutlardan önce şu yolu öne alın:

```bash
export PATH="/opt/homebrew/opt/php@8.4/bin:$PATH"
```

`.env` içinde `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` ve `DB_PASSWORD` alanlarını yerel MySQL bilgileriyle doldurun.

## API

Tüm mobil uyumlu uçlar `/api/v1` altındadır. Auth uçları Bearer token üretir; korumalı auth, dashboard, goals, milestones ve tasks uçları `auth:sanctum` kullanır. Tam liste:

```bash
php artisan route:list --path=api/v1
```

## Kalite kontrolleri

```bash
composer lint:check
php artisan test
npm run types:check
npm run lint:check
npm run format:check
npm run build
```
