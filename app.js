// ===================================
// ほしいもの保存・管理サイト
// メインアプリケーション
// ===================================

// アプリケーション状態
const App = {
    // 現在編集中のアイテムID
    editingItemId: null,

    // 写真プレビュー用の一時配列
    tempPhotos: [],

    // ランキング選択状態
    rankingSelection: [],

    /**
     * アプリケーション初期化
     */
    init() {
        console.log('アプリケーション初期化中...');

        // イベントリスナーを設定
        this.setupEventListeners();

        // カテゴリセレクトを初期化
        this.loadCategories();

        console.log('アプリケーション初期化完了');
    },

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // トップ画面
        document.getElementById('btn-to-register').addEventListener('click', () => {
            this.resetRegisterForm();
            UI.showScreen('register-screen');
        });

        document.getElementById('btn-to-list').addEventListener('click', () => {
            this.loadItemsList();
            UI.showScreen('list-screen');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            UI.showModal('settings-modal');
        });

        // 登録画面
        document.getElementById('btn-back-from-register').addEventListener('click', () => {
            UI.showScreen('top-screen');
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterSubmit();
        });

        document.getElementById('input-photos').addEventListener('change', (e) => {
            this.handlePhotoSelect(e.target.files);
        });

        document.getElementById('btn-new-category').addEventListener('click', () => {
            UI.showModal('new-category-modal');
        });

        // 確認画面
        document.getElementById('btn-back-to-top').addEventListener('click', () => {
            UI.showScreen('top-screen');
        });

        document.getElementById('btn-to-ranking').addEventListener('click', () => {
            this.loadRankingScreen();
            UI.showScreen('ranking-screen');
        });

        document.getElementById('btn-bulk-delete').addEventListener('click', () => {
            this.handleBulkDelete();
        });

        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', UI.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        // 詳細画面
        document.getElementById('btn-back-from-detail').addEventListener('click', () => {
            this.loadItemsList();
            UI.showScreen('list-screen');
        });

        document.getElementById('btn-edit-item').addEventListener('click', () => {
            this.handleEditItem();
        });

        document.getElementById('btn-delete-item').addEventListener('click', () => {
            this.handleDeleteItem();
        });

        // ランキング画面
        document.getElementById('btn-back-from-ranking').addEventListener('click', () => {
            this.loadItemsList();
            UI.showScreen('list-screen');
        });

        document.getElementById('btn-save-ranking').addEventListener('click', () => {
            this.handleSaveRanking();
        });

        document.getElementById('btn-clear-ranking').addEventListener('click', () => {
            this.handleClearRanking();
        });

        // 新規カテゴリモーダル
        document.getElementById('close-category-modal').addEventListener('click', () => {
            UI.hideModal('new-category-modal');
        });

        document.getElementById('cancel-new-category').addEventListener('click', () => {
            UI.hideModal('new-category-modal');
        });

        document.getElementById('save-new-category').addEventListener('click', () => {
            this.handleSaveNewCategory();
        });

        // 設定モーダル
        document.getElementById('close-settings-modal').addEventListener('click', () => {
            UI.hideModal('settings-modal');
        });

        document.getElementById('btn-export-data').addEventListener('click', () => {
            this.handleExportData();
        });

        document.getElementById('btn-import-data').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.handleImportData(e.target.files[0]);
        });

        document.getElementById('btn-clear-all-data').addEventListener('click', () => {
            this.handleClearAllData();
        });
    },

    /**
     * カテゴリセレクトを読み込み
     */
    loadCategories() {
        const categories = Storage.getCategories();
        const select = document.getElementById('input-category');

        // 既存のオプションをクリア（最初のオプションは残す）
        select.innerHTML = '<option value="">選択してください</option>';

        // カテゴリを追加
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    },

    /**
     * 登録フォームをリセット
     */
    resetRegisterForm() {
        document.getElementById('register-form').reset();
        document.getElementById('photo-preview-container').innerHTML = '';
        this.tempPhotos = [];
        this.editingItemId = null;
    },

    /**
     * 写真選択処理
     */
    async handlePhotoSelect(files) {
        if (files.length === 0) return;

        try {
            const base64Photos = await UI.filesToBase64(files);
            this.tempPhotos.push(...base64Photos);
            this.renderPhotoPreview();
        } catch (error) {
            console.error('写真の読み込みに失敗しました:', error);
            UI.showToast('写真の読み込みに失敗しました', 'error');
        }
    },

    /**
     * 写真プレビューを表示
     */
    renderPhotoPreview() {
        const container = document.getElementById('photo-preview-container');
        container.innerHTML = '';

        this.tempPhotos.forEach((photo, index) => {
            const preview = document.createElement('div');
            preview.className = 'photo-preview';
            preview.innerHTML = `
        <img src="${photo}" alt="プレビュー">
        <button type="button" class="photo-preview-remove" data-index="${index}">×</button>
      `;

            // 削除ボタンのイベント
            preview.querySelector('.photo-preview-remove').addEventListener('click', () => {
                this.tempPhotos.splice(index, 1);
                this.renderPhotoPreview();
            });

            container.appendChild(preview);
        });
    },

    /**
     * 登録フォーム送信処理
     */
    handleRegisterSubmit() {
        const formData = {
            name: document.getElementById('input-name').value.trim(),
            budget: document.getElementById('input-budget').value.trim(),
            deadline: document.getElementById('input-deadline').value,
            color: document.getElementById('input-color').value.trim(),
            design: document.getElementById('input-design').value.trim(),
            features: document.getElementById('input-features').value.trim(),
            url: document.getElementById('input-url').value.trim(),
            photos: this.tempPhotos,
            category: document.getElementById('input-category').value || '未分類',
            notes: document.getElementById('input-notes').value.trim()
        };

        // 編集モードの場合はIDを追加
        if (this.editingItemId) {
            formData.id = this.editingItemId;
        }

        // 保存
        const success = Storage.saveItem(formData);

        if (success) {
            UI.showToast(this.editingItemId ? '更新しました' : '登録しました', 'success');
            this.resetRegisterForm();
            this.loadItemsList();
            UI.showScreen('list-screen');
        } else {
            UI.showToast('保存に失敗しました', 'error');
        }
    },

    /**
     * 新規カテゴリ保存処理
     */
    handleSaveNewCategory() {
        const input = document.getElementById('new-category-input');
        const categoryName = input.value.trim();

        if (!categoryName) {
            UI.showToast('カテゴリ名を入力してください', 'error');
            return;
        }

        const success = Storage.addCategory(categoryName);

        if (success) {
            UI.showToast('カテゴリを作成しました', 'success');
            this.loadCategories();
            document.getElementById('input-category').value = categoryName;
            input.value = '';
            UI.hideModal('new-category-modal');
        } else {
            UI.showToast('カテゴリの作成に失敗しました', 'error');
        }
    },

    /**
     * アイテム一覧を読み込み
     */
    loadItemsList(searchQuery = '') {
        const container = document.getElementById('items-container');

        // 検索またはカテゴリ別取得
        let itemsByCategory;
        if (searchQuery) {
            const searchResults = Storage.searchItems(searchQuery);
            itemsByCategory = this.groupByCategory(searchResults);
        } else {
            itemsByCategory = Storage.getItemsByCategory();
        }

        // カテゴリが空の場合
        if (Object.keys(itemsByCategory).length === 0) {
            UI.showEmptyState(container, 'まだアイテムがありません', '📦');
            return;
        }

        // レンダリング
        container.innerHTML = '';

        Object.keys(itemsByCategory).sort().forEach(category => {
            const items = itemsByCategory[category];

            const section = document.createElement('div');
            section.className = 'category-section';

            section.innerHTML = `
        <div class="category-header">
          <h3>${UI.escapeHtml(category)}</h3>
          <span class="category-count">${items.length}</span>
        </div>
        <div class="category-items" id="category-${category}"></div>
      `;

            container.appendChild(section);

            const itemsContainer = section.querySelector('.category-items');

            items.forEach(item => {
                const card = this.createItemCard(item);
                itemsContainer.appendChild(card);
            });
        });
    },

    /**
     * アイテムをカテゴリ別にグループ化
     */
    groupByCategory(items) {
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
     * アイテムカードを作成
     */
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'card item-card card-clickable';

        // サムネイル
        const thumbnail = item.photos && item.photos.length > 0
            ? `<img src="${item.photos[0]}" alt="${UI.escapeHtml(item.name)}" class="item-thumbnail">`
            : '<div class="item-thumbnail" style="display: flex; align-items: center; justify-content: center; font-size: 3rem;">📦</div>';

        // ランクバッジ
        const rankBadge = item.rank
            ? `<div class="rank-badge">${item.rank}位</div>`
            : '';

        // メタ情報
        const metaTags = [];
        if (item.budget) metaTags.push(`<span class="item-tag">💰 ${UI.escapeHtml(item.budget)}</span>`);
        if (item.deadline) metaTags.push(`<span class="item-tag">📅 ${UI.formatDate(item.deadline)}</span>`);
        if (item.color) metaTags.push(`<span class="item-tag">🎨 ${UI.escapeHtml(item.color)}</span>`);

        card.innerHTML = `
      <input type="checkbox" class="item-card-checkbox" data-id="${item.id}">
      ${rankBadge}
      ${thumbnail}
      <div class="item-info">
        <div class="item-name">${UI.escapeHtml(item.name)}</div>
        <div class="item-meta">
          ${metaTags.join('')}
        </div>
      </div>
    `;

        // カードクリックで詳細画面へ
        card.addEventListener('click', (e) => {
            // チェックボックスクリック時は除外
            if (e.target.classList.contains('item-card-checkbox')) {
                this.handleCheckboxChange();
                return;
            }
            this.showItemDetail(item.id);
        });

        return card;
    },

    /**
     * チェックボックス変更処理
     */
    handleCheckboxChange() {
        const checkboxes = document.querySelectorAll('.item-card-checkbox:checked');
        const deleteBtn = document.getElementById('btn-bulk-delete');

        if (checkboxes.length > 0) {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    },

    /**
     * 一括削除処理
     */
    handleBulkDelete() {
        const checkboxes = document.querySelectorAll('.item-card-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.dataset.id);

        if (ids.length === 0) return;

        UI.showConfirm(
            `${ids.length}件のアイテムを削除しますか?`,
            () => {
                const success = Storage.deleteItems(ids);
                if (success) {
                    UI.showToast('削除しました', 'success');
                    this.loadItemsList();
                    document.getElementById('btn-bulk-delete').classList.add('hidden');
                } else {
                    UI.showToast('削除に失敗しました', 'error');
                }
            }
        );
    },

    /**
     * 検索処理
     */
    handleSearch(query) {
        this.loadItemsList(query);
    },

    /**
     * アイテム詳細を表示
     */
    showItemDetail(itemId) {
        const item = Storage.getItemById(itemId);
        if (!item) {
            UI.showToast('アイテムが見つかりません', 'error');
            return;
        }

        UI.currentItemId = itemId;

        // 名前
        document.getElementById('detail-item-name').textContent = item.name;

        // 写真ギャラリー
        const gallery = document.getElementById('detail-photo-gallery');
        if (item.photos && item.photos.length > 0) {
            gallery.innerHTML = item.photos.map(photo =>
                `<img src="${photo}" alt="${UI.escapeHtml(item.name)}">`
            ).join('');
        } else {
            gallery.innerHTML = '';
        }

        // 詳細情報
        document.getElementById('detail-budget').textContent = item.budget || '-';
        document.getElementById('detail-deadline').textContent = item.deadline ? UI.formatDate(item.deadline) : '-';
        document.getElementById('detail-color').textContent = item.color || '-';
        document.getElementById('detail-design').textContent = item.design || '-';
        document.getElementById('detail-features').textContent = item.features || '-';

        // URL
        const urlEl = document.getElementById('detail-url');
        if (item.url && UI.isUrl(item.url)) {
            urlEl.innerHTML = `<a href="${UI.escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${UI.escapeHtml(item.url)}</a>`;
        } else {
            urlEl.textContent = '-';
        }

        document.getElementById('detail-category').textContent = item.category || '-';
        document.getElementById('detail-notes').textContent = item.notes || '-';
        document.getElementById('detail-created').textContent = UI.formatDate(item.createdAt);
        document.getElementById('detail-updated').textContent = UI.formatDate(item.updatedAt);

        UI.showScreen('detail-screen');
    },

    /**
     * アイテム編集処理
     */
    handleEditItem() {
        const item = Storage.getItemById(UI.currentItemId);
        if (!item) {
            UI.showToast('アイテムが見つかりません', 'error');
            return;
        }

        // フォームに値をセット
        document.getElementById('input-name').value = item.name || '';
        document.getElementById('input-budget').value = item.budget || '';
        document.getElementById('input-deadline').value = item.deadline || '';
        document.getElementById('input-color').value = item.color || '';
        document.getElementById('input-design').value = item.design || '';
        document.getElementById('input-features').value = item.features || '';
        document.getElementById('input-url').value = item.url || '';
        document.getElementById('input-category').value = item.category || '';
        document.getElementById('input-notes').value = item.notes || '';

        // 写真
        this.tempPhotos = item.photos || [];
        this.renderPhotoPreview();

        // 編集モードフラグ
        this.editingItemId = item.id;

        UI.showScreen('register-screen');
    },

    /**
     * アイテム削除処理
     */
    handleDeleteItem() {
        UI.showConfirm(
            '本当に削除しますか?',
            () => {
                const success = Storage.deleteItem(UI.currentItemId);
                if (success) {
                    UI.showToast('削除しました', 'success');
                    this.loadItemsList();
                    UI.showScreen('list-screen');
                } else {
                    UI.showToast('削除に失敗しました', 'error');
                }
            }
        );
    },

    /**
     * ランキング画面を読み込み
     */
    loadRankingScreen() {
        const items = Storage.getAllItems();
        const container = document.getElementById('ranking-list');

        if (items.length === 0) {
            UI.showEmptyState(container, 'アイテムがありません', '📦');
            return;
        }

        // ランキング選択状態をリセット
        this.rankingSelection = [];

        container.innerHTML = '';

        items.forEach(item => {
            const rankItem = document.createElement('div');
            rankItem.className = 'ranking-item';
            rankItem.dataset.id = item.id;

            rankItem.innerHTML = `
        <div class="ranking-number" style="background: var(--color-bg-main); color: var(--color-text-secondary);">-</div>
        <div class="ranking-item-info">
          <div class="ranking-item-name">${UI.escapeHtml(item.name)}</div>
          ${item.category ? `<div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">${UI.escapeHtml(item.category)}</div>` : ''}
        </div>
      `;

            rankItem.addEventListener('click', () => {
                this.handleRankingItemClick(item.id, rankItem);
            });

            container.appendChild(rankItem);
        });
    },

    /**
     * ランキングアイテムクリック処理
     */
    handleRankingItemClick(itemId, element) {
        // 既に選択されている場合は解除
        const existingIndex = this.rankingSelection.findIndex(item => item.id === itemId);

        if (existingIndex !== -1) {
            this.rankingSelection.splice(existingIndex, 1);
        } else {
            this.rankingSelection.push({ id: itemId, element });
        }

        // UI更新
        this.updateRankingUI();
    },

    /**
     * ランキングUI更新
     */
    updateRankingUI() {
        // 全アイテムをリセット
        document.querySelectorAll('.ranking-item').forEach(item => {
            item.classList.remove('selected');
            const numberEl = item.querySelector('.ranking-number');
            numberEl.textContent = '-';
            numberEl.style.background = 'var(--color-bg-main)';
            numberEl.style.color = 'var(--color-text-secondary)';
        });

        // 選択されたアイテムを更新
        this.rankingSelection.forEach((item, index) => {
            item.element.classList.add('selected');
            const numberEl = item.element.querySelector('.ranking-number');
            numberEl.textContent = index + 1;
            numberEl.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)';
            numberEl.style.color = 'white';
        });
    },

    /**
     * ランキング保存処理
     */
    handleSaveRanking() {
        if (this.rankingSelection.length === 0) {
            UI.showToast('ランキングを選択してください', 'error');
            return;
        }

        const success = Storage.updateRankings(this.rankingSelection);

        if (success) {
            UI.showToast('ランキングを保存しました', 'success');
            this.loadItemsList();
            UI.showScreen('list-screen');
        } else {
            UI.showToast('保存に失敗しました', 'error');
        }
    },

    /**
     * ランキングクリア処理
     */
    handleClearRanking() {
        UI.showConfirm(
            'ランキングをクリアしますか?',
            () => {
                const success = Storage.updateRankings([]);
                if (success) {
                    UI.showToast('ランキングをクリアしました', 'success');
                    this.loadItemsList();
                    UI.showScreen('list-screen');
                } else {
                    UI.showToast('クリアに失敗しました', 'error');
                }
            }
        );
    },

    /**
     * データエクスポート処理
     */
    handleExportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `wishlist_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        UI.showToast('エクスポートしました', 'success');
    },

    /**
     * データインポート処理
     */
    handleImportData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                UI.showConfirm(
                    '既存のデータは上書きされます。よろしいですか?',
                    () => {
                        const success = Storage.importData(data);
                        if (success) {
                            UI.showToast('インポートしました', 'success');
                            this.loadCategories();
                            UI.hideModal('settings-modal');
                        } else {
                            UI.showToast('インポートに失敗しました', 'error');
                        }
                    }
                );
            } catch (error) {
                console.error('インポートエラー:', error);
                UI.showToast('ファイルの読み込みに失敗しました', 'error');
            }
        };

        reader.readAsText(file);

        // ファイル入力をリセット
        document.getElementById('import-file-input').value = '';
    },

    /**
     * 全データ削除処理
     */
    handleClearAllData() {
        UI.showConfirm(
            '全てのデータを削除しますか? この操作は取り消せません。',
            () => {
                const success = Storage.clearAll();
                if (success) {
                    UI.showToast('全データを削除しました', 'success');
                    this.loadCategories();
                    UI.hideModal('settings-modal');
                    UI.showScreen('top-screen');
                } else {
                    UI.showToast('削除に失敗しました', 'error');
                }
            }
        );
    }
};

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
