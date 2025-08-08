import { RouteType } from '../../types';
import { generateSingleRecipeWithFilters, getRecipeSteps, processVoiceIngredients, saveRecipe, getRecipes, updateRecipe, deleteRecipe, likeRecipe } from '../controllers/recipe-controller';

export default [
  {
    url: "/recipe/generate-single",
    method: "post", func: generateSingleRecipeWithFilters
  },
  {
    url: "/recipe/steps",
    method: "post",
    func: getRecipeSteps
  },
  {
    url: "/recipe/process-voice-ingredients",
    method: "post",
    func: processVoiceIngredients
  },
  {
    url: "/recipe/save",
    method: "post",
    func: saveRecipe
  },
  {
    url: "/recipe",
    method: "get",
    func: getRecipes
  },
  {
    url: "/recipe/:recipeId",
    method: "put",
    func: updateRecipe
  },
  {
    url: "/recipe/:recipeId",
    method: "delete",
    func: deleteRecipe
  },
  {
    url: "/recipe/like/:recipeId",
    method: "post",
    func: likeRecipe
  },
] as RouteType[]; 