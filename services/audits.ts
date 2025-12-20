
import { CatalogService } from './catalog';

export interface AuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
  details: {
    seoScore: number;
    performanceScore: number;
    marketingScore: number;
  }
}

export const performSEOAudit = async (): Promise<AuditResult> => {
  const products = await CatalogService.getProducts();
  const issues: AuditResult['issues'] = [];
  
  let seoPoints = 100;
  let perfPoints = 100;
  let marketPoints = 100;

  // SEO Checks
  products.forEach(p => {
    if (p.name.length < 10) {
        seoPoints -= 2;
        issues.push({ category: 'SEO', message: `Product "${p.name}" title is too short.`, severity: 'medium' });
    }
    if (p.description.length < 50) {
        seoPoints -= 3;
        issues.push({ category: 'SEO', message: `Product "${p.name}" description is thin (< 50 chars).`, severity: 'high' });
    }
  });

  // Performance Checks (Simulation)
  const heavyImages = products.filter(p => !p.image.includes('picsum')); // Mock check
  if (heavyImages.length > 0) {
      perfPoints -= 10;
      issues.push({ category: 'Technical', message: `${heavyImages.length} images are unoptimized.`, severity: 'high' });
  }

  // Marketing Checks
  if (products.filter(p => p.isSubscription).length < 2) {
      marketPoints -= 15;
      issues.push({ category: 'Marketing', message: 'Low number of subscription plans available.', severity: 'medium' });
  }
  
  const totalScore = Math.round((seoPoints + perfPoints + marketPoints) / 3);
  
  let grade: AuditResult['grade'] = 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';

  return {
    score: totalScore,
    grade,
    issues,
    details: {
        seoScore: seoPoints,
        performanceScore: perfPoints,
        marketingScore: marketPoints
    }
  };
};
