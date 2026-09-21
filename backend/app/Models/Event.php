<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    /**
     * Atribut yang dapat diisi secara mass-assignment.
     */
    protected $fillable = [
        'organization_id',
        'title',
        'category',
        'description',
        'location',
        'event_date',
        'quota',
        'requirements',
        'status',
    ];

    /**
     * Casting atribut.
     */
    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'quota' => 'integer',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relasi Eloquent
    |--------------------------------------------------------------------------
    */

    /**
     * Organisasi penyelenggara event.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Seluruh pendaftaran relawan pada event ini.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * Seluruh tugas yang dibuat untuk event ini.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper & Atribut Turunan
    |--------------------------------------------------------------------------
    */

    /**
     * Jumlah relawan yang pendaftarannya sudah diterima.
     */
    public function acceptedRegistrationsCount(): int
    {
        return $this->registrations()
            ->where('status', 'accepted')
            ->count();
    }

    /**
     * Sisa kuota relawan yang masih bisa diterima.
     */
    public function remainingQuota(): int
    {
        return max(0, $this->quota - $this->acceptedRegistrationsCount());
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}