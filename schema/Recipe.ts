import { Schema } from "mongoose";

export interface RecipeType {
  id: string;
  title: string;
  difficulty: string;
  cooking_time: string;
  icon: string;
  image: string;
  calories: string;
  lipids: string;
  proteins: string;
  servings?: number;
  ingredients?: {
    name: string;
    quantity: string;
    icon: string;
    tags: string[];
  }[];
  steps?: {
    title: string;
    description: string;
  }[];
  likedBy: number;
  language: string;
}

export default new Schema<RecipeType>({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  difficulty: {
    type: String,
    required: true,
    enum: ['EASY', 'MEDIUM', 'HARD']
  },
  cooking_time: { type: String, required: true },
  servings: { type: Number, required: true, min: 1 },
  calories: { type: String },
  lipids: { type: String },
  proteins: { type: String },
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    icon: { type: String, required: true },
    tags: [{
      type: String,
      enum: ['Protein', 'Fat', 'Omega-3', 'Carbohydrate', 'Sugar', 'Vitamin', 'Mineral', 'Other']
    }]
  }],
  steps: [{
    title: { type: String, required: true },
    description: { type: String, required: true }
  }],
  image: { type: String },
  icon: { type: String },
  likedBy: { type: Number, default: 0 },
  language: { type: String, default: 'fr' }
}, {
  timestamps: true,
  minimize: false,
}); 