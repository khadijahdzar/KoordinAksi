<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller untuk manajemen organisasi:
 * - Registrasi & pengelolaan profil organisasi (role: organization)
 * - CRUD event milik organisasi (role: organization)
 * - Verifikasi organisasi (role: admin)
 */
class OrganizationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Profil Organisasi
    |--------------------------------------------------------------------------
    */

    /**
     * Registrasi data organisasi untuk user dengan role organization.
     *
     * POST /api/organizations
     */
    public function registerOrganization(Request $request): JsonResponse
    {
        $user = $request->user();

        // Satu user organization hanya boleh memiliki satu profil organisasi.
        if ($user->organization()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Profil organisasi sudah terdaftar untuk akun ini.',
            ], 409);
        }

        $validated = $request->validate([
            'organization_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['required', 'string', 'max:100'],
        ]);

        $organization = $user->organization()->create([
            'organization_name' => $validated['organization_name'],
            'description' => $validated['description'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'],
            'verification_status' => 'pending', // Menunggu verifikasi admin.
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil organisasi berhasil didaftarkan. Menunggu verifikasi admin.',
            'data' => [
                'organization' => $organization,
            ],
        ], 201);
    }

    /**
     * Menampilkan profil organisasi milik user yang login.
     *
     * GET /api/organizations/my
     */
    public function myOrganization(Request $request): JsonResponse
    {
        $organization = $request->user()->organization()->withCount('events')->first();

        if (! $organization) {
            return response()->json([
                'success' => false,
                'message' => 'Profil organisasi belum terdaftar.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil organisasi berhasil diambil.',
            'data' => [
                'organization' => $organization,
            ],
        ]);
    }

    /**
     * Memperbarui profil organisasi milik user yang login.
     * verification_status hanya dapat diubah oleh admin.
     *
     * PUT /api/organizations/my
     */
    public function updateOrganization(Request $request): JsonResponse
    {
        $organization = $request->user()->organization;

        if (! $organization) {
            return response()->json([
                'success' => false,
                'message' => 'Profil organisasi belum terdaftar.',
            ], 404);
        }

        $validated = $request->validate([
            'organization_name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
        ]);

        $organization->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil organisasi berhasil diperbarui.',
            'data' => [
                'organization' => $organization->fresh(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD Event (milik organisasi yang login)
    |--------------------------------------------------------------------------
    */

    /**
     * Membuat event baru. Hanya organisasi yang sudah terverifikasi (approved).
     *
     * POST /api/organization/events
     */
    public function storeEvent(Request $request): JsonResponse
    {
        $organization = $this->getOwnedOrganization($request);

        if (! $organization->isApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Organisasi belum terverifikasi. Menunggu persetujuan admin sebelum dapat membuat event.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'location' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date', 'after:now'],
            'quota' => ['required', 'integer', 'min:1'],
            'requirements' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,open'],
        ]);

        $event = $organization->events()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil dibuat.',
            'data' => [
                'event' => $event,
            ],
        ], 201);
    }

    /**
     * Daftar seluruh event milik organisasi yang login.
     *
     * GET /api/organization/events
     */
    public function myEvents(Request $request): JsonResponse
    {
        $organization = $this->getOwnedOrganization($request);

        $events = $organization->events()
            ->withCount([
                'registrations',
                'registrations as accepted_registrations_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])
            ->latest('event_date')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar event organisasi berhasil diambil.',
            'data' => [
                'organization' => $organization->only(['id', 'organization_name', 'verification_status']),
                'events' => $events,
            ],
        ]);
    }

    /**
     * Detail event milik organisasi (beserta daftar pendaftar).
     *
     * GET /api/organization/events/{event}
     */
    public function showEvent(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $event->load([
            'registrations.user:id,name,email',
        ])->loadCount([
            'registrations',
            'registrations as accepted_registrations_count' => function ($query) {
                $query->where('status', 'accepted');
            },
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail event berhasil diambil.',
            'data' => [
                'event' => $event,
            ],
        ]);
    }

    /**
     * Memperbarui event milik organisasi.
     *
     * PUT /api/organization/events/{event}
     */
    public function updateEvent(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'event_date' => ['sometimes', 'required', 'date'],
            'quota' => ['sometimes', 'required', 'integer', 'min:1'],
            'requirements' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,open,ongoing,completed,cancelled'],
        ]);

        // Kuota tidak boleh lebih kecil dari jumlah relawan yang sudah diterima.
        if (isset($validated['quota']) && $validated['quota'] < $event->acceptedRegistrationsCount()) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota tidak boleh lebih kecil dari jumlah relawan yang sudah diterima ('.$event->acceptedRegistrationsCount().').',
            ], 422);
        }

        $event->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil diperbarui.',
            'data' => [
                'event' => $event->fresh(),
            ],
        ]);
    }

    /**
     * Menghapus event milik organisasi.
     *
     * DELETE /api/organization/events/{event}
     */
    public function destroyEvent(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Verifikasi Organisasi (Admin)
    |--------------------------------------------------------------------------
    */

    /**
     * Daftar seluruh organisasi (untuk admin), dapat difilter berdasarkan status verifikasi.
     *
     * GET /api/admin/organizations?verification_status=pending
     */
    public function index(Request $request): JsonResponse
    {
        $organizations = Organization::with('user:id,name,email,role')
            ->when(
                $request->query('verification_status'),
                fn ($query, $status) => $query->where('verification_status', $status),
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar organisasi berhasil diambil.',
            'data' => [
                'organizations' => $organizations,
            ],
        ]);
    }

    /**
     * Verifikasi organisasi oleh admin (approve / reject).
     *
     * PATCH /api/admin/organizations/{organization}/verify
     */
    public function verify(Request $request, Organization $organization): JsonResponse
    {
        $validated = $request->validate([
            'verification_status' => ['required', 'string', 'in:approved,rejected,pending'],
        ]);

        $organization->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Status verifikasi organisasi berhasil diperbarui menjadi '.$organization->verification_status.'.',
            'data' => [
                'organization' => $organization->fresh()->load('user:id,name,email,role'),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Internal
    |--------------------------------------------------------------------------
    */

    /**
     * Ambil profil organisasi milik user yang login, atau gagal 404.
     */
    private function getOwnedOrganization(Request $request): Organization
    {
        $organization = $request->user()->organization;

        if (! $organization) {
            abort(response()->json([
                'success' => false,
                'message' => 'Profil organisasi belum terdaftar. Daftarkan organisasi terlebih dahulu.',
            ], 404));
        }

        return $organization;
    }

    /**
     * Pastikan event yang diakses benar milik organisasi user yang login.
     */
    private function authorizeEventOwnership(Request $request, Event $event): void
    {
        $organization = $this->getOwnedOrganization($request);

        if ($event->organization_id !== $organization->id) {
            abort(response()->json([
                'success' => false,
                'message' => 'Forbidden. Event ini bukan milik organisasi Anda.',
            ], 403));
        }
    }
}