import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint para disparar DAGs en Airflow
 * 
 * Este endpoint recibe un dagId, dagRunId y parámetros de configuración opcionales
 * y los envía al servidor de Airflow para programar la ejecución del DAG.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { dagId, dagRunId, conf } = req.body;

    if (!dagId) {
      return res.status(400).json({ error: 'Se requiere el ID del DAG' });
    }

    // Crear un ID de ejecución único si no se proporciona uno
    const uniqueDagRunId = dagRunId || `manual_run_${new Date().getTime()}`;

    // Definir las credenciales y URL base de Airflow
    // Estas configuraciones podrían venir de variables de entorno
    // Para Docker, usar el nombre del host donde corre Airflow o la IP de la máquina host
    // 'host.docker.internal' funciona en Docker para Mac/Windows para acceder al host
    const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://host.docker.internal:8000';
    // Alternativas: 
    // - 'http://airflow-webserver:8000' (si airflow-webserver es el nombre del servicio)
    // - 'http://172.17.0.1:8000' (asumiendo que la IP de tu host Docker es 172.17.0.1)
    const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'airflow';
    const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'airflow';

    // Preparar la autorización básica
    const authHeader = 'Basic ' + Buffer.from(`${AIRFLOW_USERNAME}:${AIRFLOW_PASSWORD}`).toString('base64');
    
    // Realizar la petición a la API de Airflow
    const airflowResponse = await fetch(`${AIRFLOW_BASE_URL}/api/v1/dags/${dagId}/dagRuns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        dag_run_id: uniqueDagRunId,
        conf: conf || {}
      })
    });

    if (!airflowResponse.ok) {
      const errorData = await airflowResponse.json();
      console.error('Error en respuesta de Airflow:', errorData);
      return res.status(airflowResponse.status).json({
        error: 'Error al programar el DAG en Airflow',
        details: errorData
      });
    }

    const responseData = await airflowResponse.json();
    
    // Guardar un registro de la ejecución del DAG si es necesario
    // Aquí podríamos insertar en una tabla de seguimiento

    return res.status(200).json({
      success: true,
      message: `DAG ${dagId} programado exitosamente`,
      dagRunId: uniqueDagRunId,
      airflowResponse: responseData
    });

  } catch (error) {
    console.error('Error al disparar DAG en Airflow:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
