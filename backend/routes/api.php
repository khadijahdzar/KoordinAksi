<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — KoordinAksi: Smart Volunteer Management System
|--------------------------------------------------------------------------
|
| Struktur rute:
| 1. Publik        : register, login, jelajah event
| 2. Terproteksi   : auth:sanctum + middleware role (admin/organization/volunteer)
|
| Header autentikasi (Postman):
|   Authorization: Bearer {token}
|   Accept: application/json
|
*/

/*
|--------------------------------------------------------------------------
| 1. Rute Publik (tanpa autentikasi)
|--------------------------------------------------------------------------
*/

// --- Autentikasi ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Jelajah kegiatan sosial (homepage & halaman kegiatan) ---
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);

/*
|--------------------------------------------------------------------------
| 2. Rute Terproteksi (auth:sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // --- Profil user yang sedang login (semua role) ---
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | 2a. ADMIN — Verifikasi organisasi & manajemen sistem
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Verifikasi organisasi: approve / reject / pending
        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::patch('/organizations/{organization}/verify', [OrganizationController::class, 'verify']);
    });

    /*
    |--------------------------------------------------------------------------
    | 2b. ORGANIZATION — Profil organisasi, CRUD event, kelola pendaftar & tugas
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:organization')->prefix('organization')->group(function () {

        // Profil organisasi milik sendiri
        Route::get('/profile', [OrganizationController::class, 'myOrganization']);
        Route::put('/profile', [OrganizationController::class, 'updateOrganization']);

        // CRUD event milik organisasi
        Route::get('/events', [OrganizationController::class, 'myEvents']);
        Route::post('/events', [OrganizationController::class, 'storeEvent']);
        Route::get('/events/{event}', [OrganizationController::class, 'showEvent']);
        Route::put('/events/{event}', [OrganizationController::class, 'updateEvent']);
        Route::delete('/events/{event}', [OrganizationController::class, 'destroyEvent']);

        // Manajemen pendaftar pada event milik organisasi
        Route::get('/events/{event}/registrations', [RegistrationController::class, 'eventRegistrations']);

        // Manajemen tugas pada event milik organisasi
        Route::get('/events/{event}/tasks', [TaskController::class, 'index']);
        Route::post('/events/{event}/tasks', [TaskController::class, 'store']);

        // Operasi langsung pada tugas spesifik
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    });

    // --- Registrasi profil organisasi (di luar prefix agar URL bersih) ---
    Route::middleware('role:organization')->group(function () {
        Route::post('/organizations', [OrganizationController::class, 'registerOrganization']);
    });

    /*
    |--------------------------------------------------------------------------
    | 2c. ORGANIZATION — Manajemen status pendaftaran (accept/reject)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:organization')->group(function () {
        Route::patch('/registrations/{registration}/accept', [RegistrationController::class, 'accept']);
        Route::patch('/registrations/{registration}/reject', [RegistrationController::class, 'reject']);
    });

    /*
    |--------------------------------------------------------------------------
    | 2d. VOLUNTEER — Pendaftaran event, riwayat, & tugas relawan
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:volunteer')->group(function () {

        // Mendaftar ke suatu event
        Route::post('/events/{event}/register', [RegistrationController::class, 'register']);

        // Riwayat pendaftaran & pembatalan
        Route::get('/registrations/my', [RegistrationController::class, 'myRegistrations']);
        Route::delete('/registrations/{registration}', [RegistrationController::class, 'cancel']);

        // Tugas relawan
        Route::get('/tasks/my', [TaskController::class, 'myTasks']);
        Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    });
});