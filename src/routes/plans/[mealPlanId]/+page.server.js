
import { mealplans } from "$db/mealplans";
import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";

export const load = async function ({ params }) {
  try {
    const db = await getDatabase();

    // Do database stuff
    const URLparameters = params.mealPlanId
    let mealPlanData = await db.collection('mealplans').findOne({ "name": URLparameters });
    if (mealPlanData === null) {
      let mealPlanData = await db.collection('mealplans').findOne({ "mealPlanId": URLparameters });
    }



    const allMealPlansData = await db.collection('mealplans').find({}, { projection: { mealPlanId: 1, name: 1 } }).toArray()

    // Find the index of the current mealplan in the Array of all meal plans.
    const currentIndex = allMealPlansData.findIndex(el => el.mealPlanId === params.mealPlanId)

    // Find the next, and previous mealplan as well for the buttons.
    const nextMealPlanId = allMealPlansData[currentIndex + 1]?.mealPlanId || allMealPlansData[0]?.mealPlanId // (Cycle to first if out of bounds)
    const previousMealPlanId = allMealPlansData[currentIndex - 1]?.mealPlanId || allMealPlansData[allMealPlansData.length - 1]?.mealPlanId // (Cycle to last if out of bounds)

    return {
      mealPlan: serializeNonPOJOs(mealPlanData),
      nextMealPlanId: nextMealPlanId,
      previousMealPlanId: previousMealPlanId,
    }

    // Perform queries, updates, etc.
  } catch (error) {
    console.error('Error accessing the database:', error);
  }
}
