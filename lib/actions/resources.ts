'use server';

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '@/db/schema';
import { db } from '@/db/queries';
import { generateEmbeddings } from '../ai/embedding';
import { embeddings as embeddingsTable } from '@/db/schema';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content, name } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content, name })
      .returning();

    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map(embedding => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );

    console.log('Resource created:', resource);
    return resource;
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};
