import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/db/queries';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embeddings } from '@/db/schema';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
  const paragraphs = input.split('\n\n'); // Split input into paragraphs based on double line breaks
  const chunks: string[] = [];

  let currentChunk = '';
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= 5000) {
      currentChunk += paragraph + '\n\n'; // Add paragraph to current chunk
    } else {
      chunks.push(currentChunk.trim()); // Add current chunk to chunks array
      currentChunk = paragraph + '\n\n'; // Start a new chunk with the current paragraph
    }
  }

  chunks.push(currentChunk.trim()); // Add the last chunk to chunks array

  return chunks;
};


export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  console.log(embeddings);
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  console.log('Finding relevant content for:', userQuery);
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
