export interface GenerationOptions {
  productImage?: string;
  imageUrl?: string;
  mimeType?: string;
  category: string;
  sceneDescription: string;
  aspectRatio: string;
  numImages: number;
  modelPrompt?: string;
  backgroundPrompt?: string;
}
