import { createDatabaseConnection } from './config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

// データベース接続を試みる
let connection = createDatabaseConnection();

// 接続に失敗した場合は、DATABASE_URLを使用してデフォルトの接続を作成する
if (!connection) {
  console.log('データベース接続の初期化に失敗しました。DATABASE_URLを使用して再試行します...');
  try {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      console.log('DATABASE_URLを使用してデータベースに接続します...');
      
      // REPLIT_DATABASE_URLを設定して、後続の処理でも使用できるようにする
      process.env.REPLIT_DATABASE_URL = connectionString;
      
      const pool = new Pool({ connectionString });
      const drizzleDb = drizzle(pool, { schema });
      connection = {
        db: drizzleDb
      };
      console.log('データベース接続が成功しました！');
    } else {
      console.error('DATABASE_URLが設定されていません。データベース接続は機能しません。');
    }
  } catch (error) {
    console.error('バックアップ接続中にエラーが発生しました:', error);
  }
}

// エクスポート
export const client = connection?.client || null;
export const db = connection?.db;

// dbが存在するか確認
if (!db) {
  console.error('警告: データベース接続が確立されていません。アプリケーションは正常に動作しません。');
}