#!/usr/bin/env node

/**
 * This script lists all recipes in the database and generates a wine pairing for each recipe.
 * 
 * 
 * This script will:
 * 1. List all recipes in the database
 * 2. Generate a wine pairing for each recipe using Gemini (Requires a Google API key)
 * 3. Save the wine pairing to the database
 * 
 * The script will prompt the user for each recipe to generate a wine pairing.
 * The user can choose to save the wine pairing to the database or not.
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import readline from 'readline';

dotenv.config();

const uri = process.env.MONGO_URI;
const geminiKey = process.env.GEMINI_API_KEY;

if (!uri) {
  console.error('MONGO_URI environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

if (!geminiKey) {
  console.error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

const DB_NAME = 'hello-freiche-prod';
const COLLECTION_NAME = 'recipes';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

const SYSTEM_INSTRUCTION = `You are a sommelier for a Norwegian food app. For the given recipe, suggest a wine pairing.

You MUST respond with ONLY valid JSON in this exact shape (no markdown, no code block):
{
  "winePairing": {
    "category": "red or white",
    "variety": "exact name of the grape variety, e.g. Sauvignon Blanc, Riesling, Barbera",
    "description": "1-2 setninger på norsk om hvorfor denne vintypen / druen passer til retten"
  }
}

Rules:
- category MUST be exactly either "red" or "white".
- variety MUST be the name of an actual drue/vingruppe (for eksempel fra Vinmonopolet sin liste over druer), written as an internasjonalt navn (f.eks. Sauvignon Blanc, Riesling, Pinot Noir).
- description MUST be non-empty and written in natural Norwegian, and explain kort hvorfor denne vintypen passer godt til retten.`;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function formatIngredients(recipe) {
  const ingredients = recipe.recipeIngredients || [];
  if (ingredients.length === 0) return '(ingen ingredienser)';
  return ingredients
    .map((ing) => `${ing.name}${ing.amount != null ? ` ${ing.amount} ${ing.measurement || ''}` : ''}`.trim())
    .join(', ');
}

async function generateWinePairing(recipe) {
  const title = recipe.title || 'Oppskrift';
  const ingredientsText = formatIngredients(recipe);
  const steps = recipe.steps || [];
  const instructionsText = steps.length ? steps.join('\n') : '(ingen fremgangsmåte)';

  const userContent = `Tittel: ${title}\n\nIngredienser:\n${ingredientsText}\n\nFremgangsmåte:\n${instructionsText}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Handle different response shapes (e.g. blocked, no candidates, or different part structure)
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    console.error('Gemini response (no candidate):', JSON.stringify(data, null, 2));
    throw new Error('No candidate in Gemini response. Check safety or quota.');
  }

  const part = candidate.content?.parts?.[0];
  let rawText = part?.text;
  if (rawText == null && part?.inlineData?.data) {
    rawText = Buffer.from(part.inlineData.data, 'base64').toString('utf-8');
  }
  if (rawText == null || rawText === '') {
    console.error('Gemini response (empty part):', JSON.stringify(data, null, 2));
    throw new Error('Empty text in Gemini response.');
  }

  // Strip markdown code fences if present
  let jsonStr = rawText.trim();
  const codeBlockMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  const parsed = JSON.parse(jsonStr);

  // Extract wine pairing in the new shape
  const wp = parsed.winePairing ?? parsed.wine_pairing ?? {};
  const category = wp.category ?? '';
  const variety = wp.variety ?? wp.grape ?? '';
  const description = wp.description ?? '';

  const winePairing = { category, variety, description };

  // If still empty, log so we can see what Gemini actually returned
  if (!category && !variety && !description) {
    console.error('Gemini returned empty-looking winePairing. Raw parsed:', JSON.stringify(parsed, null, 2));
  }

  return winePairing;
}

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const cursor = collection.find({
      $or: [{ winePairing: { $exists: false } }, { winePairing: null }],
    });
    const recipes = await cursor.toArray();

    console.log(
      `Found ${recipes.length} recipes without wine pairing in "${DB_NAME}.${COLLECTION_NAME}".\n`
    );

    if (recipes.length === 0) {
      console.log('Nothing to do. Exiting.');
      return;
    }

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const title = recipe.title || '(uten tittel)';

      console.log('\n---');
      console.log(`[${i + 1}/${recipes.length}] ${title}`);
      console.log('Ingredienser:', formatIngredients(recipe));
      console.log('---');

      const answer = await ask('Generate wine pairing for this recipe? (y/n): ');
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Skipped.');
        continue;
      }

      let recipeDone = false;
      while (!recipeDone) {
        try {
          const winePairing = await generateWinePairing(recipe);
          console.log('\n--- Gemini output ---');
          console.log(JSON.stringify(winePairing, null, 2));
          console.log('---\n');

          const saveAnswer = await ask('Save this wine pairing to the recipe? (y/n): ');
          if (saveAnswer === 'y' || saveAnswer === 'yes') {
            await collection.updateOne(
              { _id: recipe._id },
              { $set: { winePairing } }
            );
            console.log('Saved to DB.');
          } else {
            console.log('Skipped saving.');
          }
          recipeDone = true;
        } catch (err) {
          console.error('Failed to generate wine pairing:', err.message);
          const retryRecipe = await ask('Retry this recipe? (y/n): ');
          if (retryRecipe === 'y' || retryRecipe === 'yes') {
            console.log('Retrying...');
          } else {
            const continueNext = await ask('Continue to next recipe? (y/n): ');
            if (continueNext !== 'y' && continueNext !== 'yes') process.exit(1);
            recipeDone = true;
          }
        }
      }
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
