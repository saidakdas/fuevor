<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
        public readonly int $expiresInMinutes,
        public readonly string $language,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->language === 'tr'
                ? 'Fuevor e-posta doğrulama kodun'
                : 'Your Fuevor email verification code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.email-verification-code',
        );
    }
}
