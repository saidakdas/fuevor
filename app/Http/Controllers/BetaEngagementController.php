<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BetaEngagementController extends Controller
{
    public function storeSupport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'min:3', 'max:3000'],
        ], [
            'body.required' => 'Destek mesajı yazmalısınız.',
            'body.min' => 'Destek mesajı en az 3 karakter olmalıdır.',
            'body.max' => 'Destek mesajı en fazla 3000 karakter olabilir.',
        ]);

        $ticket = DB::transaction(function () use ($request, $validated) {
            $ticket = $request->user()->supportTickets()->create(['status' => 'open']);
            $ticket->messages()->create([
                'user_id' => $request->user()->id,
                'is_admin' => false,
                'body' => trim($validated['body']),
            ]);

            return $ticket;
        });

        return response()->json([
            'ticket' => $this->ticket($ticket->load('messages')),
        ], 201);
    }

    public function storeFeedback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['required', 'string', 'min:3', 'max:3000'],
        ], [
            'rating.required' => 'Bir puan seçmelisiniz.',
            'rating.between' => 'Puan 1 ile 5 arasında olmalıdır.',
            'comment.required' => 'Değerlendirmenizi yazmalısınız.',
            'comment.min' => 'Değerlendirme en az 3 karakter olmalıdır.',
            'comment.max' => 'Değerlendirme en fazla 3000 karakter olabilir.',
        ]);

        $feedback = $request->user()->betaFeedback()->create([
            'rating' => $validated['rating'],
            'comment' => trim($validated['comment']),
        ]);

        return response()->json([
            'feedback' => [
                'id' => $feedback->id,
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'created_at' => $feedback->created_at?->toISOString(),
            ],
        ], 201);
    }

    /** @return array<string, mixed> */
    private function ticket(SupportTicket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'status' => $ticket->status,
            'created_at' => $ticket->created_at?->toISOString(),
            'messages' => $ticket->messages->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'is_admin' => $message->is_admin,
                'created_at' => $message->created_at?->toISOString(),
            ])->values(),
        ];
    }
}
