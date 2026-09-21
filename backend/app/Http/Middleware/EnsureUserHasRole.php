<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware proteksi endpoint berdasarkan role user.
 *
 * Penggunaan di routes/api.php:
 *   ->middleware('role:admin')
 *   ->middleware('role:organization,volunteer')  // multi-role diizinkan
 */
class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Daftar role yang diizinkan mengakses route.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Pengguna belum terautentikasi (token tidak valid / tidak dikirim).
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
            ], 401);
        }

        // Role user tidak termasuk dalam daftar role yang diizinkan.
        if (! in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Endpoint ini hanya untuk role: '.implode(', ', $roles).'.',
            ], 403);
        }

        return $next($request);
    }
}