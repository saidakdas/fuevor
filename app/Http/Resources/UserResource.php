<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'profession' => $this->profession,
            'country' => $this->country,
            'gender' => $this->gender,
            'early_access_at' => $this->early_access_at?->toISOString(),
            'role' => $this->role,
            'fu_balance' => $this->fu_balance,
            'show_fu_publicly' => $this->show_fu_publicly,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
