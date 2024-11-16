import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { resources, embeddings } from '../../db/schema';
import { OpenAI } from 'openai';
import { config } from 'dotenv';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import { nanoid, generateId } from 'ai';

// Load environment variables
config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize database connection
const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdf(dataBuffer);
  return pdfData.text;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
  });
  
  return response.data[0].embedding;
}

async function processChunk(text: string, resourceId: string) {
  const embedding = await generateEmbedding(text);
  
  await db.insert(embeddings).values({
    id: generateId(),
    resourceId: resourceId,
    content: text,
    embedding: embedding,
  });
}

async function processPdf(pdfPath: string) {
  try {
    // Extract text from PDF
    const text = await extractTextFromPdf(pdfPath);
    const fileName = pdfPath.split("/").pop() || "unnamed";
    
    // Create resource entry
    const resourceId = nanoid();
    await db.insert(resources).values({
      id: resourceId,
      name: fileName,
      content: text,
    });
    
    // Split text into chunks (adjust chunk size as needed)
    const CHUNK_SIZE = 1000;
    const words = text.split(' ');
    const chunks: string[] = [];
    
    let currentChunk: string[] = [];
    let currentLength = 0;
    
    for (const word of words) {
      if (currentLength + word.length > CHUNK_SIZE) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentLength = word.length;
      } else {
        currentChunk.push(word);
        currentLength += word.length + 1; // +1 for space
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    // Process each chunk
    for (const chunk of chunks) {
      await processChunk(chunk, resourceId);
    }
    
    console.log(`Successfully processed ${fileName}`);
    return { success: true, resourceId };
    
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error };
  } finally {
    await client.end();
  }
}

// CLI usage
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Please provide a PDF path");
  process.exit(1);
}

processPdf(pdfPath)
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
