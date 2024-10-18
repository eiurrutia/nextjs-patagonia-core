import { insertTradeInRecord } from '@/app/lib/trade-in/data';

/**
 * API route handler for creating a new Trade-In record
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract data from the request body
    const {
      firstName,
      lastName,
      rut,
      email,
      phone,
      selectedItemColor,
      address,
      houseDetails,
      client_comment,
    } = req.body;

    // Validate that all required fields are present
    if (
      !firstName ||
      !lastName ||
      !rut ||
      !email ||
      !phone ||
      !selectedItemColor ||
      !address
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Call the function to insert the record into Snowflake
    const result = await insertTradeInRecord({
      firstName,
      lastName,
      rut,
      email,
      phone,
      selectedItemColor,
      address,
      houseDetails,
      client_comment,
    });

    // Respond with success if insertion was successful
    res.status(200).json({ message: 'Trade-In registered successfully', result });
  } catch (error) {
    console.error('Error handling Trade-In submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
