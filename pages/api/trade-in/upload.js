// 'use server';
// import path from 'path';
// import formidable from 'formidable';
// import fs from 'fs';

// process.env.TRANSFORMERS_OFFLINE = '1';
// process.env.HUGGINGFACE_HUB_CACHE = '/app/public/models';

// let CLIPProcessor, CLIPModel;

// if (typeof window === 'undefined') {
//   CLIPProcessor = require('@huggingface/transformers').CLIPProcessor;
//   CLIPModel = require('@huggingface/transformers').CLIPModel;
// }

// // import { CLIPProcessor, CLIPModel } from 'transformers';
// import sharp from 'sharp'; // optional for image resizing
// import { executeQuery } from '@/app/lib/snowflakeClient';

// export const config = {
//   api: {
//     bodyParser: false, // Important for file uploads
//   },
// };

// const getSimilarImages = async (embedding) => {
//   const query = `
//     SELECT IMAGE_SRC, EMBEDDING
//     FROM SHOPIFY_PRODUCTS_IMAGE_EMBEDDINGS
//   `;
//   console.log('Se treaera las imagenes');
//   const results = await executeQuery(query);
//   console.log('Dato imagenes obtenidas');
  
//   // Aquí puedes calcular la distancia (coseno o euclidiana) entre el embedding cargado y los embeddings en la base de datos.
//   const distances = results.map(row => ({
//     image_src: row.IMAGE_SRC,
//     distance: cosineSimilarity(embedding, row.EMBEDDING),
//   }));

//   // Ordenar por similitud
//   distances.sort((a, b) => a.distance - b.distance);

//   console.log('Similitud lista');
//   return distances.slice(0, 3); // Devuelve las 3 más similares
// };

// const cosineSimilarity = (a, b) => {
//   // Función para calcular la similitud del coseno
//   const dotProduct = a.reduce((acc, val, i) => acc + val * b[i], 0);
//   const normA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
//   const normB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
//   return dotProduct / (normA * normB);
// };

// const handler = async (req, res) => {
//     console.log('EJECUTARA EL HANDLER');
//     const form = formidable();
//     form.parse(req, async (err, fields, files) => {
//     if (err) return res.status(500).json({ error: 'Error processing file' });

//     const file = files.image;
//     const imagePath = file.filepath;

//     // Procesa la imagen usando CLIP
//     console.log('Cargara el modelo');
//     const modelPath = '@/public/models/clip-vit-base-patch32';
//     if (typeof modelPath !== 'string') {
//         console.error('modelPath is not a string:', modelPath);
//         return res.status(500).json({ error: 'Model path is not a valid string' });
//       }
//     const { CLIPModel, CLIPProcessor } = await import('@huggingface/transformers');
//     // const model = await CLIPModel.from_pretrained("/app/public/models/clip-vit-base-patch32");
//     // const processor = await CLIPProcessor.from_pretrained("/app/public/models/clip-vit-base-patch32");
//     console.log('Model path:', modelPath);
//     const model = await CLIPModel.from_pretrained(modelPath);
//     const processor = await CLIPProcessor.from_pretrained(modelPath);

//     const image = await sharp(imagePath).toBuffer();
//     const inputs = processor(images=image, return_tensors="pt");
//     const outputs = model.get_image_features(inputs);
//     const embedding = outputs[0].detach().numpy();

//     // Obtener las 3 imágenes más similares desde Snowflake
//     const similarImages = await getSimilarImages(embedding);

//     res.status(200).json({ similarImages });
//   });
// };

// export default handler;

import formidable from 'formidable';
import { exec } from 'child_process';
import { executeQuery } from '@/app/lib/snowflakeClient';

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
  // AND (
  //   ITEM_COLOR LIKE '22980-BLYB'
  //   OR ITEM_COLOR LIKE '65572-BLAM'
  // )
  // WHERE ITEM_COLOR = '20385-BSNG'
  consle.log('# Gettings images');
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
