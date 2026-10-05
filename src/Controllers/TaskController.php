<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Http;
use App\Core\Session;
use App\Models\Task;

final class TaskController
{
    private const MAX_TITLE_LENGTH = 255;

    public function __construct(private Task $tasks = new Task())
    {
    }

    /** GET /api/tasks */
    public function index(): void
    {
        Http::json(['data' => $this->tasks->all($this->uid())]);
    }

    /** POST /api/tasks */
    public function store(): void
    {
        $title = Http::body()['title'] ?? '';
        $title = is_string($title) ? trim($title) : '';

        if ($title === '') {
            Http::json(['error' => 'El campo "title" es obligatorio.'], 400);
            return;
        }
        if (mb_strlen($title) > self::MAX_TITLE_LENGTH) {
            Http::json(['error' => 'El título no puede superar ' . self::MAX_TITLE_LENGTH . ' caracteres.'], 400);
            return;
        }

        Http::json(['data' => $this->tasks->create($this->uid(), $title)], 201);
    }

    /** PATCH /api/tasks/{id}/toggle */
    public function toggle(int $id): void
    {
        $task = $this->tasks->toggle($id, $this->uid());

        $task === null
            ? Http::json(['error' => 'Tarea no encontrada.'], 404)
            : Http::json(['data' => $task]);
    }

    /** DELETE /api/tasks/{id} */
    public function destroy(int $id): void
    {
        $this->tasks->delete($id, $this->uid())
            ? Http::json(['message' => 'Tarea eliminada.'])
            : Http::json(['error' => 'Tarea no encontrada.'], 404);
    }

    private function uid(): int
    {
        return (int) Session::userId(); // el router garantiza sesión activa
    }
}