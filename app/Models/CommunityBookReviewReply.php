<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityBookReviewReply extends Model
{
    protected $fillable = ['body', 'user_id'];

    public function review(): BelongsTo
    {
        return $this->belongsTo(CommunityBookReview::class, 'community_book_review_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
