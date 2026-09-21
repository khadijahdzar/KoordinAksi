<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller publik untuk menjelajah kegiatan sosial (fitur "Kegiatan Sosial"):
 * - Daftar event dengan filter kategori, lokasi, tanggal, dan pencarian kata kunci.
 * - Detail event beserta informasi organisasi penyelenggara.
 */
class EventController extends Controller
{
    /**
     * Daftar event yang sedang membuka pendaftaran (publik).
     * Mendukung filter: ?category=, ?city=, ?date=, ?search=, ?status=
     *
     * GET /api/events
     */
    public function index(Request $request): JsonResponse
    {
        $events = Event::query()
            ->with('organization:id,organization_name,city,verification_status')
            ->withCount([
                'registrations',
                'registrations as accepted_registrations_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])
            // Default: hanya event open; ?status=all untuk melihat semua.
            ->when(
                $request->query('status') !== 'all',
                fn ($query) => $query->where('status', 'open'),
            )
            ->when(
                $request->query('status') === 'all' && $request->query('status_filter'),
                fn ($query, $status) => $query->where('status', $status),
            )
            ->when(
                $request->query('category'),
                fn ($query, $category) => $query->where('category', $category),
            )
            ->when(
                $request->query('city'),
                fn ($query, $city) => $query->where('location', 'like', '%'.$city.'%'),
            )
            ->when(
                $request->query('date'),
                fn ($query, $date) => $query->whereDate('event_date', $date),
            )
            ->when(
                $request->query('search'),
                fn ($query, $search) => $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', '%'.$search.'%')
                        ->orWhere('description', 'like', '%'.$search.'%');
                }),
            )
            ->orderBy('event_date')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kegiatan sosial berhasil diambil.',
            'data' => [
                'events' => $events,
            ],
        ]);
    }

    /**
     * Detail satu event (publik), termasuk organisasi penyelenggara.
     *
     * GET /api/events/{event}
     */
    public function show(Event $event): JsonResponse
    {
        $event->load('organization:id,user_id,organization_name,description,phone,city,verification_status')
            ->loadCount([
                'registrations',
                'registrations as accepted_registrations_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail kegiatan sosial berhasil diambil.',
            'data' => [
                'event' => $event,
            ],
        ]);
    }
}