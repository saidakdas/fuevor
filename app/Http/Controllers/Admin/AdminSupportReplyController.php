<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminSupportReplyController extends Controller
{
    public function __invoke(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:3000'],
        ]);

        $ticket->messages()->create([
            'user_id' => $request->user()->id,
            'is_admin' => true,
            'body' => trim($validated['body']),
        ]);
        $ticket->update(['status' => 'answered']);

        return back()->with('success', 'Destek yanıtı gönderildi.');
    }
}
