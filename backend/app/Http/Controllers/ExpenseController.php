<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ExpenseController extends Controller
{
    /**
     * Display the authenticated user's expenses, newest first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $expenses = Expense::query()
            ->where('user_id', $request->user()->getKey())
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    /**
     * Store a newly created expense.
     */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = $request->user()->expenses()->create($request->validated());

        return ExpenseResource::make($expense)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
