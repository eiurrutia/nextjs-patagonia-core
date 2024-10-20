import formidable from 'formidable';
import { exec } from 'child_process';
import { executeQuery } from '@/app/lib/snowflakeClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false, // Important for file uploads
  },
};

const getSimilarImages = async (embedding) => {
  const query = `
    SELECT *
    FROM PATAGONIA.CORE_TEST.SHOPIFY_PRODUCTS_IMAGE_EMBEDDINGS
    WHERE ITEM_COLOR NOT LIKE 'W%'
    
  `;
  console.log('# Gettings images');
  const results = await executeQuery(query);
  console.log('# Images obtained');
  const distances = results.map(row => {
    const dbEmbedding = row.EMBEDDING;
    const distance = manhattanDistance(embedding, row.EMBEDDING);
    return { item_color: row.ITEM_COLOR, image_src: row.IMAGE_SRC, distance: distance };
  });

  distances.sort((a, b) => b.distance - a.distance);
  console.log('Distancias ordenadas');
  console.log(distances);
  return distances.slice(0, 3);
};

const manhattanDistance = (a, b) => {
  const distance = a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
  return 1 / (1 + distance);
};

const normalizeEmbedding = (embedding) => {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  };

const cosineSimilarity = (a, b) => {
  const normalizedA = normalizeEmbedding(a);
  const normalizedB = normalizeEmbedding(b);

  const dotProduct = normalizedA.reduce((sum, val, i) => sum + val * normalizedB[i], 0);
  return dotProduct;
};

const handler = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  const form = formidable();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error processing file' });
    }
    const file = files.image;
    const imagePath = files.image[0].filepath;

    // Execute the Python script for embedding generation
    exec(`python3 ./scripts/generate_embedding.py ${imagePath}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: 'Error processing image' });
      }

      const embedding = JSON.parse(stdout);

      // Query Snowflake and calculate similarity
      const similarImages = await getSimilarImages(embedding[0]);
      res.status(200).json({ similarImages });
    });
  });
};

export default handler;
