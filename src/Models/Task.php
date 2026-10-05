<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class Task
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function all(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, title, completed, created_at FROM tasks WHERE user_id = :uid ORDER BY id DESC'
        );
        $stmt->execute([':uid' => $userId]);

        return array_map([$this, 'cast'], $stmt->fetchAll());
    }

    public function find(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, title, completed, created_at FROM tasks WHERE id = :id AND user_id = :uid'
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);
        $row = $stmt->fetch();

        return $row ? $this->cast($row) : null;
    }

    public function create(int $userId, string $title): array
    {
        $stmt = $this->db->prepare('INSERT INTO tasks (title, user_id) VALUES (:title, :uid)');
        $stmt->execute([':title' => $title, ':uid' => $userId]);

        return $this->find((int) $this->db->lastInsertId(), $userId);
    }

    public function toggle(int $id, int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'UPDATE tasks SET completed = 1 - completed WHERE id = :id AND user_id = :uid'
        );
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        return $stmt->rowCount() > 0 ? $this->find($id, $userId) : null;
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM tasks WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        return $stmt->rowCount() > 0;
    }

    private function cast(array $row): array
    {
        $row['id']        = (int) $row['id'];
        $row['completed'] = (bool) $row['completed'];

        return $row;
    }
}