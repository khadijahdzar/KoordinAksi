<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Akun admin default untuk testing endpoint admin di Postman.
        User::updateOrCreate(
            ['email' => 'admin@koordinaksi.test'],
            [
                'name' => 'Admin KoordinAksi',
                'password' => 'password', // Otomatis di-hash oleh cast 'hashed'.
                'role' => 'admin',
            ],
        );
    }
}