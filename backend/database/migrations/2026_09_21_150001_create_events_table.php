<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();
            $table->string('title');
            $table->string('category', 100)->index();
            $table->text('description')->nullable();
            $table->string('location');
            $table->dateTime('event_date')->index();
            $table->unsignedInteger('quota')->default(0);
            $table->text('requirements')->nullable();
            $table->enum('status', ['draft', 'open', 'ongoing', 'completed', 'cancelled'])
                ->default('open')
                ->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};