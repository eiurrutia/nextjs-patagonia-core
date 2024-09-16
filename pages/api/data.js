// pages/api/data.js
// import snowflake from 'snowflake-sdk';
// import { readFileSync } from 'fs';
// import path from 'path';

// export default function handler(req, res) {
//   snowflake.configure({ logLevel: 'DEBUG' });
//   console.log('VARSSS')
//   console.log(process.env.SNOWFLAKE_ACCOUNT)
  

//   var connection = snowflake.createConnection({
//     account: process.env.SNOWFLAKE_ACCOUNT,
//     username: process.env.SNOWFLAKE_USERNAME,
//     password: process.env.SNOWFLAKE_PASSWORD,
//     application: 'NEXTJS_PATAGONIA_CORE'
//   });


//   connection.connect((err, conn) => {
//     console.log('## Intentará conectar!!');
//     console.log(connection);
//     if (err) {
//       console.error('Unable to connect: ', err);
//       return res.status(500).json({ error: 'No se pudo conectar a Snowflake.', details: err });
//     } else {
//       console.log('Conexión exitosa!')
//     }
    
//     // Una vez conectado, ejecuta tu consulta
//     conn.execute({
//       sqlText: 'SELECT COUNT(*) FROM PATAGONIA.CORE_TEST.SHOPIFY_CUSTOMERS',
//       complete: (err, stmt, rows) => {
//         if (err) {
//           console.error('Error al ejecutar consulta en Snowflake:', err);
//           return res.status(500).json({ error: 'Error al ejecutar consulta en Snowflake.' });
//         } else {
//           console.log('Resultados:', rows);
//           return res.status(200).json(rows);
//         }
//       },
//     });
//   });
// }



import connectionPool from '@/app/lib/snowflakeClient'

export default function handler(req, res) {
  connectionPool.use(async (clientConnection) =>
  {
      const statement = await clientConnection.execute({
          sqlText: 'SELECT COUNT(*) FROM PATAGONIA.CORE_TEST.SHOPIFY_CUSTOMERS;',
          complete: function (err, stmt, rows)
          {
              var stream = stmt.streamRows();
              stream.on('data', function (row)
              {
                  console.log(row);
              });
              stream.on('end', function (row)
              {
                  console.log('All rows consumed');
              });
          }
      });
  });
}
