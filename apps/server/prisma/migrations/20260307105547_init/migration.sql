-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nickname" VARCHAR(20) NOT NULL,
    "avatar" VARCHAR(50) NOT NULL DEFAULT 'default_01',
    "phone" VARCHAR(20),
    "coins" BIGINT NOT NULL DEFAULT 10000,
    "total_hands" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_profit" BIGINT NOT NULL DEFAULT 0,
    "best_hand_rank" SMALLINT,
    "max_single_win" BIGINT NOT NULL DEFAULT 0,
    "guest_device_id" VARCHAR(100),
    "wechat_openid" VARCHAR(100),
    "apple_sub" VARCHAR(100),
    "last_daily_bonus" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hand_histories" (
    "id" UUID NOT NULL,
    "room_code" VARCHAR(6) NOT NULL,
    "hand_number" INTEGER NOT NULL,
    "player_count" SMALLINT NOT NULL,
    "community_cards" VARCHAR(20),
    "pot_total" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hand_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hand_players" (
    "id" UUID NOT NULL,
    "hand_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seat_index" SMALLINT NOT NULL,
    "hole_cards" VARCHAR(10),
    "final_hand_rank" SMALLINT,
    "chips_change" BIGINT NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hand_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechat_openid_key" ON "users"("wechat_openid");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_sub_key" ON "users"("apple_sub");

-- CreateIndex
CREATE INDEX "hand_histories_created_at_idx" ON "hand_histories"("created_at");

-- CreateIndex
CREATE INDEX "hand_players_user_id_idx" ON "hand_players"("user_id");

-- CreateIndex
CREATE INDEX "hand_players_hand_id_idx" ON "hand_players"("hand_id");

-- AddForeignKey
ALTER TABLE "hand_players" ADD CONSTRAINT "hand_players_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "hand_histories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_players" ADD CONSTRAINT "hand_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
