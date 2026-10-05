<?php
declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\TaskController;
use App\Core\Http;
use App\Core\Session;

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $file = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

$path   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// --- Estáticos y SPA ---
if (!str_starts_with($path, '/api/')) {
    $static = __DIR__ . $path;
    if ($path !== '/' && is_file($static)) {
        return false;
    }
    readfile(__DIR__ . '/index.html');
    return;
}

// --- API ---
try {
    Session::start();

    // 1) Rutas de tareas: requieren sesión
    if (str_starts_with($path, '/api/tasks') && Session::userId() === null) {
        Http::json(['error' => 'No autenticado.'], 401);
        return;
    }

    // 2) CSRF en peticiones que modifican datos (login/registro aún no tienen token)
    $csrfExempt = ['/api/auth/login', '/api/auth/register'];
    if (!in_array($method, ['GET', 'HEAD'], true) && !in_array($path, $csrfExempt, true)) {
        if (!Session::validCsrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
            Http::json(['error' => 'Token CSRF inválido.'], 403);
            return;
        }
    }

    $auth  = new AuthController();
    $tasks = new TaskController();

    if ($path === '/api/auth/me' && $method === 'GET') {
        $auth->me();
    } elseif ($path === '/api/auth/login' && $method === 'POST') {
        $auth->login();
    } elseif ($path === '/api/auth/register' && $method === 'POST') {
        $auth->register();
    } elseif ($path === '/api/auth/logout' && $method === 'POST') {
        $auth->logout();
    } elseif ($path === '/api/tasks') {
        match ($method) {
            'GET'   => $tasks->index(),
            'POST'  => $tasks->store(),
            default => Http::json(['error' => 'Método no permitido.'], 405),
        };
    } elseif (preg_match('#^/api/tasks/(\d+)/toggle$#', $path, $m) && in_array($method, ['PATCH', 'PUT'], true)) {
        $tasks->toggle((int) $m[1]);
    } elseif (preg_match('#^/api/tasks/(\d+)$#', $path, $m) && $method === 'DELETE') {
        $tasks->destroy((int) $m[1]);
    } else {
        Http::json(['error' => 'Ruta no encontrada.'], 404);
    }
} catch (\Throwable $e) {
    error_log($e->getMessage());
    Http::json(['error' => 'Error interno del servidor.'], 500);
}