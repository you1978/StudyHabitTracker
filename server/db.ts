import { createDatabaseConnection } from './config';

// データベース接続をnullチェック付きで取得
const connection = createDatabaseConnection();
export const client = connection?.client || null;
export const db = connection?.db || null;