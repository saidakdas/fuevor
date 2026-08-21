<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoCommunitySeeder
{
    private const SEED_PREFIX = 'community-simulation-v1-';

    /**
     * @return array<string, array<string, mixed>>
     */
    public function profiles(): array
    {
        return [
            'ece' => [
                'name' => 'Ece Yalın',
                'username' => 'eceyalin',
                'email' => 'community.ece@fuevor.local',
                'profession' => 'Ürün tasarımcısı',
                'location' => 'İstanbul',
                'bio' => 'Daha sade ürünler, daha sürdürülebilir alışkanlıklar ve bolca kahve.',
                'fu' => 28,
                'accent' => ['#6d28d9', '#a855f7'],
            ],
            'mert' => [
                'name' => 'Mert Aras',
                'username' => 'mertaras',
                'email' => 'community.mert@fuevor.local',
                'profession' => 'Yazılım geliştirici',
                'location' => 'Ankara',
                'bio' => 'Ürün geliştiriyor, koşuyor ve öğrendiklerimi küçük adımlara bölüyorum.',
                'fu' => 41,
                'accent' => ['#075985', '#38bdf8'],
            ],
            'elif' => [
                'name' => 'Elif Demir',
                'username' => 'elifdemir',
                'email' => 'community.elif@fuevor.local',
                'profession' => 'Psikolog',
                'location' => 'İzmir',
                'bio' => 'İyi oluş, davranış bilimi ve günlük hayatta uygulanabilir küçük değişimler.',
                'fu' => 19,
                'accent' => ['#be123c', '#fb7185'],
            ],
            'can' => [
                'name' => 'Can Yıldız',
                'username' => 'canyildiz',
                'email' => 'community.can@fuevor.local',
                'profession' => 'Girişimci',
                'location' => 'İstanbul',
                'bio' => 'Fikirleri hızlıca denemeye ve kullanıcılarla birlikte geliştirmeye çalışıyorum.',
                'fu' => 34,
                'accent' => ['#0f766e', '#2dd4bf'],
            ],
            'duru' => [
                'name' => 'Duru Aydın',
                'username' => 'duruaydin',
                'email' => 'community.duru@fuevor.local',
                'profession' => 'Üniversite öğrencisi',
                'location' => 'Eskişehir',
                'bio' => 'Yeni diller, kitaplar ve öğrenci projeleriyle dolu bir dönem.',
                'fu' => 16,
                'accent' => ['#c2410c', '#fb923c'],
            ],
            'kerem' => [
                'name' => 'Kerem Deniz',
                'username' => 'keremdeniz',
                'email' => 'community.kerem@fuevor.local',
                'profession' => 'Fotoğrafçı',
                'location' => 'Antalya',
                'bio' => 'Sokakta gerçek hikâyelerin peşindeyim. Uzun soluklu projeler üretmek istiyorum.',
                'fu' => 23,
                'accent' => ['#334155', '#94a3b8'],
            ],
            'zeynep' => [
                'name' => 'Zeynep Kaya',
                'username' => 'zeynepkaya',
                'email' => 'community.zeynep@fuevor.local',
                'profession' => 'İçerik üreticisi',
                'location' => 'Bursa',
                'bio' => 'Üretkenlik, yaratıcı süreç ve öğrenme üzerine içerikler hazırlıyorum.',
                'fu' => 37,
                'accent' => ['#9d174d', '#f472b6'],
            ],
            'arda' => [
                'name' => 'Arda Eren',
                'username' => 'ardaeren',
                'email' => 'community.arda@fuevor.local',
                'profession' => 'Veri analisti',
                'location' => 'İstanbul',
                'bio' => 'Veriyi anlaşılır hikâyelere dönüştürüyor, finansal özgürlük için plan yapıyorum.',
                'fu' => 31,
                'accent' => ['#1d4ed8', '#60a5fa'],
            ],
            'selin' => [
                'name' => 'Selin Koç',
                'username' => 'selinkoc',
                'email' => 'community.selin@fuevor.local',
                'profession' => 'Mimar',
                'location' => 'İzmir',
                'bio' => 'Mekân, kent ve sürdürülebilir tasarım üzerine çalışıyorum.',
                'fu' => 26,
                'accent' => ['#7c2d12', '#f59e0b'],
            ],
            'emre' => [
                'name' => 'Emre Tunç',
                'username' => 'emretunc',
                'email' => 'community.emre@fuevor.local',
                'profession' => 'Koşu antrenörü',
                'location' => 'Ankara',
                'bio' => 'Sürekliliğin hızdan daha önemli olduğuna inanıyorum.',
                'fu' => 44,
                'accent' => ['#166534', '#4ade80'],
            ],
            'idil' => [
                'name' => 'İdil Aksoy',
                'username' => 'idilaksoy',
                'email' => 'community.idil@fuevor.local',
                'profession' => 'İngilizce öğretmeni',
                'location' => 'İstanbul',
                'bio' => 'Dil öğrenimini günlük hayatın doğal bir parçası hâline getirmeyi seviyorum.',
                'fu' => 39,
                'accent' => ['#4338ca', '#818cf8'],
            ],
            'baris' => [
                'name' => 'Barış Güneş',
                'username' => 'barisgunes',
                'email' => 'community.baris@fuevor.local',
                'profession' => 'Müzisyen',
                'location' => 'Muğla',
                'bio' => 'Sesleri, yol hikâyelerini ve ortak üretimi bir araya getiriyorum.',
                'fu' => 22,
                'accent' => ['#5b21b6', '#c084fc'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function profileFor(User $user): array
    {
        $profile = collect($this->profiles())->firstWhere('email', $user->email);
        $username = $profile['username'] ?? Str::of($user->email)->before('@')->replaceMatches('/[^\pL\pN._]+/u', '')->lower()->toString();
        $accent = $profile['accent'] ?? ['#005b67', '#52b8c4'];

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $username ?: 'fuevor'.$user->id,
            'avatar' => null,
            'profession' => $profile['profession'] ?? $user->profession,
            'location' => $profile['location'] ?? $user->country,
            'bio' => $profile['bio'] ?? 'Hedeflerini küçük ve sürdürülebilir adımlarla gerçekleştiriyor.',
            'fu' => $user->show_fu_publicly ? (int) $user->fu_balance : null,
            'accentFrom' => $accent[0],
            'accentTo' => $accent[1],
        ];
    }

    public function seed(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        DB::transaction(function (): void {
            $users = collect($this->profiles())->mapWithKeys(function (array $profile, string $key): array {
                $user = User::query()->firstOrCreate(
                    ['email' => $profile['email']],
                    [
                        'name' => $profile['name'],
                        'password' => Str::random(40),
                    ],
                );
                $user->forceFill([
                    'name' => $profile['name'],
                    'fu_balance' => $profile['fu'],
                    'show_fu_publicly' => true,
                ])->saveQuietly();

                return [$key => $user];
            });

            foreach ($this->posts() as $index => $data) {
                /** @var User $owner */
                $owner = $users[$data['owner']];
                $post = $owner->communityGoalPosts()->updateOrCreate(
                    ['demo_goal_key' => self::SEED_PREFIX.$data['key']],
                    ['title' => $data['title'], 'description' => $data['description']],
                );

                if ($post->wasRecentlyCreated) {
                    $post->forceFill([
                        'created_at' => now()->subMinutes($data['minutesAgo']),
                        'updated_at' => now()->subMinutes($data['minutesAgo']),
                    ])->saveQuietly();
                }

                $supporterIds = collect($data['supporters'])
                    ->map(fn (string $key): int => $users[$key]->id)
                    ->all();
                $post->supporters()->syncWithoutDetaching($supporterIds);

                foreach ($data['ideas'] as $ideaData) {
                    $idea = $post->ideas()->firstOrCreate([
                        'user_id' => $users[$ideaData['author']]->id,
                        'parent_id' => null,
                        'body' => $ideaData['body'],
                    ]);

                    if (isset($ideaData['reply'])) {
                        $post->ideas()->firstOrCreate([
                            'user_id' => $users[$ideaData['reply']['author']]->id,
                            'parent_id' => $idea->id,
                            'body' => $ideaData['reply']['body'],
                        ]);
                    }
                }
            }
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function posts(): array
    {
        return [
            [
                'key' => 'maraton', 'owner' => 'emre', 'minutesAgo' => 18,
                'title' => 'İlk maratonumu koşmak',
                'description' => 'Kasım ayındaki İstanbul Maratonu için haftada dört gün çalışıyorum. Şu an en uzun koşum 24 km; hedefim sakatlanmadan finişi görmek.',
                'supporters' => ['ece', 'mert', 'elif', 'duru', 'kerem', 'zeynep', 'arda', 'idil'],
                'ideas' => [
                    ['author' => 'elif', 'body' => 'Dinlenme günlerini de planına görev gibi ekle; atlamamak toparlanmanı çok kolaylaştırır.'],
                    ['author' => 'mert', 'body' => 'Uzun koşularda yarış günü kullanacağın beslenmeyi şimdiden test edebilirsin.', 'reply' => ['author' => 'emre', 'body' => 'Bu hafta jel ve su planını denemeye başlıyorum, teşekkürler.']],
                ],
            ],
            [
                'key' => 'mobil-uygulama', 'owner' => 'mert', 'minutesAgo' => 47,
                'title' => 'İlk mobil uygulamamı yayınlamak',
                'description' => 'Fikir doğrulamasını tamamladım. Önümüzdeki altı haftada küçük ama gerçekten çalışan ilk sürümü mağazaya göndermek istiyorum.',
                'supporters' => ['ece', 'can', 'duru', 'zeynep', 'arda', 'selin'],
                'ideas' => [
                    ['author' => 'ece', 'body' => 'İlk sürümde tek bir ana kullanıcı problemini çözmeye odaklanırsan kapsamı korumak kolaylaşır.', 'reply' => ['author' => 'mert', 'body' => 'Bugün özellik listesini “şimdi” ve “sonra” olarak ikiye ayıracağım.']],
                ],
            ],
            [
                'key' => 'c1-ingilizce', 'owner' => 'duru', 'minutesAgo' => 95,
                'title' => 'İngilizcemi C1 seviyesine çıkarmak',
                'description' => 'Erasmus başvurusu öncesinde konuşma çekingenliğimi aşmak ve akademik yazıda daha rahat olmak istiyorum.',
                'supporters' => ['idil', 'ece', 'mert', 'elif', 'baris'],
                'ideas' => [
                    ['author' => 'idil', 'body' => 'Her gün 10 dakikalık sesli günlük kaydet. Bir ay sonra ilk kayıtla son kaydı karşılaştırmak çok motive eder.'],
                    ['author' => 'baris', 'body' => 'Sevdiğin şarkıların sözlerini çevirip yüksek sesle söylemek telaffuz için eğlenceli olabilir.'],
                ],
            ],
            [
                'key' => 'portfolyo', 'owner' => 'ece', 'minutesAgo' => 160,
                'title' => 'Tasarım portfolyomu yenilemek',
                'description' => 'Yalnızca güzel ekranlar değil, kararlarımı ve problem çözme sürecimi anlatan üç güçlü vaka çalışması hazırlayacağım.',
                'supporters' => ['mert', 'can', 'selin', 'zeynep', 'kerem', 'duru', 'arda'],
                'ideas' => [
                    ['author' => 'selin', 'body' => 'Her projeyi problem, kısıtlar, seçenekler ve sonuç şeklinde aynı iskeletle anlatmak okunabilirliği artırır.'],
                ],
            ],
            [
                'key' => 'podcast', 'owner' => 'zeynep', 'minutesAgo' => 245,
                'title' => '12 bölümlük bir podcast serisi hazırlamak',
                'description' => 'Üretmeye başlamak isteyip sürekli erteleyen insanlarla kısa ve samimi konuşmalar kaydetmek istiyorum.',
                'supporters' => ['baris', 'ece', 'can', 'kerem', 'duru', 'elif'],
                'ideas' => [
                    ['author' => 'baris', 'body' => 'İlk üç konuğu peş peşe kaydedersen yayın ritmini korumak için elinde tampon bölüm olur.'],
                    ['author' => 'kerem', 'body' => 'Her konuğun portresini aynı görsel dilde çekmek seriye güçlü bir kimlik kazandırabilir.'],
                ],
            ],
            [
                'key' => 'sekersiz', 'owner' => 'elif', 'minutesAgo' => 390,
                'title' => '30 gün ilave şekersiz beslenmek',
                'description' => 'Enerji dalgalanmalarını gözlemlemek için bir ay boyunca ilave şekeri bırakıp uyku ve odak durumumu not edeceğim.',
                'supporters' => ['emre', 'idil', 'duru', 'selin'],
                'ideas' => [
                    ['author' => 'emre', 'body' => 'Sadece tartıya değil uyku, enerji ve açlık düzeyine de günlük 1–5 arası puan verebilirsin.'],
                ],
            ],
            [
                'key' => 'fotograf-sergisi', 'owner' => 'kerem', 'minutesAgo' => 620,
                'title' => 'İlk fotoğraf sergimi açmak',
                'description' => 'Antalya’nın sabah vardiyasını anlatan 20 fotoğraflık bir seri hazırlayıp yıl bitmeden küçük bir sergiye dönüştüreceğim.',
                'supporters' => ['ece', 'selin', 'baris', 'zeynep', 'can', 'duru'],
                'ideas' => [
                    ['author' => 'selin', 'body' => 'Mekân aramadan önce baskı boyutu ve izleme mesafesiyle küçük bir duvar maketi hazırlayabilirsin.'],
                    ['author' => 'zeynep', 'body' => 'Çekim sürecini haftalık kısa notlarla paylaşmak sergi öncesinde merak oluşturur.'],
                ],
            ],
            [
                'key' => 'acil-durum-fonu', 'owner' => 'arda', 'minutesAgo' => 980,
                'title' => '6 aylık acil durum fonu oluşturmak',
                'description' => 'Harcamalarımı sadeleştirip her ay gelirin belirli bir bölümünü otomatik aktararak yıl sonuna kadar güvenli bir tampon oluşturacağım.',
                'supporters' => ['mert', 'can', 'ece', 'selin', 'emre'],
                'ideas' => [
                    ['author' => 'can', 'body' => 'Maaş gününün ertesi için otomatik transfer tanımlamak karar yorgunluğunu ortadan kaldırır.'],
                ],
            ],
            [
                'key' => 'ispanyolca', 'owner' => 'idil', 'minutesAgo' => 1380,
                'title' => 'İspanyolcada B1 seviyesine gelmek',
                'description' => 'Öğretmen olmanın öğrenci olmayı unutturmaması için bu yıl yeni bir dili sıfırdan deneyimliyorum.',
                'supporters' => ['duru', 'baris', 'elif', 'zeynep', 'mert', 'ece'],
                'ideas' => [
                    ['author' => 'duru', 'body' => 'Benimle haftada bir gün karşılıklı konuşma pratiği yapabiliriz.'],
                ],
            ],
            [
                'key' => 'yuksek-lisans', 'owner' => 'selin', 'minutesAgo' => 1840,
                'title' => 'Sürdürülebilir tasarım yüksek lisansına kabul almak',
                'description' => 'Portfolyo, niyet mektubu ve dil sınavı adımlarını dört aylık bir takvime böldüm. İlk başvurumu aralıkta tamamlayacağım.',
                'supporters' => ['ece', 'duru', 'idil', 'arda', 'kerem'],
                'ideas' => [
                    ['author' => 'ece', 'body' => 'Niyet mektubunu programa özel iki somut araştırma sorusuyla bağlamak fark yaratabilir.'],
                ],
            ],
            [
                'key' => 'kisa-film', 'owner' => 'baris', 'minutesAgo' => 2500,
                'title' => 'İlk kısa filmimin müziklerini tamamlamak',
                'description' => 'Bir arkadaşımın kısa filmi için dört özgün parça hazırlıyorum. Görüntüyle müziğin aynı hikâyeyi anlattığı sade bir dünya kurmak istiyorum.',
                'supporters' => ['kerem', 'zeynep', 'ece', 'selin', 'can'],
                'ideas' => [
                    ['author' => 'kerem', 'body' => 'Yönetmenle önce referans seslerden oluşan ortak bir pano hazırlamak revizyonları azaltabilir.'],
                ],
            ],
            [
                'key' => 'urun-lansmani', 'owner' => 'can', 'minutesAgo' => 3180,
                'title' => 'Yeni ürünümü ilk 100 kullanıcıyla buluşturmak',
                'description' => 'Reklama başlamadan önce ürünü gerçekten kullanacak küçük bir topluluk kurup onların geri bildirimleriyle geliştireceğim.',
                'supporters' => ['mert', 'ece', 'zeynep', 'arda', 'duru', 'elif', 'selin'],
                'ideas' => [
                    ['author' => 'mert', 'body' => 'İlk kullanıcılar için haftalık kısa geri bildirim görüşmeleri planlamak sorunları erken yakalamanı sağlar.'],
                    ['author' => 'zeynep', 'body' => 'Kullanıcıların ilerlemesini görünür kılan küçük başarı hikâyeleri paylaşabilirsin.'],
                ],
            ],
        ];
    }
}
