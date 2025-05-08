import { createDatabaseConnection } from './config';

export const { client, db } = createDatabaseConnection();