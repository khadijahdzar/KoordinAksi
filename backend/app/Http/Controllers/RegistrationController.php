<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller pendaftaran relawan ke event:
 * - Relawan mendaftar / membatalkan pendaftaran & melihat riwayat (role: volunteer)
 * - Organisasi mengelola status pendaftaran: accept / reject (role: organization)
 */
class RegistrationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Aksi Relawan
    |--------------------------------------------------------------------------
    */

    /**
     * Relawan mendaftar ke suatu event.
     *
     * POST /api/events/{event}/register
     */
    public function register(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        // Event harus sedang membuka pendaftaran.
        if (! $event->isOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran untuk event ini sedang ditutup (status: '.$event->status.').',
            ], 422);
        }

        // Kuota relawan yang diterima tidak boleh terlampaui.
        if ($event->remainingQuota() <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota relawan untuk event ini sudah penuh.',
            ], 422);
        }

        // Cegah pendaftaran ganda secara aman (unique constraint event_id + user_id).
        try {
            $registration = DB::transaction(function () use ($user, $event) {
                return Registration::create([
                    'event_id' => $event->id,
                    'user_id' => $user->id,
                    'status' => 'pending',
                ]);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah terdaftar pada event ini.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Menunggu konfirmasi organisasi.',
            'data' => [
                'registration' => $registration->load('event:id,title,category,location,event_date,status'),
            ],
        ], 201);
    }

    /**
     * Riwayat pendaftaran milik relawan yang login.
     *
     * GET /api/registrations/my
     */
    public function myRegistrations(Request $request): JsonResponse
    {
        $registrations = $request->user()
            ->registrations()
            ->with([
                'event:id,organization_id,title,category,location,event_date,status',
                'event.organization:id,organization_name,city',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pendaftaran berhasil diambil.',
            'data' => [
                'registrations' => $registrations,
            ],
        ]);
    }

    /**
     * Relawan membatalkan pendaftarannya (hanya saat masih pending).
     *
     * DELETE /api/registrations/{registration}
     */
    public function cancel(Request $request, Registration $registration): JsonResponse
    {
        // Pendaftaran harus milik relawan yang login.
        if ($registration->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Pendaftaran ini bukan milik Anda.',
            ], 403);
        }

        if (! $registration->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran yang sudah diproses ('.$registration->status.') tidak dapat dibatalkan.',
            ], 422);
        }

        $registration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil dibatalkan.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Aksi Organisasi (Manajemen Status Pendaftaran)
    |--------------------------------------------------------------------------
    */

    /**
     * Daftar seluruh pendaftar pada satu event milik organisasi.
     *
     * GET /api/organization/events/{event}/registrations
     */
    public function eventRegistrations(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $registrations = $event->registrations()
            ->with('user:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pendaftar event berhasil diambil.',
            'data' => [
                'event' => $event->only(['id', 'title', 'quota', 'status']),
                'registrations' => $registrations,
            ],
        ]);
    }

    /**
     * Organisasi menerima pendaftaran relawan (dengan pengecekan kuota).
     *
     * PATCH /api/registrations/{registration}/accept
     */
    public function accept(Request $request, Registration $registration): JsonResponse
    {
        $this->authorizeRegistration($request, $registration);

        if ($registration->isAccepted()) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran ini sudah diterima sebelumnya.',
            ], 422);
        }

        $event = $registration->event;

        if ($event->remainingQuota() <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota event sudah penuh. Tidak dapat menerima relawan lagi.',
            ], 422);
        }

        $registration->update(['status' => 'accepted']);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran relawan berhasil diterima.',
            'data' => [
                'registration' => $registration->fresh()->load('user:id,name,email'),
            ],
        ]);
    }

    /**
     * Organisasi menolak pendaftaran relawan.
     *
     * PATCH /api/registrations/{registration}/reject
     */
    public function reject(Request $request, Registration $registration): JsonResponse
    {
        $this->authorizeRegistration($request, $registration);

        if ($registration->status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran ini sudah ditolak sebelumnya.',
            ], 422);
        }

        $registration->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran relawan berhasil ditolak.',
            'data' => [
                'registration' => $registration->fresh()->load('user:id,name,email'),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Internal
    |--------------------------------------------------------------------------
    */

    /**
     * Pastikan pendaftaran berada pada event milik organisasi yang login.
     */
    private function authorizeRegistration(Request $request, Registration $registration): void
    {
        $organization = $request->user()->organization;

        if (! $organization || $registration->event->organization_id !== $organization->id) {
            abort(response()->json([
                'success' => false,
                'message' => 'Forbidden. Pendaftaran ini bukan pada event milik organisasi Anda.',
            ], 403));
        }
    }

    /**
     * Pastikan event yang diakses benar milik organisasi user yang login.
     */
    private function authorizeEventOwnership(Request $request, Event $event): void
    {
        $organization = $request->user()->organization;

        if (! $organization || $event->organization_id !== $organization->id) {
            abort(response()->json([
                'success' => false,
                'message' => 'Forbidden. Event ini bukan milik organisasi Anda.',
            ], 403));
        }
    }
}