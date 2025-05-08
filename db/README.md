# データベース設定と管理

このディレクトリには、データベースの初期化とテスト用のSQL関連ファイルが含まれています。

## ファイル一覧

- `init.sql` - データベーステーブルの初期化用SQLスクリプト
- `seed.sql` - 開発/テスト用のサンプルデータ投入スクリプト
- `db_info.sql` - データベース情報の表示用SQLスクリプト

## 使用方法

### テーブル初期化

以下のコマンドを実行してデータベーススキーマを作成します：

```bash
# 環境変数DATABASE_URLが正しく設定されていることを確認
psql $DATABASE_URL -f db/init.sql
```

### サンプルデータの投入 (開発環境のみ)

開発環境でのテスト用にサンプルデータを投入する場合：

```bash
psql $DATABASE_URL -f db/seed.sql
```

### データベース情報の表示

現在のデータベース構造を確認するには：

```bash
psql $DATABASE_URL -f db/db_info.sql
```

## データベース接続情報

アプリケーションは以下の環境変数を使用してデータベースに接続します：

- `DATABASE_URL` - PostgreSQL接続文字列
- `PGHOST` - PostgreSQLホスト
- `PGPORT` - PostgreSQLポート
- `PGUSER` - PostgreSQLユーザー名
- `PGPASSWORD` - PostgreSQLパスワード
- `PGDATABASE` - PostgreSQLデータベース名

## 注意事項

- 本番環境では `seed.sql` を実行しないでください
- テーブル構造を変更する場合は、`init.sql` を更新した上で、適切なマイグレーションを計画してください
- パスワードなどの機密情報は常にハッシュ化してデータベースに保存してください