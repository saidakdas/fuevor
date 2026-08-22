<!doctype html>
<html lang="{{ $language }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $language === 'tr' ? 'E-posta doğrulama' : 'Email verification' }}</title>
</head>
<body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#171717">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f5f7fb">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;padding:36px;box-shadow:0 16px 44px rgba(15,23,42,.08)">
                    <tr><td style="font-size:38px;font-weight:800;letter-spacing:-2px">fuevor <span style="font-size:14px;color:#6bd94a;letter-spacing:0">beta</span></td></tr>
                    <tr><td style="padding-top:30px;font-size:24px;font-weight:700">{{ $language === 'tr' ? 'E-posta adresini doğrula' : 'Verify your email address' }}</td></tr>
                    <tr><td style="padding-top:12px;font-size:16px;line-height:1.6;color:#646a73">{{ $language === 'tr' ? 'Canlı beta kaydını tamamlamak için aşağıdaki 6 haneli kodu kullan.' : 'Use the 6-digit code below to complete your live beta registration.' }}</td></tr>
                    <tr><td align="center" style="padding:30px 0 22px"><div style="display:inline-block;padding:18px 28px;border-radius:16px;background:#eef5ff;color:#087bff;font-size:36px;font-weight:800;letter-spacing:10px">{{ $code }}</div></td></tr>
                    <tr><td style="font-size:14px;line-height:1.6;color:#8a9099">{{ $language === 'tr' ? "Bu kod {$expiresInMinutes} dakika geçerlidir. Bu kaydı sen başlatmadıysan e-postayı yok sayabilirsin." : "This code is valid for {$expiresInMinutes} minutes. If you did not start this registration, you can ignore this email." }}</td></tr>
                    <tr><td style="padding-top:28px;font-size:13px;color:#6bd94a;font-weight:700">Build Your Future Self.</td></tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
