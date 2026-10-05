<?php
declare(strict_types=1);

namespace App\Core;

use PDO;

final class Database
{
    private static ?PDO $connection = null;

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $dir = dirname(__DIR__, 2) . '/database';
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new \RuntimeException('No se pudo crear el directorio de la base de datos.');
            }

            $pdo = new PDO('sqlite:' . $dir . '/tasks.db', null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON');

            self::migrate($pdo);
            self::$connection = $pdo;
        }

        return self::$connection;
    }

    private static function migrate(PDO $pdo): void
    {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            )'
        );

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS tasks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                completed  INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE
            )'
        );

        // Bases de datos creadas con la versión anterior: añadir user_id
        $columns = array_column($pdo->query('PRAGMA table_info(tasks)')->fetchAll(), 'name');
        if (!in_array('user_id', $columns, true)) {
            $pdo->exec('ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
        }

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)');
    }
}