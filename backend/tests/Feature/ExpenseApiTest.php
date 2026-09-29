<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    private const VALID_PAYLOAD = [
        'amount' => 500,
        'category' => 'Food',
        'date' => '2026-09-29',
    ];

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/expenses')->assertUnauthorized();
        $this->postJson('/api/expenses', self::VALID_PAYLOAD)->assertUnauthorized();
    }

    /**
     * Guards the case where a client does not send `Accept: application/json`
     * (curl, a mobile client, a server-to-server call). The auth middleware
     * used to redirect to a non-existent `login` route and return 500.
     */
    public function test_unauthenticated_requests_without_json_accept_header_return_401(): void
    {
        $this->get('/api/expenses')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Unauthenticated.');

        $this->post('/api/expenses', self::VALID_PAYLOAD)->assertStatus(401);
    }

    public function test_login_issues_a_token_for_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'tester@example.com',
            'password' => 'password',
        ]);

        $this->postJson('/api/login', [
            'email' => 'tester@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        User::factory()->create([
            'email' => 'tester@example.com',
            'password' => 'password',
        ]);

        $this->postJson('/api/login', [
            'email' => 'tester@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_it_creates_an_expense(): void
    {
        Sanctum::actingAs($user = User::factory()->create());

        $this->postJson('/api/expenses', self::VALID_PAYLOAD)
            ->assertCreated()
            ->assertJsonPath('data.amount', 500)
            ->assertJsonPath('data.category', 'Food')
            ->assertJsonPath('data.date', '2026-09-29')
            ->assertJsonStructure(['data' => ['id', 'amount', 'category', 'date', 'created_at']]);

        $this->assertDatabaseHas('expenses', [
            'user_id' => $user->getKey(),
            'amount' => 500,
            'category' => 'Food',
        ]);

        $expense = Expense::sole();
        $this->assertSame('2026-09-29', $expense->date->format('Y-m-d'));
    }

    public function test_it_lists_expenses_newest_first(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Expense::factory()->for($user)->create(['date' => '2026-01-01', 'amount' => 100]);
        Expense::factory()->for($user)->create(['date' => '2026-09-29', 'amount' => 500]);

        $this->getJson('/api/expenses')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.date', '2026-09-29')
            ->assertJsonPath('data.1.date', '2026-01-01');
    }

    public function test_it_does_not_leak_other_users_expenses(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Expense::factory()->create(['date' => '2026-09-29', 'amount' => 999]);

        $this->getJson('/api/expenses')->assertOk()->assertJsonCount(0, 'data');
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidPayloads(): array
    {
        return [
            'missing amount' => [['category' => 'Food', 'date' => '2026-09-29'], 'amount'],
            'zero amount' => [['amount' => 0, 'category' => 'Food', 'date' => '2026-09-29'], 'amount'],
            'negative amount' => [['amount' => -50, 'category' => 'Food', 'date' => '2026-09-29'], 'amount'],
            'non-numeric amount' => [['amount' => 'abc', 'category' => 'Food', 'date' => '2026-09-29'], 'amount'],
            'missing category' => [['amount' => 500, 'date' => '2026-09-29'], 'category'],
            'unknown category' => [['amount' => 500, 'category' => 'Gaming', 'date' => '2026-09-29'], 'category'],
            'missing date' => [['amount' => 500, 'category' => 'Food'], 'date'],
            'invalid date' => [['amount' => 500, 'category' => 'Food', 'date' => 'not-a-date'], 'date'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    #[DataProvider('invalidPayloads')]
    public function test_it_rejects_invalid_payloads(array $payload, string $expectedField): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/expenses', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors($expectedField);

        $this->assertDatabaseCount('expenses', 0);
    }
}
