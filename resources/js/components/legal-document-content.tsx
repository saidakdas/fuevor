import type { ReactNode } from 'react';

type LegalDocumentContentProps = {
    document: 'terms' | 'privacy' | 'all';
};

function LegalSection({ children, title }: { children: ReactNode; title: string }) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">{title}</h2>
            <div className="space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300">{children}</div>
        </section>
    );
}

export function TermsContent() {
    return (
        <article id="kullanici-sozlesmesi" className="scroll-mt-8 space-y-7">
            <header className="space-y-2">
                <p className="text-xs font-bold tracking-[0.16em] text-[#007aff] uppercase">Fuevor</p>
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl dark:text-white">
                    Kullanıcı Sözleşmesi ve Kullanım Koşulları
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yürürlük tarihi: 21 Ağustos 2026</p>
            </header>

            <LegalSection title="1. Taraflar">
                <p>
                    Bu sözleşme, Fuevor platformunu (bundan sonra “Platform” olarak anılacaktır) işleten{' '}
                    <strong>Said Enes Akdaş - AES Insight</strong> (bundan sonra “Hizmet Sağlayıcı” olarak anılacaktır) ile Platform’a üye olan
                    kullanıcı (bundan sonra “Kullanıcı” olarak anılacaktır) arasında akdedilmiştir.
                </p>
            </LegalSection>

            <LegalSection title="2. Sözleşmenin Konusu">
                <p>
                    Bu sözleşmenin konusu, Kullanıcı’nın hedeflerini belirlemesi, yapı taşlarına ayırması, 20/80 kuralı ile yönetmesi, not tutması ve
                    platformdaki topluluk (Ekip Modu, Yol Arkadaşı, Global Kitaplık) özelliklerinden faydalanmasına yönelik kuralların ve tarafların
                    hak ve yükümlülüklerinin belirlenmesidir.
                </p>
            </LegalSection>

            <LegalSection title="3. Hak ve Yükümlülükler">
                <div className="space-y-3">
                    <p>
                        <strong>3.1.</strong> Kullanıcı, Platform’a üye olurken verdiği bilgilerin doğru ve eksiksiz olduğunu kabul eder.
                    </p>
                    <p>
                        <strong>3.2.</strong> Platform içerisinde oluşturulan “Kişisel Hedefler”, Kullanıcı “Fuevor’da Yayınla” seçeneğini
                        kullanmadığı sürece gizlidir. Kullanıcı, hedefini toplulukla paylaştığında sadece hedefin ana başlığının görüneceğini,
                        altındaki “yapı taşlarının” gizli kalacağını kabul eder.
                    </p>
                    <p>
                        <strong>3.3.</strong> “Ekip Modu” kapsamında davet edilen veya oluşturulan çalışma alanlarındaki eylemlerden, Kullanıcı ve
                        Ekip Yöneticisi müştereken sorumludur.
                    </p>
                    <p>
                        <strong>3.4.</strong> Hizmet Sağlayıcı, Platform’daki “Destekle” ve “Fikir Ver” alanlarında hakaret, spam veya hukuka aykırı
                        içerik üreten kullanıcıların hesaplarını önceden haber vermeksizin askıya alma veya silme hakkını saklı tutar.
                    </p>
                    <p>
                        <strong>3.5.</strong> Kazanılan “FU Puanları” tamamen platform içi bir oyunlaştırma ve motivasyon aracı olup, hiçbir şekilde
                        nakdi bir değere, devredilebilir bir bakiyeye veya kripto varlığa karşılık gelmez.
                    </p>
                </div>
            </LegalSection>

            <LegalSection title="4. Fikri Mülkiyet Hakları">
                <p>
                    Platformun tasarımı, yazılım kodları, veritabanı, “Fuevor” markası, logosu ve iş modeli (yapı taşları ve 20/80 entegrasyonu dâhil)
                    tamamen Hizmet Sağlayıcı’ya aittir. İzinsiz kopyalanamaz veya çoğaltılamaz.
                </p>
            </LegalSection>
        </article>
    );
}

export function KvkkContent() {
    return (
        <article id="kvkk-aydinlatma-metni" className="scroll-mt-8 space-y-7">
            <header className="space-y-2">
                <p className="text-xs font-bold tracking-[0.16em] text-[#007aff] uppercase">Fuevor</p>
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl dark:text-white">
                    Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yürürlük tarihi: 21 Ağustos 2026</p>
            </header>

            <div className="rounded-2xl bg-slate-50 p-5 text-[15px] leading-7 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <p>
                    <strong>Veri Sorumlusu:</strong> Said Enes Akdaş - AES Insight
                </p>
                <p>
                    <strong>Adres:</strong> Yenimahalle, Ankara / Türkiye
                </p>
            </div>

            <LegalSection title="1. İşlenen Kişisel Verileriniz">
                <p>Fuevor platformunu kullanımınız sırasında aşağıdaki verileriniz işlenmektedir:</p>
                <ul className="list-disc space-y-2 pl-5 marker:text-[#007aff]">
                    <li>
                        <strong>Kimlik ve İletişim Bilgileri:</strong> Ad, soyad, kullanıcı adı, e-posta adresi, telefon numarası.
                    </li>
                    <li>
                        <strong>Kullanım ve Performans Verileri:</strong> Belirlediğiniz hedefler, tamamladığınız yapı taşları, planlanan görevler,
                        platform içi istatistikleriniz ve FU puanınız.
                    </li>
                    <li>
                        <strong>İçerik Verileri:</strong> Sisteme girdiğiniz kişisel notlar, okuduğunuz kitaplara verdiğiniz puanlar/yorumlar ve Ekip
                        Modu’ndaki görev dağılımları.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="2. Kişisel Verilerin İşlenme Amaçları">
                <p>
                    Kişisel verileriniz; profilinizin oluşturulması ve hedeflerinizin “Yol Haritası” üzerinde takip edilebilmesi, seçtiğiniz “Yol
                    Arkadaşı”na ilerlemeniz hakkında sınırlı görüntüleme yetkisi verilebilmesi, “Global Kitaplık” ve “Topluluk” modüllerinde paylaşım
                    yaptığınızda diğer kullanıcılarla etkileşiminizin sağlanması ve uygulama içi anımsatıcıların doğru zamanda iletilmesi amaçlarıyla
                    işlenmektedir.
                </p>
            </LegalSection>

            <LegalSection title="3. Kişisel Verilerin Aktarımı">
                <p>
                    Verileriniz, yalnızca yasal zorunluluklar kapsamında yetkili kamu kurumlarıyla paylaşılabilir. Bunun dışında hedefleriniz ve
                    notlarınız üçüncü taraf reklam şirketlerine <strong>satılmaz</strong>. Ancak, topluluğa açık paylaştığınız hedefler ve kitap
                    yorumlarınız diğer platform kullanıcıları tarafından görülebilir.
                </p>
            </LegalSection>

            <LegalSection title="4. İlgili Kişinin Hakları (KVKK Madde 11)">
                <p>
                    Kişisel verilerinizin işlenip işlenmediğini öğrenme, amacına uygun kullanılıp kullanılmadığını bilme, eksikse düzeltilmesini ve
                    silinmesini talep etme hakkına sahipsiniz. Başvurularınızı{' '}
                    <a className="font-semibold text-[#007aff] underline underline-offset-2" href="mailto:help@fuevor.com">
                        help@fuevor.com
                    </a>{' '}
                    adresine iletebilirsiniz.
                </p>
            </LegalSection>
        </article>
    );
}

export function PrivacyContent() {
    return (
        <article id="gizlilik-politikasi" className="scroll-mt-8 space-y-7">
            <header className="space-y-2">
                <p className="text-xs font-bold tracking-[0.16em] text-[#007aff] uppercase">Fuevor</p>
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl dark:text-white">Gizlilik Politikası</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yürürlük tarihi: 21 Ağustos 2026</p>
            </header>

            <LegalSection title="1. Bilgi Toplama ve Kullanım">
                <p>
                    Fuevor, hedeflerinizi yönetmek için sisteme girdiğiniz “Yapı Taşları”, “Bugünün Planı” ve “Kişisel Kitaplık” verilerinizi güvenli
                    sunucularda saklar. Yalnızca “Fuevor’da Yayınla” butonuna bastığınız içerikler (hedef isimleri ve kitap yorumları) genel akışa
                    düşer.
                </p>
            </LegalSection>

            <LegalSection title="2. Çerezler (Cookies) ve Yerel Depolama">
                <p>
                    Oturumunuzu açık tutmak, “Görünüm Ayarları” (Açık/Koyu tema) ve “Dil Seçimi” gibi tercihlerinizi hatırlamak amacıyla tarayıcınızda
                    çerezler ve yerel depolama (Local Storage) teknolojileri kullanılmaktadır.
                </p>
            </LegalSection>

            <LegalSection title="3. Ödeme ve Finansal Güvenlik">
                <p>
                    Fuevor platformu şu an için ücretsiz olarak sunulmakta olup, Kullanıcı’dan herhangi bir kredi kartı veya ödeme bilgisi talep
                    edilmemekte ve sistemlerimizde saklanmamaktadır. İlerleyen dönemlerde ücretli özelliklerin (Premium/Pro abonelikler) devreye
                    alınması halinde, tüm finansal işlemler BDDK lisanslı aracı ödeme kuruluşları üzerinden şifreli (SSL) olarak gerçekleştirilecek ve
                    kart bilgileriniz sunucularımızda kesinlikle tutulmayacaktır.
                </p>
            </LegalSection>

            <LegalSection title="4. Veri Silme Politikası">
                <p>
                    Kullanıcı, profil ayarları üzerinden hesabını sildiğinde; kişisel notları, yapı taşları ve hedefleri sunucularımızdan
                    anonimleştirilerek veya kalıcı olarak silinir. Ancak Ekip Modu’nda atanan ve tamamlanan ortak görevler, ekibin işleyişini bozmamak
                    adına anonim olarak (kullanıcı adı gizlenerek) tutulmaya devam edebilir.
                </p>
            </LegalSection>
        </article>
    );
}

export default function LegalDocumentContent({ document }: LegalDocumentContentProps) {
    return (
        <div className="space-y-12">
            {(document === 'terms' || document === 'all') && <TermsContent />}
            {document === 'all' && <hr className="border-slate-200 dark:border-slate-700" />}
            {(document === 'privacy' || document === 'all') && <KvkkContent />}
            {(document === 'privacy' || document === 'all') && <hr className="border-slate-200 dark:border-slate-700" />}
            {(document === 'privacy' || document === 'all') && <PrivacyContent />}
        </div>
    );
}
