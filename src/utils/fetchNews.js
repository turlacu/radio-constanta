// API URL - uses the server's /api/news endpoint
const API_URL = import.meta.env.VITE_API_URL || '/api/news';

// Function to fetch news from API
export const fetchNews = async (page = 1, limit = 20, category = null) => {
  try {
    console.log('Fetching news from API...');

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (category) {
      params.append('category', category);
    }

    // Fetch from API
    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    console.log(`Fetched ${data.articles.length} articles from API`);

    return {
      articles: data.articles,
      hasMore: data.hasMore,
      total: data.total
    };

  } catch (error) {
    console.error('Error fetching news from API:', error);
    throw new Error('Nu s-au putut încărca știrile. Verificați conexiunea la internet.');
  }
};

// Helper function to check if articles are older than 3 days
export const isWithinThreeDays = (dateString) => {
  const articleDate = new Date(dateString);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return articleDate >= threeDaysAgo;
};

// Function to filter articles by date range
export const filterArticlesByDateRange = (articles, days = 3) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return articles.filter(article => {
    const articleDate = new Date(article.date);
    return articleDate >= cutoffDate;
  });
};

// Function to filter articles by category
export const filterArticlesByCategory = (articles, category) => {
  if (!category) return articles;
  return articles.filter(article =>
    article.category.toLowerCase() === category.toLowerCase()
  );
};
