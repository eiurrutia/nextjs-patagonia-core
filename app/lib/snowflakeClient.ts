import snowflake from 'snowflake-sdk';
import { unstable_noStore as noStore } from 'next/cache';

// Snowflake connection pool configuration
const poolConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USERNAME || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
  application: 'NEXTJS_PATAGONIA_CORE',
};

const poolOptions = {
  max: 10,
  min: 0,
};

// Create Snowflake pool connections
const connectionPool = snowflake.createPool(poolConfig, poolOptions);

// Generic function to execute a query
export async function executeQuery<T>(sqlText: string, binds: any[]): Promise<T[]> {
  try {
    return await new Promise<T[]>((resolve, reject) => {
      noStore();
      connectionPool.use(async (clientConnection) => {
        try {
          // Set timezone to Santiago
          await new Promise<void>((resolve, reject) => {
            clientConnection.execute({
              sqlText: "ALTER SESSION SET TIMEZONE = 'America/Santiago'",
              complete: (err) => {
                if (err) {
                  console.error('Error al establecer la zona horaria de la sesión:', err);
                  reject(err);
                } else {
                  resolve();
                }
              },
            });
          });

          // Execute main statement
          const statement = clientConnection.execute({
            sqlText,
            binds,
          });

          const rows: T[] = [];
          const stream = statement.streamRows();

          stream.on('data', (row) => {
            rows.push(row);
          });

          stream.on('end', () => {
            resolve(rows);
          });

          stream.on('error', (error) => {
            const errWithCode = error as { message: string; code?: string };
            console.error('Streaming error:', errWithCode);
            if (errWithCode.message.includes('terminated connection') || errWithCode.code === '407002') {
              console.warn('Connection terminated, retrying query...');
              reject(new Error('Terminated connection, retrying...'));
            } else {
              reject(new Error('Failed to stream data from Snowflake.'));
            }
          });
        } catch (error) {
          console.error('Database Error:', error);
          reject(new Error('Failed to execute query.'));
        }
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes('terminated connection') || error.message.includes('407002'))) {
      console.warn('Connection terminated. Reconnecting...');
      return executeQuery(sqlText, binds); // Reintentar la operación
    } else {
      console.error('Connection Error:', error);
      throw new Error('Failed to execute query.');
    }
  }
}

export default connectionPool;
