<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'profession',
        'country',
        'gender',
        'early_access_at',
        'terms_accepted_at',
        'terms_version',
        'privacy_acknowledged_at',
        'privacy_version',
        'password',
        'role',
        'show_fu_publicly',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'early_access_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'privacy_acknowledged_at' => 'datetime',
            'fu_balance' => 'integer',
            'show_fu_publicly' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    public function betaWorkspace(): HasOne
    {
        return $this->hasOne(BetaWorkspace::class);
    }

    public function communityGoalPosts(): HasMany
    {
        return $this->hasMany(CommunityGoalPost::class);
    }

    public function communityGoalIdeas(): HasMany
    {
        return $this->hasMany(CommunityGoalIdea::class);
    }

    public function communityBookReviews(): HasMany
    {
        return $this->hasMany(CommunityBookReview::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function betaFeedback(): HasMany
    {
        return $this->hasMany(BetaFeedback::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
