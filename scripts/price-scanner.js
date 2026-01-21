import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

// #region agent log
fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:9',message:'Loading .env file',data:{envPath,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

const dotenvResult = dotenv.config({ path: envPath });

// #region agent log
fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:14',message:'dotenv.config result',data:{error:dotenvResult.error?.message,parsed:!!dotenvResult.parsed,hasApiKey:!!process.env.KASSALAPP_API_KEY,hasMongoUri:!!process.env.MONGO_URI},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

const apiKey = process.env.KASSALAPP_API_KEY;
const mongoUri = process.env.MONGO_URI;

// #region agent log
fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:20',message:'Environment variables after load',data:{hasApiKey:!!apiKey,apiKeyLength:apiKey?.length,hasMongoUri:!!mongoUri,mongoUriLength:mongoUri?.length,mongoUriPrefix:mongoUri?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

let cachedDb = null;


if(apiKey === undefined){
  console.error('KASSALAPP_API_KEY is missing');
  process.exit(1);

}

if(mongoUri === undefined){
  console.error('MONGO_URI is missing');
  process.exit(1);
}

// Fetch list of all ingredients from MongoDB
const fetchListOfIngredientsFromMongoDB = async () => {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    cachedDb = client.db("hello-freiche-prod").collection("ingredients");
    // Sort by _id descending to get newest ingredients first (MongoDB ObjectIds contain timestamp)
    const listOfAllIngredients = await cachedDb.find().sort({ _id: -1 }).toArray();
    return listOfAllIngredients;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Upsert ingredient in MongoDB with with price info from Kassal.app
const refreshIngredientPriceData = async (ingredient) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:34',message:'refreshIngredientPriceData entry',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,hasData:!!ingredient.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const client = new MongoClient(mongoUri);

  try {

    let noDiff = false;
    await client.connect();
    cachedDb = client.db("hello-freiche-prod").collection("ingredients");

    console.info(`Fetching price info from Kassal.app: ${ingredient.name} ${ingredient.ean}...`)
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:45',message:'Before API call',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const priceInfo = await getProductBy(ingredient.ean);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:48',message:'After API call',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,priceInfoKeys:Object.keys(priceInfo||{}),hasPriceInfo:!!priceInfo,priceInfoType:typeof priceInfo,isError:!!(priceInfo&&priceInfo.error),hasProducts:!!(priceInfo&&priceInfo.products)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // CRITICAL: Validate priceInfo before updating - never overwrite with empty/null/error data
    const isValidPriceInfo = priceInfo && 
                             !priceInfo.error && 
                             typeof priceInfo === 'object' &&
                             (priceInfo.products || Object.keys(priceInfo).length > 0);
    
    if (!isValidPriceInfo) {
      console.warn(`No valid price info for ${ingredient.name} ${ingredient.ean}. Skipping update to preserve existing data.`, {
        hasPriceInfo: !!priceInfo,
        hasError: !!(priceInfo && priceInfo.error),
        isEmpty: priceInfo && Object.keys(priceInfo).length === 0
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:54',message:'Invalid priceInfo - skipping update',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,hasExistingData:!!ingredient.data,priceInfoError:priceInfo?.error,isValidPriceInfo:false,priceInfoType:typeof priceInfo,priceInfoKeys:Object.keys(priceInfo||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return { skipped: true, reason: 'invalid_price_info' };
    }

    // If there is no price info diff, we skip the update and flag it as no diff
    const existingDataStr = JSON.stringify(ingredient.data || {});
    const newDataStr = JSON.stringify(priceInfo || {});
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:62',message:'Comparing data',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,existingDataStr,newDataStr,dataMatches:existingDataStr===newDataStr},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (existingDataStr === newDataStr) {
      console.info(`No price info diff for ${ingredient.name} ${ingredient.ean}. Skipping upsert...`);
      noDiff = true;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:68',message:'NoDiff detected - should skip',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,noDiff},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return { skipped: true };
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:75',message:'Before MongoDB update',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,updateQuery:{ean:ingredient.ean},willUpdateData:true,willPreserveName:true,willPreserveEAN:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Upsert with proper field preservation:
    // - $set: Always update data field (only if valid, which we've already checked)
    // - $setOnInsert: Only set name/ean when INSERTING new document (not when updating existing)
    // This ensures we NEVER overwrite existing name/ean values
    const updateDoc = { 
      $set: { 
        data: priceInfo  // Only update data field with validated priceInfo
      }
    };
    
    // Use $setOnInsert to only set name/ean when creating NEW documents
    // This prevents overwriting existing name/ean values during updates
    if (ingredient.name && ingredient.ean) {
      updateDoc.$setOnInsert = { 
        name: ingredient.name,
        ean: ingredient.ean 
      };
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:125',message:'MongoDB upsert operation',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,updateDoc,willSetData:true,willSetOnInsert:!!updateDoc.$setOnInsert},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const result = await cachedDb.updateOne(
      { ean: ingredient.ean },
      updateDoc,
      { upsert: true }
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:70',message:'After MongoDB update',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,matchedCount:result.matchedCount,modifiedCount:result.modifiedCount,upsertedCount:result.upsertedCount,upsertedId:result.upsertedId?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:75',message:'Error in refreshIngredientPriceData',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    console.error('Error connecting to MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Fetch product by EAN from Kassal.app
const getProductBy = async (ean) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:66',message:'getProductBy entry',data:{ean,hasApiKey:!!apiKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  try {
    const response = await fetch(`https://kassal.app/api/v1/products/ean/${ean}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:74',message:'API response received',data:{ean,status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:78',message:'API error response',data:{ean,status:response.status,statusText:response.statusText,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Return error object instead of throwing - let caller decide what to do
      return { error: `API error: ${response.status} ${response.statusText}`, status: response.status };
    }
    
    const data = await response.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:87',message:'API data parsed',data:{ean,hasData:!!data,dataKeys:Object.keys(data||{}),dataType:typeof data,isError:!!data.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    return data;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:83',message:'Error in getProductBy',data:{ean,errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    throw error;
  }
}


const InitScan = async () => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:77',message:'InitScan entry',data:{hasMongoUri:!!mongoUri,hasApiKey:!!apiKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  const ingredients = await fetchListOfIngredientsFromMongoDB();
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:81',message:'Ingredients fetched from DB (newest first)',data:{ingredientCount:ingredients.length,firstFewIngredients:ingredients.slice(0,3).map(i=>({name:i.name,ean:i.ean,id:i._id?.toString()})),lastFewIngredients:ingredients.slice(-3).map(i=>({name:i.name,ean:i.ean,id:i._id?.toString()}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  console.info('Initiate Hallofresh.no ingredient price scanner -', new Date());
  console.table(ingredients, ['name', 'ean', 'data']);

  // Wait for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // For each ingredient fetch data from Kassal.app
  // Count the number of ingredients that have been updated
  let scannedIngredients = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const ingredient of ingredients) {
    try {
      const result = await refreshIngredientPriceData(ingredient);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:97',message:'Ingredient processed',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,resultSkipped:result.skipped,matchedCount:result.matchedCount,modifiedCount:result.modifiedCount,upsertedCount:result.upsertedCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (result.skipped) {
        skippedCount++;
      } else if (result.upsertedCount > 0) {
        insertedCount++;
      } else if (result.modifiedCount > 0) {
        updatedCount++;
      }
      
      scannedIngredients++;
    } catch (error) {
      errorCount++;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:110',message:'Ingredient processing error',data:{ingredientName:ingredient.name,ingredientEAN:ingredient.ean,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      console.error(`Error processing ${ingredient.name}:`, error.message);
    }
 
   // Let's be nice, and wait 5 seconds between each scan to avoid rate limits 💕
   await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/47a86bc0-08c8-4328-b056-3ca645b831c0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'price-scanner.js:119',message:'InitScan summary',data:{scannedIngredients,insertedCount,updatedCount,skippedCount,errorCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  console.info(`Successfully scanned ${scannedIngredients} ingredients 👍`, new Date());
  console.info(`Inserted: ${insertedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

  // exit
  process.exit(0);
}

await InitScan();
