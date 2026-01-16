// ===================================
// ほしいもの保存・管理サイト
// LocalStorage管理モジュール
// ===================================

const Storage = {
  // キー定数
  ITEMS_KEY: 'wishlist_items',
  CATEGORIES_KEY: 'wishlist_categories',
  
  /**
   * 全アイテムを取得
   * @returns {Array} アイテムの配列
   */
  getAllItems() {
    try {
      const data = localStorage.getItem(this.ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('アイテムの取得に失敗しました:', error);
      return [];
    }
  },
  
  /**
   * IDでアイテムを取得
   * @param {string} id - アイテムID
   * @returns {Object|null} アイテムオブジェクト
   */
  getItemById(id) {
    const items = this.getAllItems();
    return items.find(item => item.id === id) || null;
  },
  
  /**
   * アイテムを保存（新規または更新）
   * @param {Object} item - アイテムオブジェクト
   * @returns {boolean} 成功したかどうか
   */
  saveItem(item) {
    try {
      const items = this.getAllItems();
      const now = new Date().toISOString();
      
      // 既存アイテムのインデックスを検索
      const existingIndex = items.findIndex(i => i.id === item.id);
      
      if (existingIndex !== -1) {
        // 更新
        items[existingIndex] = {
          ...item,
          updatedAt: now
        };
      } else {
        // 新規作成
        const newItem = {
          id: this.generateId(),
          ...item,
          createdAt: now,
          updatedAt: now
        };
        items.push(newItem);
      }
      
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error('アイテムの保存に失敗しました:', error);
      return false;
    }
  },
  
  /**
   * アイテムを削除
   * @param {string} id - アイテムID
   * @returns {boolean} 成功したかどうか
   */
  deleteItem(id) {
    try {
      const items = this.getAllItems();
      const filteredItems = items.filter(item => item.id !== id);
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('アイテムの削除に失敗しました:', error);
      return false;
    }
  },
  
  /**
   * 複数のアイテムを一括削除
   * @param {Array} ids - アイテムIDの配列
   * @returns {boolean} 成功したかどうか
   */
  deleteItems(ids) {
    try {
      const items = this.getAllItems();
      const filteredItems = items.filter(item => !ids.includes(item.id));
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('アイテムの一括削除に失敗しました:', error);
      return false;
    }
  },
  
  /**
   * カテゴリ一覧を取得
   * @returns {Array} カテゴリ名の配列
   */
  getCategories() {
    try {
      const data = localStorage.getItem(this.CATEGORIES_KEY);
      const categories = data ? JSON.parse(data) : [];
      
      // デフォルトカテゴリ
      const defaultCategories = ['未分類', '家電', 'ファッション', '本・雑誌', '食品', 'その他'];
      
      // 既存カテゴリとマージ（重複削除）
      const allCategories = [...new Set([...defaultCategories, ...categories])];
      return allCategories;
    } catch (error) {
      console.error('カテゴリの取得に失敗しました:', error);
      return ['未分類'];
    }
  },
  
  /**
   * カテゴリを追加
   * @param {string} categoryName - カテゴリ名
   * @returns {boolean} 成功したかどうか
   */
  addCategory(categoryName) {
    try {
      if (!categoryName || categoryName.trim() === '') {
        return false;
      }
      
      const categories = this.getCategories();
      
      // 既に存在する場合は追加しない
      if (categories.includes(categoryName.trim())) {
        return true;
      }
      
      categories.push(categoryName.trim());
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
      return true;
    } catch (error) {
      console.error('カテゴリの追加に失敗しました:', error);
      return false;
    }
  },
  
  /**
   * カテゴリ別にアイテムを取得
   * @returns {Object} カテゴリをキーとしたアイテムのオブジェクト
   */
  getItemsByCategory() {
    const items = this.getAllItems();
    const grouped = {};
    
    items.forEach(item => {
      const category = item.category || '未分類';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  },
  
  /**
   * ランキング順にアイテムを取得
   * @returns {Array} ランキング順のアイテム配列
   */
  getItemsByRank() {
    const items = this.getAllItems();
    return items
      .filter(item => item.rank !== null && item.rank !== undefined)
      .sort((a, b) => a.rank - b.rank);
  },
  
  /**
   * アイテムのランキングを更新
   * @param {Array} rankedItems - ランク付けされたアイテムの配列 [{id, rank}, ...]
   * @returns {boolean} 成功したかどうか
   */
  updateRankings(rankedItems) {
    try {
      const items = this.getAllItems();
      
      // まず全アイテムのランクをクリア
      items.forEach(item => {
        item.rank = null;
      });
      
      // ランク付けされたアイテムのランクを設定
      rankedItems.forEach((rankedItem, index) => {
        const item = items.find(i => i.id === rankedItem.id);
        if (item) {
          item.rank = index + 1;
          item.updatedAt = new Date().toISOString();
        }
      });
      
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error('ランキングの更新に失敗しました:', error);
      return false;
    }
  },
  
  /**
   * 検索（名前・カテゴリ・特徴などで）
   * @param {string} query - 検索クエリ
   * @returns {Array} 検索結果のアイテム配列
   */
  searchItems(query) {
    if (!query || query.trim() === '') {
      return this.getAllItems();
    }
    
    const items = this.getAllItems();
    const lowerQuery = query.toLowerCase().trim();
    
    return items.filter(item => {
      return (
        (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
        (item.category && item.category.toLowerCase().includes(lowerQuery)) ||
        (item.features && item.features.toLowerCase().includes(lowerQuery)) ||
        (item.design && item.design.toLowerCase().includes(lowerQuery)) ||
        (item.notes && item.notes.toLowerCase().includes(lowerQuery))
      );
    });
  },
  
  /**
   * ユニークIDを生成
   * @returns {string} UUID
   */
  generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * 全データをクリア（デバッグ用）
   */
  clearAll() {
    try {
      localStorage.removeItem(this.ITEMS_KEY);
      localStorage.removeItem(this.CATEGORIES_KEY);
      return true;
    } catch (error) {
      console.error('データのクリアに失敗しました:', error);
      return false;
    }
  },
  
  /**
   * データをエクスポート
   * @returns {Object} エクスポートデータ
   */
  exportData() {
    return {
      items: this.getAllItems(),
      categories: this.getCategories(),
      exportedAt: new Date().toISOString()
    };
  },
  
  /**
   * データをインポート
   * @param {Object} data - インポートデータ
   * @returns {boolean} 成功したかどうか
   */
  importData(data) {
    try {
      if (data.items) {
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(data.items));
      }
      if (data.categories) {
        localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(data.categories));
      }
      return true;
    } catch (error) {
      console.error('データのインポートに失敗しました:', error);
      return false;
    }
  }
};

// グローバルに公開
window.Storage = Storage;
