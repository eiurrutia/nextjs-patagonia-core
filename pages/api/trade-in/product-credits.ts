import { NextApiRequest, NextApiResponse } from 'next';
import { getProductCreditsByStyle } from '@/app/lib/trade-in/product-master-actions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { style: styleCode } = req.query;

    console.log('📋 API: Received request for style:', styleCode);

    if (!styleCode || typeof styleCode !== 'string') {
      console.log('❌ API: No style code provided');
      return res.status(400).json({ error: 'Style code is required' });
    }

    console.log('🔍 API: Looking up credits for style:', styleCode);
    const creditData = await getProductCreditsByStyle(styleCode);

    if (!creditData) {
      console.log('❌ API: No credit data found for style:', styleCode);
      return res.status(404).json({ error: 'No credit information found for this style' });
    }

    console.log('✅ API: Found credit data for style:', styleCode, creditData);
    return res.status(200).json({
      success: true,
      data: creditData
    });

  } catch (error) {
    console.error('💥 API Error fetching product credits:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}