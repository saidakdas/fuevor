<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ExploreController extends Controller
{
    public function __invoke(): Response
    {
        $today = now()->toDateString();
        $createdAt = now()->subDays(18)->getTimestampMs();

        return Inertia::render('demo/home', [
            'exploreMode' => true,
            'firstBuilderNumber' => 7,
            'exploreState' => [
                'goals' => [
                    [
                        'id' => 101,
                        'title' => 'İlk yarı maratonumu tamamlamak',
                        'gain' => 'Daha güçlü, disiplinli ve enerjik hissetmek.',
                        'buildingBlocks' => [
                            ['id' => 1, 'title' => 'Haftalık koşu planını oluştur', 'completed' => true, 'highImpact' => true],
                            ['id' => 2, 'title' => '10 km mesafeyi rahat koş', 'completed' => true, 'highImpact' => true],
                            ['id' => 3, 'title' => 'Beslenme rutinini düzenle', 'completed' => false, 'highImpact' => false],
                            ['id' => 4, 'title' => '16 km uzun koşuyu tamamla', 'completed' => false, 'highImpact' => true],
                            ['id' => 5, 'title' => 'Yarış haftası planını hazırla', 'completed' => false, 'highImpact' => false],
                        ],
                        'deadline' => now()->addMonths(3)->toDateString(),
                        'priority' => 'very-important',
                        'category' => 'health',
                        'createdAt' => $createdAt,
                        'paretoEnabled' => true,
                    ],
                    [
                        'id' => 102,
                        'title' => 'Kişisel markam için içerik sistemi kurmak',
                        'gain' => 'Bilgimi düzenli paylaşarak daha fazla insana ulaşmak.',
                        'buildingBlocks' => [
                            ['id' => 1, 'title' => 'İçerik alanlarını belirle', 'completed' => true, 'highImpact' => true],
                            ['id' => 2, 'title' => '30 konu başlığı çıkar', 'completed' => true, 'highImpact' => true],
                            ['id' => 3, 'title' => 'Haftalık yayın takvimi hazırla', 'completed' => false, 'highImpact' => true],
                            ['id' => 4, 'title' => 'İlk 10 içeriği yayınla', 'completed' => false, 'highImpact' => false],
                        ],
                        'deadline' => now()->addMonths(2)->toDateString(),
                        'priority' => 'important',
                        'category' => 'work',
                        'createdAt' => $createdAt + 1,
                        'paretoEnabled' => true,
                    ],
                    [
                        'id' => 103,
                        'title' => 'İspanyolcada B1 seviyesine ulaşmak',
                        'gain' => 'Seyahatlerde rahat iletişim kurabilmek.',
                        'buildingBlocks' => [
                            ['id' => 1, 'title' => 'Temel dilbilgisi programını bitir', 'completed' => true, 'highImpact' => true],
                            ['id' => 2, 'title' => 'Her gün 20 kelime tekrar et', 'completed' => false, 'highImpact' => true],
                            ['id' => 3, 'title' => 'Haftada iki konuşma pratiği yap', 'completed' => false, 'highImpact' => true],
                        ],
                        'deadline' => now()->addMonths(5)->toDateString(),
                        'priority' => 'has-time',
                        'category' => 'skill',
                        'createdAt' => $createdAt + 2,
                        'paretoEnabled' => true,
                    ],
                    [
                        'id' => 104,
                        'title' => 'Yıllık okuma sistemimi kurmak',
                        'gain' => 'Okuduklarımı uygulamaya dönüştürmek.',
                        'buildingBlocks' => [
                            ['id' => 1, 'title' => 'Okuma listesini oluştur', 'completed' => true, 'highImpact' => true],
                            ['id' => 2, 'title' => 'Not alma şablonunu hazırla', 'completed' => true, 'highImpact' => true],
                            ['id' => 3, 'title' => 'İlk dört kitabı tamamla', 'completed' => true, 'highImpact' => false],
                        ],
                        'deadline' => now()->subWeek()->toDateString(),
                        'priority' => 'important',
                        'category' => 'education',
                        'createdAt' => $createdAt + 3,
                        'paretoEnabled' => true,
                        'fuAwardedAt' => now()->subDays(4)->getTimestampMs(),
                    ],
                ],
                'plans' => [
                    $this->plan(201, '45 dakika tempolu koşu', 'goal', $today, 101, 2, true, 'very-important'),
                    $this->plan(202, 'Haftalık içerik takvimini taslaklaştır', 'goal', $today, 102, 3, false, 'important'),
                    $this->plan(203, '20 yeni İspanyolca kelimeyi tekrar et', 'goal', $today, 103, 2, false, 'has-time'),
                    $this->plan(204, 'Atomic Habits notlarını düzenle', 'independent', $today, null, null, true, 'important'),
                ],
                'notes' => [
                    ['id' => 301, 'title' => 'Koşu sonrası notlar', 'content' => 'İlk 15 dakikada ritmi düşük tutmak koşunun ikinci yarısını çok daha rahat hale getiriyor.', 'goalId' => 101, 'createdAt' => $createdAt],
                    ['id' => 302, 'title' => 'İçerik fikri', 'content' => 'Motivasyondan çok sistem kurmanın neden daha kalıcı olduğunu gerçek örneklerle anlat.', 'goalId' => 102, 'createdAt' => $createdAt + 1],
                    ['id' => 303, 'title' => 'Haftalık değerlendirme', 'content' => 'Bu hafta en yüksek etkiyi sabah ilk 60 dakikayı telefonsuz geçirmek yarattı.', 'createdAt' => $createdAt + 2],
                ],
                'books' => [
                    ['id' => 401, 'title' => 'Atomik Alışkanlıklar', 'author' => 'James Clear', 'status' => 'finished', 'comment' => 'Kimlik temelli alışkanlık fikri hedeflerime yaklaşımımı değiştirdi.', 'rating' => 5, 'sortOrder' => 0, 'createdAt' => $createdAt, 'finishedAt' => now()->subDays(12)->getTimestampMs()],
                    ['id' => 402, 'title' => 'Derin Çalışma', 'author' => 'Cal Newport', 'status' => 'reading', 'comment' => '', 'rating' => 0, 'sortOrder' => 1, 'createdAt' => $createdAt + 1],
                    ['id' => 403, 'title' => 'Essentialism', 'author' => 'Greg McKeown', 'status' => 'not-started', 'comment' => '', 'rating' => 0, 'sortOrder' => 2, 'createdAt' => $createdAt + 2],
                ],
                'profile' => [
                    'name' => 'Duru Aydın',
                    'username' => 'duruaydin',
                    'email' => 'duru@kesfet.fuevor',
                    'phone' => '',
                    'birthDate' => '1998-05-14',
                    'country' => 'TR',
                    'profession' => 'designer',
                    'about' => 'Ürün tasarımcısı, amatör koşucu ve ömür boyu öğrenci.',
                    'educations' => [],
                    'avatar' => '/landing/profiles/9.jpg',
                ],
                'settings' => [
                    'appearance' => 'light',
                    'language' => 'tr',
                    'showFuPublicly' => true,
                    'teamModeEnabled' => false,
                    'carryOverIncompletePlans' => true,
                    'carryOverPreferenceSet' => true,
                ],
            ],
            'communityGoalStats' => ['active' => 38, 'completed' => 14],
            'betaAnnouncement' => ['supportCount' => 47, 'supportedByViewer' => false],
            'communityPosts' => $this->communityPosts(),
            'communityBooks' => $this->communityBooks(),
            'bestScoreMs' => 4860,
            'bestScorePlayer' => ['name' => 'Mert Kaya', 'avatar' => '/landing/profiles/2.jpg'],
            'gamePlaysRemaining' => 3,
            'supportTickets' => [],
            'feedbackEntries' => [],
        ]);
    }

    /** @return array<string, mixed> */
    private function plan(int $id, string $title, string $source, string $date, ?int $goalId, ?int $blockId, bool $completed, string $priority): array
    {
        return array_filter([
            'id' => $id,
            'title' => $title,
            'range' => 'today',
            'source' => $source,
            'goalId' => $goalId,
            'buildingBlockId' => $blockId,
            'completed' => $completed,
            'createdAt' => now()->subDays(2)->getTimestampMs() + $id,
            'scheduledFor' => $date,
            'priority' => $priority,
        ], fn ($value) => $value !== null);
    }

    /** @return array<int, array<string, mixed>> */
    private function communityPosts(): array
    {
        $profiles = [
            $this->profile(11, 'Ece Yalın', 'eceyalin', 6, 'Tasarımcı', 'İstanbul', '/landing/profiles/6.jpg', '#7c3aed', '#c084fc'),
            $this->profile(12, 'Mert Kaya', 'mertkaya', 2, 'Yazılım Geliştirici', 'Ankara', '/landing/profiles/2.jpg', '#007aff', '#4cc9f0'),
            $this->profile(13, 'Selin Aras', 'selinaras', 8, 'Girişimci', 'İzmir', '/landing/profiles/4.jpg', '#ff7a00', '#ffb347'),
            $this->profile(14, 'Can Demir', 'candemir', 3, 'Eğitmen', 'Eskişehir', '/landing/profiles/3.jpg', '#0a7f55', '#34c759'),
            $this->profile(15, 'Elif Acar', 'elifacar', 5, 'İçerik Üreticisi', 'Antalya', '/landing/profiles/7.jpg', '#d91f4d', '#ff6b9d'),
        ];

        $posts = [
            ['İlk yarı maratonumu tamamlamak', 'Koşmayı bir sonuçtan çok sürdürülebilir bir yaşam sistemine dönüştürmek istiyorum.', 18, 3],
            ['Tasarım portföyümü yenilemek', 'Yalnızca güzel ekranları değil; kararlarımı ve problem çözme sürecimi anlatan üç güçlü vaka çalışması hazırlayacağım.', 12, 2],
            ['Kendi işimi kurmak için ilk 10 müşteriye ulaşmak', 'Mükemmel ürün beklemek yerine gerçek insanlarla konuşup ihtiyaçlarını anlamaya odaklanıyorum.', 27, 4],
            ['Her ay bir atölye düzenlemek', 'Öğrendiklerimi paylaşırken daha iyi bir anlatıcı olmak ve küçük bir öğrenme topluluğu kurmak istiyorum.', 9, 1],
            ['12 bölümlük bir podcast serisi hazırlamak', 'Üretmeye başlamak isteyip sürekli erteleyen insanlarla kısa ve samimi konuşmalar kaydetmek istiyorum.', 21, 2],
        ];

        return collect($posts)->map(function (array $post, int $index) use ($profiles) {
            $ideaAuthor = $profiles[($index + 1) % count($profiles)];

            return [
                'id' => 900 + $index,
                'title' => $post[0],
                'description' => $post[1],
                'author' => $profiles[$index]['name'],
                'authorProfile' => $profiles[$index],
                'supportCount' => $post[2],
                'ideaCount' => $post[3],
                'supportedByViewer' => false,
                'createdAt' => now()->subDays($index + 1)->toISOString(),
                'ideas' => [[
                    'id' => 950 + $index,
                    'body' => ['Haftalık küçük kilometre artışlarıyla ilerlemek sakatlık riskini azaltabilir.', 'Her vaka için karar günlüğü eklemek sürecini çok görünür kılar.', 'İlk görüşmelerde satıştan önce problemi dinlemeyi deneyebilirsin.', 'Atölye sonlarında tek soruluk geri bildirim formu çok işine yarar.', 'İlk üç bölümü birlikte kaydedip yayın ritmini güvenceye alabilirsin.'][$index],
                    'author' => $ideaAuthor['name'],
                    'authorProfile' => $ideaAuthor,
                    'supportCount' => $index + 2,
                    'supportedByViewer' => false,
                    'createdAt' => now()->subHours(($index + 1) * 9)->toISOString(),
                    'replies' => [],
                ]],
            ];
        })->all();
    }

    /** @return array<string, mixed> */
    private function profile(int $id, string $name, string $username, int $builder, string $profession, string $location, string $avatar, string $from, string $to): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'username' => $username,
            'avatar' => $avatar,
            'profession' => $profession,
            'location' => $location,
            'bio' => 'Her gün küçük ama anlamlı bir adım atmaya çalışıyor.',
            'fu' => 12 + $id,
            'firstBuilderNumber' => $builder,
            'accentFrom' => $from,
            'accentTo' => $to,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function communityBooks(): array
    {
        return [[
            'key' => 'atomik-aliskanliklar|james-clear',
            'title' => 'Atomik Alışkanlıklar',
            'author' => 'James Clear',
            'readerCount' => 19,
            'reviewCount' => 2,
            'averageRating' => 4.8,
            'latestReviewAt' => now()->subDay()->toISOString(),
            'reviews' => [
                ['id' => 801, 'body' => 'Hedef yerine sistem kurma yaklaşımını hemen uygulamaya başladım.', 'rating' => 5, 'author' => 'Ece Yalın', 'createdAt' => now()->subDay()->toISOString(), 'replies' => []],
                ['id' => 802, 'body' => 'Özellikle alışkanlıkları görünür kılma bölümü çok pratikti.', 'rating' => 5, 'author' => 'Mert Kaya', 'createdAt' => now()->subDays(3)->toISOString(), 'replies' => []],
            ],
        ], [
            'key' => 'derin-calisma|cal-newport',
            'title' => 'Derin Çalışma',
            'author' => 'Cal Newport',
            'readerCount' => 11,
            'reviewCount' => 1,
            'averageRating' => 4.6,
            'latestReviewAt' => now()->subDays(2)->toISOString(),
            'reviews' => [
                ['id' => 803, 'body' => 'Takvime odak blokları koymak üretkenliğimi beklediğimden fazla artırdı.', 'rating' => 5, 'author' => 'Selin Aras', 'createdAt' => now()->subDays(2)->toISOString(), 'replies' => []],
            ],
        ]];
    }
}
