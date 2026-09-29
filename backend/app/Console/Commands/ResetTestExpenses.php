<?php

namespace App\Console\Commands;

use App\Models\Expense;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:reset-test-expenses')]
#[Description('Delete every expense row so end-to-end tests start from a known state')]
class ResetTestExpenses extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $deleted = Expense::query()->delete();

        $this->info("Deleted {$deleted} expense(s).");

        return self::SUCCESS;
    }
}
