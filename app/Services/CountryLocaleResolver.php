<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CountryLocaleResolver
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['tr', 'en', 'ja', 'zh', 'es', 'fr', 'it', 'de', 'ar', 'fa', 'el', 'ru'];

    public function resolve(Request $request): string
    {
        $preferredLocale = strtolower((string) $request->cookie('fuevor_locale'));

        if (in_array($preferredLocale, self::SUPPORTED_LOCALES, true)) {
            return $preferredLocale;
        }

        $country = strtoupper((string) ($request->header('CF-IPCountry') ?: $request->server('GEOIP_COUNTRY_CODE')));

        if ($country === 'TR') {
            return 'tr';
        }

        if ($country !== '' && ! in_array($country, ['CY', 'XX'], true)) {
            return 'en';
        }

        $ip = $request->ip();

        if (! is_string($ip) || ! $this->isPublicIp($ip)) {
            return app()->environment(['local', 'testing']) && config('app.locale') === 'tr' ? 'tr' : 'en';
        }

        $location = Cache::remember(
            'visitor-country:'.hash('sha256', $ip),
            now()->addDay(),
            fn (): array => $this->lookup($ip),
        );

        $country = strtoupper((string) ($location['country'] ?? ''));
        $timezone = (string) data_get($location, 'location.time_zone', '');

        return $country === 'TR' || ($country === 'CY' && $timezone === 'Asia/Famagusta') ? 'tr' : 'en';
    }

    private function lookup(string $ip): array
    {
        try {
            $response = Http::acceptJson()
                ->connectTimeout(1)
                ->timeout(2)
                ->get(rtrim((string) config('services.country.endpoint'), '/').'/'.rawurlencode($ip), [
                    'fields' => 'location',
                ]);

            $data = $response->json();

            return $response->successful() && is_array($data) ? $data : [];
        } catch (ConnectionException) {
            return [];
        }
    }

    private function isPublicIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    }
}
