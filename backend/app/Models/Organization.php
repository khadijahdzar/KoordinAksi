<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    /**
     * Atribut yang dapat diisi secara mass-assignment.
     */
    protected $fillable = [
        'user_id',
        'organization_name',
        'description',
        'phone',
        'city',
        'verification_status',
    ];

    /**
     * Casting atribut.
     */
    protected function casts(): array
    {
        return [
            'verification_status' => 'string',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relasi Eloquent
    |--------------------------------------------------------------------------
    */

    /**
     * Akun user pemilik organisasi.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Seluruh event yang diselenggarakan organisasi.
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Status Verifikasi
    |--------------------------------------------------------------------------
    */

    public function isApproved(): bool
    {
        return $this->verification_status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->verification_status === 'pending';
    }
}