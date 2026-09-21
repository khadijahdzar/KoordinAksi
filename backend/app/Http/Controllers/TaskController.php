<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Controller manajemen tugas:
 * - Organisasi membuat tugas & menugaskannya ke relawan yang diterima (role: organization)
 * - Relawan melihat & memperbarui status tugas mereka (role: volunteer)
 */
class TaskController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Aksi Organisasi
    |--------------------------------------------------------------------------
    */

    /**
     * Organisasi membuat & membagikan tugas ke relawan pada event miliknya.
     * Relawan yang ditugaskan WAJIB berstatus accepted pada event tersebut.
     *
     * POST /api/organization/events/{event}/tasks
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'task_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:pending'],
        ]);

        // Relawan yang ditugaskan harus sudah diterima (accepted) di event ini.
        $isAcceptedVolunteer = Registration::where('event_id', $event->id)
            ->where('user_id', $validated['user_id'])
            ->where('status', 'accepted')
            ->exists();

        if (! $isAcceptedVolunteer) {
            return response()->json([
                'success' => false,
                'message' => 'User tersebut bukan relawan yang telah diterima (accepted) pada event ini. Tugas hanya dapat diberikan ke relawan accepted.',
            ], 422);
        }

        $task = $event->tasks()->create([
            ...$validated,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tugas berhasil dibuat dan dibagikan ke relawan.',
            'data' => [
                'task' => $task->load('user:id,name,email'),
            ],
        ], 201);
    }

    /**
     * Daftar seluruh tugas pada satu event milik organisasi.
     *
     * GET /api/organization/events/{event}/tasks
     */
    public function index(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEventOwnership($request, $event);

        $tasks = $event->tasks()
            ->with('user:id,name,email')
            ->when(
                $request->query('status'),
                fn ($query, $status) => $query->where('status', $status),
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tugas event berhasil diambil.',
            'data' => [
                'event' => $event->only(['id', 'title', 'status']),
                'tasks' => $tasks,
            ],
        ]);
    }

    /**
     * Detail satu tugas milik organisasi.
     *
     * GET /api/organization/tasks/{task}
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        return response()->json([
            'success' => true,
            'message' => 'Detail tugas berhasil diambil.',
            'data' => [
                'task' => $task->load(['user:id,name,email', 'event:id,title,organization_id']),
            ],
        ]);
    }

    /**
     * Organisasi memperbarui isi tugas (nama, deskripsi) atau memindahkan penugasan
     * ke relawan lain yang juga accepted pada event yang sama.
     *
     * PUT /api/organization/tasks/{task}
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        $validated = $request->validate([
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'task_name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        // Bila penerima tugas diganti, relawan baru harus accepted pada event yang sama.
        if (isset($validated['user_id']) && (int) $validated['user_id'] !== $task->user_id) {
            $isAcceptedVolunteer = Registration::where('event_id', $task->event_id)
                ->where('user_id', $validated['user_id'])
                ->where('status', 'accepted')
                ->exists();

            if (! $isAcceptedVolunteer) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tersebut bukan relawan yang telah diterima (accepted) pada event ini.',
                ], 422);
            }
        }

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tugas berhasil diperbarui.',
            'data' => [
                'task' => $task->fresh()->load('user:id,name,email'),
            ],
        ]);
    }

    /**
     * Organisasi menghapus tugas.
     *
     * DELETE /api/organization/tasks/{task}
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tugas berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Aksi Relawan
    |--------------------------------------------------------------------------
    */

    /**
     * Relawan melihat seluruh tugas yang diberikan kepada mereka.
     *
     * GET /api/tasks/my
     */
    public function myTasks(Request $request): JsonResponse
    {
        $tasks = $request->user()
            ->tasks()
            ->with([
                'event:id,title,category,location,event_date,organization_id',
                'event.organization:id,organization_name,city',
            ])
            ->when(
                $request->query('status'),
                fn ($query, $status) => $query->where('status', $status),
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tugas relawan berhasil diambil.',
            'data' => [
                'tasks' => $tasks,
            ],
        ]);
    }

    /**
     * Relawan memperbarui status tugas miliknya.
     * Alur status yang valid: pending -> in_progress -> completed.
     *
     * PATCH /api/tasks/{task}/status
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        // Tugas harus milik relawan yang login.
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Tugas ini bukan milik Anda.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,in_progress,completed'],
        ]);

        $newStatus = $validated['status'];
        $currentStatus = $task->status;

        // Tugas yang sudah selesai tidak dapat diubah lagi (final state).
        if ($currentStatus === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Tugas ini sudah selesai (completed) dan tidak dapat diubah lagi.',
            ], 422);
        }

        // Validasi alur transisi status: tidak boleh melompat.
        $allowedTransitions = [
            'pending' => ['in_progress', 'completed'],
            'in_progress' => ['completed'],
        ];

        if (! in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
            throw ValidationException::withMessages([
                'status' => ["Transisi status tidak valid dari '{$currentStatus}' ke '{$newStatus}'. Alur yang benar: pending -> in_progress -> completed."],
            ]);
        }

        $task->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Status tugas berhasil diperbarui menjadi '.$newStatus.'.',
            'data' => [
                'task' => $task->fresh()->load('event:id,title'),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Internal
    |--------------------------------------------------------------------------
    */

    /**
     * Pastikan tugas berada pada event milik organisasi yang login.
     */
    private function authorizeTaskOwnership(Request $request, Task $task): void
    {
        $organization = $request->user()->organization;

        if (! $organization || $task->event->organization_id !== $organization->id) {
            abort(response()->json([
                'success' => false,
                'message' => 'Forbidden. Tugas ini bukan pada event milik organisasi Anda.',
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