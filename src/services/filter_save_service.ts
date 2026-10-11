export class FilterSaveService {
  private static readonly KEY_SORTBy = 'saved_sort_by';
  private static readonly KEY_SKIN_HAIR_TYPE = 'saved_skin_hair_type';
  private static readonly KEY_SIZE = 'saved_size';
  private static readonly KEY_SELECTED_CATEGORIES = 'saved_selected_categories';
  private static readonly KEY_RECENT_SEARCHES = 'recent_searches';

  // حفظ خيارات التصفية والترتيب[cite: 9]
  static saveFilters(filters: {
    sortBy: string;
    skinHairType?: string | null;
    size?: string | null;
    selectedCategories: string[];
  }) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.KEY_SORTBy, filters.sortBy);
      localStorage.setItem(this.KEY_SELECTED_CATEGORIES, JSON.stringify(filters.selectedCategories));
      
      if (filters.skinHairType) {
        localStorage.setItem(this.KEY_SKIN_HAIR_TYPE, filters.skinHairType);
      } else {
        localStorage.removeItem(this.KEY_SKIN_HAIR_TYPE);
      }

      if (filters.size) {
        localStorage.setItem(this.KEY_SIZE, filters.size);
      } else {
        localStorage.removeItem(this.KEY_SIZE);
      }
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  }

  // استرجاع خيارات التصفية والفئات المحفوظة[cite: 9]
  static loadFilters(): {
    sortBy: string;
    skinHairType: string | null;
    size: string | null;
    selectedCategories: string[];
  } {
    if (typeof window === 'undefined') {
      return { sortBy: 'newest', skinHairType: null, size: null, selectedCategories: [] };
    }
    try {
      const selectedCats = localStorage.getItem(this.KEY_SELECTED_CATEGORIES);
      return {
        sortBy: localStorage.getItem(this.KEY_SORTBy) || 'newest',
        skinHairType: localStorage.getItem(this.KEY_SKIN_HAIR_TYPE),
        size: localStorage.getItem(this.KEY_SIZE),
        selectedCategories: selectedCats ? JSON.parse(selectedCats) : [],
      };
    } catch (e) {
      return { sortBy: 'newest', skinHairType: null, size: null, selectedCategories: [] };
    }
  }

  // حفظ عمليات البحث الأخيرة[cite: 9]
  static saveSearchQuery(query: string): string[] {
    if (typeof window === 'undefined' || !query.trim()) return [];
    try {
      let searches = this.loadRecentSearches();
      searches = searches.filter((s) => s !== query);
      searches.unshift(query);
      if (searches.length > 5) {
        searches = searches.slice(0, 5);
      }
      localStorage.setItem(this.KEY_RECENT_SEARCHES, JSON.stringify(searches));
      return searches;
    } catch (e) {
      return [];
    }
  }

  // استرجاع عمليات البحث الأخيرة[cite: 9]
  static loadRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const searches = localStorage.getItem(this.KEY_RECENT_SEARCHES);
      return searches ? JSON.parse(searches) : [];
    } catch (e) {
      return [];
    }
  }
}