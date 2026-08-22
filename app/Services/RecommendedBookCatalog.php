<?php

namespace App\Services;

use Illuminate\Support\Str;

final class RecommendedBookCatalog
{
    /**
     * @return array<int, array{
     *     key: string,
     *     author: string,
     *     tr: array{title: string, cover: string},
     *     en: array{title: string, cover: string}
     * }>
     */
    public static function all(): array
    {
        return [
            [
                'key' => 'get-it-done',
                'author' => 'Brian Tracy',
                'tr' => [
                    'title' => 'Şimdi Yap!',
                    'cover' => '/library/recommended/get-it-done-tr.webp',
                ],
                'en' => [
                    'title' => 'Get It Done',
                    'cover' => '/library/recommended/get-it-done-en.webp',
                ],
            ],
            [
                'key' => 'eat-that-frog',
                'author' => 'Brian Tracy',
                'tr' => [
                    'title' => 'Ye O Kurbağayı!',
                    'cover' => '/library/recommended/eat-that-frog-tr.webp',
                ],
                'en' => [
                    'title' => 'Eat That Frog!',
                    'cover' => '/library/recommended/eat-that-frog-en.webp',
                ],
            ],
            [
                'key' => 'atomic-habits',
                'author' => 'James Clear',
                'tr' => [
                    'title' => 'Atomik Alışkanlıklar',
                    'cover' => '/library/recommended/atomic-habits-tr.webp',
                ],
                'en' => [
                    'title' => 'Atomic Habits',
                    'cover' => '/library/recommended/atomic-habits-en.webp',
                ],
            ],
            [
                'key' => 'building-a-storybrand',
                'author' => 'Donald Miller',
                'tr' => [
                    'title' => 'Marka Yaratmak',
                    'cover' => '/library/recommended/building-a-storybrand-tr.webp',
                ],
                'en' => [
                    'title' => 'Building a StoryBrand',
                    'cover' => '/library/recommended/building-a-storybrand-en.webp',
                ],
            ],
            [
                'key' => 'e-myth-revisited',
                'author' => 'Michael E. Gerber',
                'tr' => [
                    'title' => 'Girişimcilik Tutkusu',
                    'cover' => '/library/recommended/e-myth-revisited-tr.webp',
                ],
                'en' => [
                    'title' => 'The E-Myth Revisited',
                    'cover' => '/library/recommended/e-myth-revisited-en.webp',
                ],
            ],
        ];
    }

    public static function keyForTitle(string $title): ?string
    {
        $normalizedTitle = self::normalize($title);

        foreach (self::all() as $book) {
            if (in_array($normalizedTitle, [self::normalize($book['tr']['title']), self::normalize($book['en']['title'])], true)) {
                return $book['key'];
            }
        }

        return null;
    }

    public static function groupKey(string $title, string $author = ''): string
    {
        $catalogKey = self::keyForTitle($title);

        return $catalogKey
            ? 'recommended:'.$catalogKey
            : 'book:'.self::normalize($title).'|'.self::normalize($author);
    }

    private static function normalize(string $value): string
    {
        $ascii = Str::ascii(Str::lower(Str::squish($value)));

        return Str::squish((string) preg_replace('/[^a-z0-9]+/', ' ', $ascii));
    }
}
