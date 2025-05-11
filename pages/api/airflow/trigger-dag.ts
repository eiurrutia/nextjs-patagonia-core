import { NextApiRequest, NextApiResponse } from 'next';

  /**
   * Trigger an Airflow DAG
   *
   * @param {NextApiRequest} req - The HTTP request
   * @param {NextApiResponse} res - The HTTP response
   *
   * @returns {Promise<NextApiResponse>>} The HTTP response
   *
   * The request body must contain the following properties:
   * - `dagId`: The ID of the DAG to trigger
   * - `dagRunId`: The ID of the DAG run (optional)
   * - `conf`: An object with additional configurations for the DAG run (optional)
   *
   * If the DAG is successfully triggered, a response with an object containing:
   * - `success`: A boolean indicating if the trigger was successful
   * - `message`: A confirmation message
   * - `dagRunId`: The ID of the DAG run
   * - `airflowResponse`: The response from the Airflow API
   *
   * If an error occurs, a response with an object containing:
   * - `error`: An error message
   * - `details`: An object with additional details about the error
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

    const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://host.docker.internal:8000';
    const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME;
    const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD;

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
