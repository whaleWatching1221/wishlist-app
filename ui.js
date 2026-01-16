// ===================================
// ほしいもの保存・管理サイト
// UI管理モジュール
// ===================================

const UI = {
    // 現在の画面
    currentScreen: 'top',

    // 選択中のアイテムID（詳細画面用）
    currentItemId: null,

    // 選択中のアイテムID配列（一括削除用）
    selectedItemIds: [],

    /**
     * 画面を切り替え
     * @param {string} screenId - 画面ID
     */
    showScreen(screenId) {
        // 全画面を非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 指定画面を表示
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // スクロール位置をトップに
            window.scrollTo(0, 0);
        }
    },

    /**
     * モーダルを表示
     * @param {string} modalId - モーダルID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * モーダルを非表示
     * @param {string} modalId - モーダルID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * 確認ダイアログを表示
     * @param {string} message - メッセージ
     * @param {Function} onConfirm - 確認時のコールバック
     * @param {Function} onCancel - キャンセル時のコールバック
     */
    showConfirm(message, onConfirm, onCancel = null) {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('confirm-yes');
        const cancelBtn = document.getElementById('confirm-no');

        if (!modal || !messageEl) return;

        messageEl.textContent = message;

        // イベントリスナーをクリア
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // 新しいイベントリスナーを設定
        newConfirmBtn.addEventListener('click', () => {
            this.hideModal('confirm-modal');
            if (onConfirm) onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            this.hideModal('confirm-modal');
            if (onCancel) onCancel();
        });

        this.showModal('confirm-modal');
    },

    /**
     * トースト通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ ('success', 'error', 'info')
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showToast(message, type = 'info', duration = 3000) {
        // 既存のトーストを削除
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 新しいトーストを作成
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 表示アニメーション
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自動非表示
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },

    /**
     * ローディング表示
     * @param {boolean} show - 表示するかどうか
     */
    showLoading(show) {
        let loader = document.getElementById('loading-overlay');

        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'loading-overlay';
                loader.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;
                loader.innerHTML = '<div style="color: white; font-size: 1.5rem;">読み込み中...</div>';
                document.body.appendChild(loader);
            }
        } else {
            if (loader) {
                loader.remove();
            }
        }
    },

    /**
     * 画像をBase64に変換
     * @param {File} file - 画像ファイル
     * @returns {Promise<string>} Base64文字列
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * 複数の画像をBase64に変換
     * @param {FileList} files - 画像ファイルリスト
     * @returns {Promise<Array>} Base64文字列の配列
     */
    async filesToBase64(files) {
        const promises = Array.from(files).map(file => this.fileToBase64(file));
        return Promise.all(promises);
    },

    /**
     * 日付をフォーマット
     * @param {string} dateString - ISO日付文字列
     * @returns {string} フォーマットされた日付
     */
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}年${month}月${day}日`;
    },

    /**
     * 相対時間を取得
     * @param {string} dateString - ISO日付文字列
     * @returns {string} 相対時間
     */
    getRelativeTime(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}日前`;
        if (hours > 0) return `${hours}時間前`;
        if (minutes > 0) return `${minutes}分前`;
        return 'たった今';
    },

    /**
     * HTMLエスケープ
     * @param {string} text - テキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        if (!text) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * URLかどうかを判定
     * @param {string} text - テキスト
     * @returns {boolean} URLかどうか
     */
    isUrl(text) {
        if (!text) return false;

        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 空の状態を表示
     * @param {HTMLElement} container - コンテナ要素
     * @param {string} message - メッセージ
     * @param {string} icon - アイコン（絵文字）
     */
    showEmptyState(container, message, icon = '📦') {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
    },

    /**
     * デバウンス関数
     * @param {Function} func - 実行する関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} デバウンスされた関数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// グローバルに公開
window.UI = UI;
