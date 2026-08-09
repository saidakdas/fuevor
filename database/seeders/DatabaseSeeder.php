<?php

namespace Database\Seeders;

use App\Models\Goal;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\User;
use App\Services\ProgressService;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Fuevor Demo',
            'email' => 'demo@fuevor.test',
        ]);

        $goal = Goal::factory()->for($user)->create([
            'title' => 'İlk ürün sürümünü yayınla',
            'motivation' => 'Fikrimi gerçek kullanıcılarla buluşturmak istiyorum.',
            'reward' => 'Çalışan, ölçülebilir ve geliştirilebilir bir ürün.',
        ]);

        collect(['Temeli kur', 'İlk kullanıcıya ulaş', 'Geri bildirimleri uygula'])->each(function ($title, $index) use ($goal) {
            $milestone = Milestone::factory()->for($goal)->create(['title' => $title, 'position' => $index + 1]);
            Task::factory(3)->for($milestone)->sequence(
                fn ($sequence) => ['position' => $sequence->index + 1, 'is_completed' => $index === 0]
            )->create();
            app(ProgressService::class)->recalculateForMilestone($milestone);
        });
    }
}
