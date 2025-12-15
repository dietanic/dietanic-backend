import { getProducts, getCategories } from './catalog';

export const generateLLMContent = (): string => {
  const products = getProducts();
  const categories = getCategories();
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `# Dietanic Store Inventory\n`;
  content += `> Generated: ${timestamp}\n`;
  content += `> Description: Premium salad and healthy meal subscription e-commerce platform.\n\n`;
  
  content += `## Site Structure\n`;
  content += `- /shop: Main catalog\n`;
  content += `- /cart: Shopping cart\n`;
  content += `- /account: Customer portal\n\n`;

  content += `## Product Categories\n`;
  categories.forEach(c => content += `- ${c.name}\n`);
  content += `\n`;
  
  content += `## Product Catalog\n`;
  products.forEach(p => {
    content += `\n### ${p.name}\n`;
    content += `- ID: ${p.id}\n`;
    content += `- Price: ₹${p.price}\n`;
    content += `- Category: ${p.category}\n`;
    content += `- Type: ${p.isSubscription ? 'Subscription Plan' : 'Single Item'}\n`;
    content += `- Description: ${p.description}\n`;
    if (p.ingredients && p.ingredients.length > 0) {
        content += `- Ingredients: ${p.ingredients.join(', ')}\n`;
    }
    content += `- Availability: ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}\n`;
  });

  return content;
};
