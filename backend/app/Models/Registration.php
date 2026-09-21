<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    /**
     * Atribut yang dapat diisi secara mass-assignment.
     */
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relasi Eloquent
    |--------------------------------------------------------------------------
    */

    /**
     * Event yang didaftari.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relawan yang mendaftar.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Status
    |--------------------------------------------------------------------------
    */

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}