import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSupabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';

neonConfig.webSocketConstructor = ws;

export type DatabaseConfig = {
  type: 'replit' | 'supabase';
  replitUrl?: string;
};

export function getDatabaseConfig(): DatabaseConfig {
  // 環境変数からDB_TYPEを取得
  const dbType = process.env.DB_TYPE?.toLowerCase() || 'replit';
  console.log('データベースタイプを設定:', dbType);
  
  console.log('Using database type:', dbType);
  
  if (dbType === 'replit') {
    const replitUrl = process.env.REPLIT_DATABASE_URL;
    if (!replitUrl) {
      console.warn('REPLIT_DATABASE_URL is not set, using default local database URL');
      return {
        type: 'replit',
        replitUrl: 'postgres://postgres:postgres@localhost:5432/habit'
      };
    }
    return {
      type: 'replit',
      replitUrl
    };
  } else if (dbType === 'supabase') {
    return {
      type: 'supabase'
    };
  }
  
  throw new Error('Invalid database type');
}

export function createDatabaseConnection() {
  const config = getDatabaseConfig();
  console.log('Database type:', config.type);

  if (config.type === 'supabase') {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('⚠️ DATABASE_URLが設定されていません。');
      return null;
    }

    console.log('🔌 データベースに接続します...');
    const sql = postgres(connectionString);
    const db = drizzleSupabase(sql, { schema });

    return {
      client: sql,
      db
    };
  } else if (config.type === 'replit') {
    const replitDbUrl = process.env.REPLIT_DATABASE_URL;
    if (!replitDbUrl) {
      console.warn('⚠️ ReplitデータベースURLが設定されていません。');
      console.warn('REPLIT_DATABASE_URL環境変数を設定してください。');
      return null;
    }

    console.log('🔌 Replitデータベースに接続します...');
    const pool = new Pool({ connectionString: replitDbUrl });
    const db = drizzle(pool, { schema });

    return {
      db
    };
  }

  console.warn('⚠️ 不明なデータベースタイプ:', config.type);
  return null;
}