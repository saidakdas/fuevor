<?php

declare(strict_types=1);

$environmentPath = dirname(__DIR__).'/.env';

if (! is_file($environmentPath) || ! is_readable($environmentPath) || ! is_writable($environmentPath)) {
    fwrite(STDERR, "Production .env dosyası okunamıyor veya yazılamıyor.\n");
    exit(1);
}

$contents = file_get_contents($environmentPath);

if ($contents === false) {
    fwrite(STDERR, "Production .env dosyası okunamadı.\n");
    exit(1);
}

$value = static function (string $key) use (&$contents): ?string {
    if (! preg_match('/^'.preg_quote($key, '/').'=(.*)$/m', $contents, $matches)) {
        return null;
    }

    return trim(trim($matches[1]), "\"'");
};

$set = static function (string $key, string $newValue) use (&$contents): void {
    $line = $key.'='.$newValue;
    $pattern = '/^'.preg_quote($key, '/').'=.*$/m';

    if (preg_match($pattern, $contents)) {
        $contents = preg_replace($pattern, $line, $contents, 1) ?? $contents;

        return;
    }

    $contents = rtrim($contents).PHP_EOL.$line.PHP_EOL;
};

$mailer = $value('MAIL_MAILER');

if ($mailer === null || $mailer === '' || $mailer === 'log') {
    $set('MAIL_MAILER', 'sendmail');
}

$fromAddress = $value('MAIL_FROM_ADDRESS');

if ($fromAddress === null || $fromAddress === '' || $fromAddress === 'hello@example.com') {
    $set('MAIL_FROM_ADDRESS', 'help@fuevor.com');
}

$fromName = $value('MAIL_FROM_NAME');

if ($fromName === null || $fromName === '' || $fromName === '${APP_NAME}') {
    $set('MAIL_FROM_NAME', '"Fuevor"');
}

$temporaryPath = $environmentPath.'.mail-config.tmp';

if (file_put_contents($temporaryPath, $contents, LOCK_EX) === false || ! rename($temporaryPath, $environmentPath)) {
    @unlink($temporaryPath);
    fwrite(STDERR, "Production mail ayarları kaydedilemedi.\n");
    exit(1);
}

echo "Production mail transport hazır.\n";
