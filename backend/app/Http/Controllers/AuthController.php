<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Controller autentikasi: register multi-role, login (Sanctum token), logout.
 */
class AuthController extends Controller
{
    /**
     * Registrasi user baru (multi-role: volunteer & organization).
     *
     * POST /api/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            // Role admin tidak dapat didaftarkan lewat endpoint publik (dibuat via seeder).
            'role' => ['required', 'string', 'in:volunteer,organization'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // Otomatis di-hash oleh cast 'hashed'.
            'role' => $validated['role'],
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Login dan mengembalikan token Laravel Sanctum.
     *
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang diberikan salah.'],
            ]);
        }

        // Hapus token lama milik user agar satu akun tidak menumpuk token.
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        // Muat relasi profil organisasi bila user adalah organization.
        if ($user->isOrganization()) {
            $user->load('organization');
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Logout: mencabut token Sanctum yang sedang digunakan.
     *
     * POST /api/logout  (auth:sanctum)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Token telah dicabut.',
        ]);
    }

    /**
     * Menampilkan profil user yang sedang login.
     *
     * GET /api/me  (auth:sanctum)
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isOrganization()) {
            $user->load('organization');
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil user berhasil diambil.',
            'data' => [
                'user' => $user,
            ],
        ]);
    }
}