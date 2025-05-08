-- サンプルデータのシード（開発環境用）

-- サンプルユーザー
-- 注意: 本番環境では平文パスワードは絶対に使用しないでください
-- 実際のパスワードは認証システムでハッシュ化する必要があります
-- このSQLはデモ/開発目的のみに使用してください
INSERT INTO users (username, password, nickname, goal_field) 
VALUES 
    ('demo@example.com', 'hashedpassword.salt', 'デモユーザー', 'language'),
    ('test@example.com', 'hashedpassword.salt', 'テストユーザー', 'programming')
ON CONFLICT (username) DO NOTHING;

-- サンプル習慣
INSERT INTO habits (user_id, name, description, goal_value, goal_unit, category)
VALUES 
    ((SELECT id FROM users WHERE username = 'demo@example.com'), '英語学習', '毎日30分の英語学習', 30, '分', 'language'),
    ((SELECT id FROM users WHERE username = 'demo@example.com'), '単語記憶', '新しい英単語を10個覚える', 10, '個', 'language'),
    ((SELECT id FROM users WHERE username = 'test@example.com'), 'コーディング練習', 'コーディング問題を解く', 3, '問', 'programming')
ON CONFLICT DO NOTHING;

-- 注意: 実際の習慣記録と連続記録のデータは省略
-- 必要に応じて追加してください