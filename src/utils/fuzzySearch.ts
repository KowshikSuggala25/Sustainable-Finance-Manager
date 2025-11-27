import { Transaction } from '@/hooks/useTransactions';

export const fuzzySearch = (items: Transaction[], query: string): Transaction[] => {
  if (!query.trim()) return items;

  const queryLower = query.toLowerCase();
  
  return items.filter(item => {
    // Check title/description
    if (item.title.toLowerCase().includes(queryLower)) return true;
    
    // Check category
    if (item.category.toLowerCase().includes(queryLower)) return true;
    
    // Check amount (convert to string and search)
    if (Math.abs(item.amount).toString().includes(query.replace(/[^\d.]/g, ''))) return true;
    
    // Fuzzy matching for title/description (allows for typos)
    const descWords = item.title.toLowerCase().split(' ');
    const queryWords = queryLower.split(' ');
    
    return queryWords.some(queryWord => 
      descWords.some(descWord => 
        descWord.includes(queryWord) || 
        queryWord.includes(descWord) ||
        levenshteinDistance(descWord, queryWord) <= Math.floor(queryWord.length * 0.3)
      )
    );
  });
};

// Simple Levenshtein distance implementation for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};