<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, ReportService $reports): Response
    {
        return Inertia::render('Dashboard', [
            'data' => $reports->dashboard($request->user()),
        ]);
    }
}
