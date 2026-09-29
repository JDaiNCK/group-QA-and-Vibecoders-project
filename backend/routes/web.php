<?php

use Illuminate\Support\Facades\Route;

// The interface is a separate Vue SPA served by Vite (see frontend/), so this
// side is API-only. Point browsers at the right place rather than rendering a
// Blade page, which would drag in a second Vite/Tailwind build for nothing.
Route::get('/', function () {
    return response()->json([
        'service' => 'Personal Expense Tracker API',
        'api' => url('/api'),
        'frontend' => 'http://127.0.0.1:5173',
    ]);
});
