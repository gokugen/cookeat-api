import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import { z } from "zod";
import ApiError from '../helpers/api-error';
import { AnonymousUser, Recipe } from '../../schema';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function zodTextFormat<ZodInput extends z.ZodType>(
  zodObject: ZodInput,
  name: string,
  props?: any
): any {
  return {
    type: "json_schema",
    ...props,
    name,
    strict: true,
    schema: z.toJSONSchema(zodObject, { target: "draft-7" }),
  };
}

export async function generateSingleRecipeWithFilters(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      ingredients,
      dishType,
      duration,
      servings,
      cuisineStyle,
      diet,
      calories,
      allowOtherIngredients,
      existingRecipes,
      userId,
      language = 'fr'
    } = req.body;

    if (!ingredients) {
      return next(new ApiError("Ingrédients requis", 400));
    }

    const ChatGPTResponseObject = z.object({
      recipe: z.object({
        title: z.string(),
        // @ts-ignore
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
        cooking_time: z.string(),
        servings: z.number(),
        calories: z.string(),
        lipids: z.string(),
        proteins: z.string(),
        ingredients: z.array(z.object({
          name: z.string(),
          quantity: z.string(),
          icon: z.string(),
          // @ts-ignore
          tags: z.array(z.enum(['Protein', 'Fat', 'Omega-3', 'Carbohydrate', 'Sugar', 'Vitamin', 'Mineral', 'Other'])),
        }))
      }),
    });

    // Instructions selon la langue
    const instructions = language === 'en'
      ?
      `You are an expert chef.
      Generate a single personalized recipe taking into account all preferences.
      Be creative and propose an appetizing recipe that respects the constraints.
      For soup, do not use ready-made broth.
      You can generate all kinds of recipes: tarts, croquettes, quiches, gratins, salads, pizza, toasts, tortillas, stews, omelettes, etc.
      The recipe title should match the recipe and ingredients as much as possible.
      Calories, lipids and proteins must be numbers expressed in kcal, g and g.
      These figures must be given per person (portions).
      
      IMPORTANT RULES FOR INGREDIENTS:
      - The provided ingredients MUST be used in the recipe
      - ${allowOtherIngredients ? 'You can add other common ingredients to enrich the recipe (spices, condiments, etc.)' : 'Use ONLY the provided ingredients, do NOT add any other ingredient'}
      - Quantities must be realistic and proportional to the number of people
      - Icons must be an emoji, not text (only one emoji per ingredient).
      - Be creative!`
      :
      `Tu es un chef cuisinier expert.
      Génère une seule recette personnalisée en tenant compte de toutes les préférences.
      Sois créatif et propose une recette appétissante qui respecte les contraintes.
      Pour la soupe ne pas utiliser de bouillon déjà prêt.
      Tu peux générer toutes sortes de recette : des tartes, croquettes, quiches, gratins, salades, pizza, toasts, tortillas, ragouts, omelettes, etc.
      Le titre de la recette doit correspondre aux maximum la recette et aux ingrédients.
      Les calories, lipides et protéines doivent être des nombres exprimés en kcal, g et g.
      Ces chiffres doivent être donnés par personne (portions).
      
      RÈGLES IMPORTANTES POUR LES INGRÉDIENTS :
      - Les ingrédients fournis DOIVENT être utilisés dans la recette
      - ${allowOtherIngredients ? 'Tu peux ajouter d\'autres ingrédients courants pour enrichir la recette (épices, condiments, etc.)' : 'Utilise UNIQUEMENT les ingrédients fournis, n\'ajoute AUCUN autre ingrédient'}
      - Les quantités doivent être réalistes et proportionnelles au nombre de personnes
      - Les icones doivent être un emoji pas de texte (un seul emoji par ingrédient).
      - Sois créatif !`;

    // Construire le contexte avec les recettes existantes
    let contextInstructions = instructions;

    // Si des recettes existantes sont fournies, les ajouter au contexte
    if (existingRecipes && existingRecipes.length > 0) {
      // Nettoyer les recettes existantes en enlevant les steps pour réduire les tokens
      const cleanedExistingRecipes = existingRecipes.map((recipe: any) => ({
        title: recipe.title,
        difficulty: recipe.difficulty,
        cooking_time: recipe.cooking_time,
        icon: recipe.icon,
        calories: recipe.calories,
        lipids: recipe.lipids,
        proteins: recipe.proteines,
        // On enlève les steps pour économiser les tokens
      }));

      const existingMessage = language === 'en' ?
        `\n\nIMPORTANT: Here are the recipes already generated that you should NOT repeat: ${cleanedExistingRecipes}. Generate a completely different and original recipe. Change the type of meal (example: if it's a gratin propose a soup, if it's a soup propose a gratin, etc.). DON'T REPEAT 2 TIMES THE SAME TYPE OF RECIPE !` :
        `\n\nIMPORTANT : Voici les recettes déjà générées que tu ne dois PAS répéter : ${cleanedExistingRecipes}. Génère une recette complètement différente et originale. Change OBLIGATOIREMENT de type de repas (exemple: si c'est un gratin propose une soupe, si c'est une soupe propose un gratin, etc...). NE GENERE PAS 2 GRATINS OU 2 SOUPES OU 2 QUICHE OU 2 PIZZAS OU 2 TOASTS OU 2 TORTILLAS ETC... A LA SUITE !`;

      contextInstructions += existingMessage;
    }

    const input = language === 'en' ?
      `Generate a recipe : 
      
      IMPORTANT: Extract only the ingredients you need for the recipe from this list: ${ingredients}. 
      
      Preferences:
      Dish type: ${dishType === "all" ? ["Soup", "Gratin", "Quiche", "Pizza", "Toast", "Tortilla", "Stew", "Omelet", "Meal"][Math.floor(Math.random() * 9)] : dishType},
      Duration: ${duration},
      Number of people: ${servings}, 
      CuisineStyle: ${cuisineStyle === "all" ? ["Spicy", "Italian", "Mexican", "French", "Asian", "Mediterranean"][Math.floor(Math.random() * 6)] : cuisineStyle},
      Diet: ${diet},
      Max calories per person: ${calories} kcal.
      
      INGREDIENT CONSTRAINT: ${allowOtherIngredients
        ? `You can add other common ingredients (spices, condiments, oil, salt, pepper, etc.) to enrich the recipe.`
        : `Use ONLY the provided ingredients: ${ingredients}. Do NOT add any other ingredient.`
      }
      
      CALORIE CONSTRAINT: The recipe must contain less than ${calories} calories per person.

      ${dishType === "all" && "VARIES BETWEEN DISH TYPES"} !!!
      
      Return the recipe with all requested details.` :
      `Génère une recette : 

      IMPORTANT: Extrait seulement les ingrédients dont tu as besoin pour la recette parmis cette liste : ${ingredients}. 
      
      Préférences: Type de plat:
      ${dishType === "all" ? ["Soupe", "Gratin", "Quiche", "Pizza", "Toast", "Tortilla", "Ragout", "Omelette", "Repas"][Math.floor(Math.random() * 9)] : dishType},
      Durée: ${duration},
      Nombre de personnes: ${servings}, 
      CuisineStyle: ${cuisineStyle === "all" ? ["Spicy", "Italian", "Mexican", "French", "Asian", "Mediterranean"][Math.floor(Math.random() * 6)] : cuisineStyle},
      Régime: ${diet},
      Calories max par personne: ${calories} kcal.
      
      CONTRAINTE INGRÉDIENTS: ${allowOtherIngredients
        ? `Tu peux ajouter d'autres ingrédients courants (épices, condiments, huile, sel, poivre, etc.) pour enrichir la recette.`
        : `Utilise UNIQUEMENT les ingrédients fournis: ${ingredients}. N'ajoute AUCUN autre ingrédient.`
      }
      
      CONTRAINTE CALORIES: La recette doit contenir moins de ${calories} calories par personne.

      ${cuisineStyle === "all" && "VARIE ENTRE STYLES DE CUISINE"}
      
      Retourne la recette avec tous les détails demandés.`;

    const response: any = await openai.responses.parse({
      model: "gpt-4.1-nano",
      instructions: contextInstructions,
      input: input,
      text: {
        format: zodTextFormat(ChatGPTResponseObject, "recipe"),
      }
    });

    const recipe = response.output_parsed;

    if (!recipe) {
      throw new Error('Réponse vide de ChatGPT');
    }

    // Ajouter un ID unique à la recette
    const recipeWithId = {
      ...recipe.recipe,
      id: uuidv4() as string
    };

    if (userId)
      await AnonymousUser.findByIdAndUpdate(userId, { lastActivity: Date.now() });

    res.status(200).json({ recipe: recipeWithId });
  } catch (error) {
    console.error('Erreur lors de la génération de la recette:', error);
    next(new ApiError("Erreur lors de la génération de la recette", 500));
  }
}

export async function getRecipeSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipe, language = 'fr' } = req.body;

    if (!recipe) {
      return next(new ApiError("Recette requise", 400));
    }

    const ChatGPTResponseObject = z.object({
      details: z.object({
        steps: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })),
      })
    });

    const response: any = await openai.responses.parse({
      model: "gpt-4.1-nano",
      instructions: language === 'en' ?
        `steps: Tableau d'étapes de préparation avec les quantités de chaque ingrédient pour chaque étape, il doit y avoir au MINIMUM 10 étapes et au moins 15 étapes pour la difficulté HARD.
         IMPORTNANT : Soit très précis et détaillé et utilise des mots très simples pour que même un débutant qui n'a jamais cuisiné puisse suivre les instructions sans aucune difficulté !
         IMPORTANT : Ne pas utiliser de mots techniques ou de termes spécifiques à la cuisine, mais des mots simples et compréhensibles pour tous !` :
        `steps: Tableau d'étapes de préparation avec les quantités de chaque ingrédient pour chaque étape, il doit y avoir au MINIMUM 10 étapes et au moins 15 étapes pour la difficulté HARD.
         IMPORTNANT : Soit très précis et détaillé et utilise des mots très simples pour que même un débutant qui n'a jamais cuisiné puisse suivre les instructions sans aucune difficulté !
         IMPORTANT : Ne pas utiliser de mots techniques ou de termes spécifiques à la cuisine, mais des mots simples et compréhensibles pour tous !`,
      input: language === 'en' ?
        `I want the preparation steps of the recipe: ${JSON.stringify(recipe)}` :
        `Je veux les étapes de préparation de la recette : ${JSON.stringify(recipe)}`,
      text: {
        format: zodTextFormat(ChatGPTResponseObject, "details"),
      }
    });

    const details = response.output_parsed;

    if (!details) {
      throw new Error('Réponse vide de ChatGPT');
    }

    res.status(200).json(details.details);
  } catch (error) {
    console.error('Erreur lors de la génération des étapes:', error);
    next(new ApiError("Erreur lors de la génération des étapes", 500));
  }
}

export async function saveRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipe, language } = req.body;

    if (!recipe) {
      return next(new ApiError("Recette requise", 400));
    }

    // Vérifier si la recette existe déjà
    const existingRecipe = await Recipe.findOne({
      id: recipe.id
    });

    if (existingRecipe) {
      return res.status(200).json({
        success: true,
        message: 'Recette déjà sauvegardée',
        recipe: existingRecipe
      });
    }

    // Créer une nouvelle recette
    const newRecipe = new Recipe({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      difficulty: recipe.difficulty,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      calories: recipe.calories,
      lipids: recipe.lipids,
      proteins: recipe.proteins,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      language
    });

    const savedRecipe = await newRecipe.save();

    console.log('Recette sauvegardée dans MongoDB:', savedRecipe._id);

    res.status(200).json({
      success: true,
      message: 'Recette sauvegardée avec succès',
      recipe: savedRecipe
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recette:', error);
    next(new ApiError("Erreur lors de la sauvegarde de la recette", 500));
  }
}

export async function getRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const recipes = await Recipe.find(req.query).sort({ title: -1 });

    res.status(200).json({
      success: true,
      recipes: recipes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des recettes:', error);
    next(new ApiError("Erreur lors de la récupération des recettes", 500));
  }
}

export async function likeRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.recipeId, { $inc: { likedBy: 1 } }, { new: true });
    res.status(200).json({ recipe });
  } catch (error) {
    console.error('Erreur lors du like de la recette:', error);
    next(new ApiError("Erreur lors du like de la recette", 500));
  }
}

export async function updateRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeId } = req.params;
    const updates = req.body;

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedRecipe) {
      return next(new ApiError("Recette non trouvée", 404));
    }

    res.status(200).json({
      success: true,
      message: 'Recette mise à jour avec succès',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la recette:', error);
    next(new ApiError("Erreur lors de la mise à jour de la recette", 500));
  }
}

export async function deleteRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeId } = req.params;

    const deletedRecipe = await Recipe.findByIdAndDelete(recipeId);

    if (!deletedRecipe) {
      return next(new ApiError("Recette non trouvée", 404));
    }

    res.status(200).json({
      success: true,
      message: 'Recette supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la recette:', error);
    next(new ApiError("Erreur lors de la suppression de la recette", 500));
  }
}

export async function processVoiceIngredients(req: Request, res: Response, next: NextFunction) {
  try {
    const { voiceText, language = 'fr' } = req.body;

    if (!voiceText) {
      return next(new ApiError("Texte vocal requis", 400));
    }

    const ChatGPTResponseObject = z.object({
      ingredients: z.array(z.string()),
    });

    const response: any = await openai.responses.parse({
      model: "gpt-4.1-nano",
      instructions: language === 'en' ?
        `You are a specialized assistant for extracting culinary ingredients from spoken text. 
        Analyze the spoken text and extract a list of culinary ingredients.
        - Return only the names of the ingredients (without quantities)
        - Capitalize the first letter of each ingredient
        - Ignore non-culinary words
        - Return an array of strings
        - Ignore the duplicates` :
        `Tu es un assistant spécialisé dans l'extraction d'ingrédients culinaires à partir de texte dicté. 
        Analyse le texte vocal et extrait une liste d'ingrédients culinaires.
        - Retourne uniquement les noms des ingrédients (sans quantités)
        - Capitalise la première lettre de chaque ingrédient
        - Ignore les mots non-culinaires
        - Retourne un tableau de chaînes de caractères
        - Ignore les doublons`,
      input: language === 'en' ?
        `Extract culinary ingredients from this text: ${voiceText}` :
        `Extrais les ingrédients culinaires de ce texte : ${voiceText}`,
      text: {
        format: zodTextFormat(ChatGPTResponseObject, "ingredients"),
      }
    });

    const result = response.output_parsed;

    if (!result) {
      throw new Error('Réponse vide de ChatGPT');
    }

    res.status(200).json({ ingredients: result.ingredients });
  } catch (error) {
    console.error('Erreur lors du traitement des ingrédients vocaux:', error);
    next(new ApiError("Erreur lors du traitement des ingrédients vocaux", 500));
  }
} 