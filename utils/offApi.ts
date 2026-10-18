
/**
 * Open Food Facts API (v2) Utility
 * Silent fallback for structured nutrition data.
 */

export interface OFFProduct {
  name: string;
  brands?: string;
  nutriments: {
    energy_100g?: number;
    'energy-kcal_100g'?: number;
    sugars_100g?: number;
    sodium_100g?: number;
    proteins_100g?: number;
    'vitamin-a_100g'?: number;
    'vitamin-c_100g'?: number;
    'vitamin-d_100g'?: number;
    potassium_100g?: number;
    phosphorus_100g?: number;
    [key: string]: any;
  };
  ingredients_text_en?: string;
  ingredients_text?: string;
  labels?: string;
  image_url?: string;
}

export const fetchProductByBarcode = async (barcode: string): Promise<OFFProduct | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=product_name,brands,nutriments,ingredients_text_en,ingredients_text,labels,image_url`, {
      headers: {
        'User-Agent': 'NutriGuardianPro - 1.0 - https://github.com/nutri-guardian-pro'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      name: p.product_name || 'Unknown Product',
      brands: p.brands,
      nutriments: p.nutriments || {},
      ingredients_text: p.ingredients_text_en || p.ingredients_text || 'Ingredients not available.',
      labels: p.labels,
      image_url: p.image_url
    };
  } catch (err) {
    console.warn("Open Food Facts fetch failed:", err);
    return null;
  }
};
