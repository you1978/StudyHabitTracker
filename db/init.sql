-- データベース初期化SQL

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT,
    goal_field TEXT
);

-- 習慣テーブル
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    goal_value INTEGER,
    goal_unit TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 習慣記録テーブル
CREATE TABLE IF NOT EXISTS habit_records (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TIMESTAMP NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

-- 連続記録テーブル
CREATE TABLE IF NOT EXISTS streaks (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date TIMESTAMP
);

-- セッション管理テーブル（connect-pg-simple用）
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL PRIMARY KEY,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 外部キー制約
ALTER TABLE habits 
    ADD CONSTRAINT fk_habits_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE habit_records
    ADD CONSTRAINT fk_habit_records_habit
    FOREIGN KEY (habit_id)
    REFERENCES habits(id)
    ON DELETE CASCADE;

ALTER TABLE habit_records
    ADD CONSTRAINT fk_habit_records_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE streaks
    ADD CONSTRAINT fk_streaks_habit
    FOREIGN KEY (habit_id)
    REFERENCES habits(id)
    ON DELETE CASCADE;

ALTER TABLE streaks
    ADD CONSTRAINT fk_streaks_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;