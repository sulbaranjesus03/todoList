<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Http;
use App\Core\Session;
use App\Models\User;

final class AuthController
{
    public function __construct(private User $users = new User())
    {
    }

    /** POST /api/auth/register */
    public function register(): void
    {
        $b        = Http::body();
        $name     = trim((string) ($b['name'] ?? ''));
        $email    = strtolower(trim((string) ($b['email'] ?? '')));
        $password = (string) ($b['password'] ?? '');

        if (mb_strlen($name) < 2 || mb_strlen($name) > 50) {
            Http::json(['error' => 'El nombre debe tener entre 2 y 50 caracteres.'], 400);
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
            Http::json(['error' => 'El correo electrónico no es válido.'], 400);
            return;
        }
        if (strlen($password) < 8 || strlen($password) > 72) { // 72 = límite de bcrypt
            Http::json(['error' => 'La contraseña debe tener entre 8 y 72 caracteres.'], 400);
            return;
        }

        try {
            $user = $this->users->create($name, $email, $password);
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') { // UNIQUE violada
                Http::json(['error' => 'Ya existe una cuenta con ese correo.'], 409);
                return;
            }
            throw $e;
        }

        Session::login($user['id']);
        Http::json(['data' => $user, 'csrf' => Session::csrf()], 201);
    }

    /** POST /api/auth/login */
    public function login(): void
    {
        $b        = Http::body();
        $email    = strtolower(trim((string) ($b['email'] ?? '')));
        $password = (string) ($b['password'] ?? '');

        $user = $email !== '' ? $this->users->findByEmail($email) : null;

        if ($user === null) {
            password_hash($password, PASSWORD_DEFAULT); // iguala tiempos de respuesta
        }

        // Mensaje genérico: no revela si el correo existe
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            Http::json(['error' => 'Correo o contraseña incorrectos.'], 401);
            return;
        }

        Session::login((int) $user['id']);
        Http::json([
            'data' => ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email']],
            'csrf' => Session::csrf(),
        ]);
    }

    /** POST /api/auth/logout */
    public function logout(): void
    {
        Session::logout();
        Http::json(['message' => 'Sesión cerrada.']);
    }

    /** GET /api/auth/me → 200 con data=null si no hay sesión (evita errores en consola) */
    public function me(): void
    {
        $id   = Session::userId();
        $user = $id ? $this->users->findById($id) : null;

        Http::json(['data' => $user, 'csrf' => Session::csrf()]);
    }
}