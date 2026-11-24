import React, { useState, useEffect } from 'react';
import './App.css';

interface Item {
  id: number;
  text: string;
  category: string;
}

interface SavedList {
  id: number;
  title: string;
  createdAt: string;
  toBuyItems: Item[];
  boughtItems: Item[];
}

const DEFAULT_CATEGORIES = ['スーパー', 'ドラッグストア', '本屋'];

export default function App() {
  // 画面切り替え: 'home'（トップページ：リスト選択画面） | 'editor'（お買い物メモ編集画面）
  const [screen, setScreen] = useState<'home' | 'editor'>('home');
  const [activeListTitle, setActiveListTitle] = useState<string>('現在のお買い物メモ');
  const [activeListId, setActiveListId] = useState<number | null>(null);

  // 未保存の作成中メモがあるかどうか（一度でも保存したら false にする）
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState<boolean>(() => {
    const savedFlag = localStorage.getItem('hasUnsavedDraft_v1');
    if (savedFlag !== null) {
      return JSON.parse(savedFlag);
    }
    return true;
  });

  const [inputText, setInputText] = useState<string>('');

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('shopCategories_v1');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('スーパー');
  const [currentView, setCurrentView] = useState<string>('すべて');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const [toBuyList, setToBuyList] = useState<Item[]>(() => {
    const saved = localStorage.getItem('toBuyList_v3');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, text: '牛乳', category: 'スーパー' },
          { id: 2, text: 'シャンプー', category: 'ドラッグストア' },
          { id: 3, text: '料理雑誌', category: '本屋' },
        ];
  });

  const [boughtList, setBoughtList] = useState<Item[]>(() => {
    const saved = localStorage.getItem('boughtList_v3');
    return saved
      ? JSON.parse(saved)
      : [{ id: 4, text: '食パン', category: 'スーパー' }];
  });

  const [savedLists, setSavedLists] = useState<SavedList[]>(() => {
    const saved = localStorage.getItem('savedShoppingLists_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveTitleInput, setSaveTitleInput] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('shopCategories_v1', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('toBuyList_v3', JSON.stringify(toBuyList));
  }, [toBuyList]);

  useEffect(() => {
    localStorage.setItem('boughtList_v3', JSON.stringify(boughtList));
  }, [boughtList]);

  useEffect(() => {
    localStorage.setItem('savedShoppingLists_v1', JSON.stringify(savedLists));
  }, [savedLists]);

  useEffect(() => {
    localStorage.setItem('hasUnsavedDraft_v1', JSON.stringify(hasUnsavedDraft));
  }, [hasUnsavedDraft]);

  // --- トップページからの画面遷移 ---

  // 1. 現在編集中のリストを開く
  const handleOpenCurrentDraft = () => {
    setCurrentView('すべて');
    setScreen('editor');
  };

  // 2. 新しいリストを作成する
  const handleCreateNewList = () => {
    const hasCurrentItems = toBuyList.length > 0 || boughtList.length > 0;
    if (
      hasUnsavedDraft &&
      hasCurrentItems &&
      activeListId === null &&
      !window.confirm(
        '現在作成中のリストがクリアされます。新しいリストを作成しますか？'
      )
    ) {
      return;
    }
    setToBuyList([]);
    setBoughtList([]);
    setActiveListId(null);
    setActiveListTitle('新しいお買い物リスト');
    setHasUnsavedDraft(true);
    setCurrentView('すべて');
    setScreen('editor');
  };

  // 3. 保存済みリストを選択して開く
  const handleOpenSavedList = (saved: SavedList) => {
    const timestamp = Date.now();
    const clonedToBuy = saved.toBuyItems.map((item, idx) => ({
      ...item,
      id: timestamp + idx,
    }));
    const clonedBought = saved.boughtItems.map((item, idx) => ({
      ...item,
      id: timestamp + 10000 + idx,
    }));

    setToBuyList(clonedToBuy);
    setBoughtList(clonedBought);
    setActiveListId(saved.id);
    setActiveListTitle(saved.title);
    setHasUnsavedDraft(false);
    setCurrentView('すべて');
    setScreen('editor');
  };

  // 保存済みリストの削除
  const handleDeleteSavedList = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('この保存済みリストを削除しますか？')) return;
    setSavedLists(savedLists.filter((list) => list.id !== id));
    if (activeListId === id) {
      setActiveListId(null);
      setActiveListTitle('現在のお買い物メモ');
    }
  };

  // --- リスト編集画面の操作 ---

  const handleSelectView = (view: string) => {
    setCurrentView(view);
    if (view !== 'すべて') {
      setSelectedCategory(view);
    }
    setIsMenuOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (categories.includes(trimmed)) {
      alert('すでに登録されているお店です');
      return;
    }

    setCategories([...categories, trimmed]);
    setSelectedCategory(trimmed);
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = categories.filter((c) => c !== catToDelete);
    setCategories(updated);

    if (currentView === catToDelete) {
      setCurrentView('すべて');
    }
    if (selectedCategory === catToDelete && updated.length > 0) {
      setSelectedCategory(updated[0]);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newItem: Item = {
      id: Date.now(),
      text: trimmed,
      category: selectedCategory,
    };

    setToBuyList([newItem, ...toBuyList]);
    setInputText('');
  };

  const moveToBought = (item: Item) => {
    setToBuyList(toBuyList.filter((i) => i.id !== item.id));
    setBoughtList([item, ...boughtList]);
  };

  const moveToBuy = (item: Item) => {
    setBoughtList(boughtList.filter((i) => i.id !== item.id));
    setToBuyList([item, ...toBuyList]);
  };

  const deleteBoughtItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBoughtList(boughtList.filter((i) => i.id !== id));
  };

  const clearDisplayedBought = () => {
    if (currentView === 'すべて') {
      setBoughtList([]);
    } else {
      setBoughtList(boughtList.filter((item) => item.category !== currentView));
    }
  };

  // 保存モーダルを開く
  const openSaveModal = () => {
    if (activeListId !== null && activeListTitle) {
      setSaveTitleInput(activeListTitle);
    } else {
      const now = new Date();
      const defaultTitle = `${now.getMonth() + 1}/${now.getDate()}のお買い物${
        currentView !== 'すべて' ? `（${currentView}）` : ''
      }`;
      setSaveTitleInput(defaultTitle);
    }
    setIsSaveModalOpen(true);
  };

  // リストの保存実行（新規保存 or 上書き保存）
  const handleSaveCurrentList = (e: React.FormEvent) => {
    e.preventDefault();
    const title = saveTitleInput.trim() || '無題のリスト';

    const targetToBuy =
      currentView === 'すべて'
        ? [...toBuyList]
        : toBuyList.filter((item) => item.category === currentView);

    const targetBought =
      currentView === 'すべて'
        ? [...boughtList]
        : boughtList.filter((item) => item.category === currentView);

    if (targetToBuy.length === 0 && targetBought.length === 0) {
      alert('保存するアイテムがありません');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (activeListId !== null && currentView === 'すべて') {
      // 既存の保存リストを上書き更新
      const updatedLists = savedLists.map((list) =>
        list.id === activeListId
          ? {
              ...list,
              title,
              createdAt: `${formattedDate} 更新`,
              toBuyItems: targetToBuy,
              boughtItems: targetBought,
            }
          : list
      );
      setSavedLists(updatedLists);
      setActiveListTitle(title);
    } else {
      // 新しく保存リストに追加
      const newId = Date.now();
      const newSavedList: SavedList = {
        id: newId,
        title,
        createdAt: formattedDate,
        toBuyItems: targetToBuy,
        boughtItems: targetBought,
      };
      setSavedLists([newSavedList, ...savedLists]);
      if (currentView === 'すべて') {
        setActiveListId(newId);
        setActiveListTitle(title);
      }
    }

    // 一度でも保存したら、トップページの「作成中のメモ（編集中）」を非表示にする
    setHasUnsavedDraft(false);
    setIsSaveModalOpen(false);
  };

  const displayedToBuy =
    currentView === 'すべて'
      ? toBuyList
      : toBuyList.filter((item) => item.category === currentView);

  const displayedBought =
    currentView === 'すべて'
      ? boughtList
      : boughtList.filter((item) => item.category === currentView);

  const getCountByCategory = (view: string) => {
    if (view === 'すべて') return toBuyList.length;
    return toBuyList.filter((item) => item.category === view).length;
  };

  // ==========================================
  // 1. トップページ（リスト選択画面）
  // ==========================================
  if (screen === 'home') {
    return (
      <div className="app-wrapper">
        <div className="app-container">
          <header className="home-header">
            <h1>お買い物メモ</h1>
            <p className="home-subtitle">表示するリストを選択してください</p>
          </header>

          <main className="home-main">
            {/* 新規作成ボタン */}
            <button
              type="button"
              className="new-list-hero-btn"
              onClick={handleCreateNewList}
            >
              <span className="plus-icon">＋</span>
              <span>新しいお買い物リストを作る</span>
            </button>

            {/* 未保存の作成中メモがある場合のみ表示 */}
            {hasUnsavedDraft && (
              <section className="home-section">
                <h2 className="home-section-title">作成中のメモ</h2>
                <div
                  className="select-list-card current-draft-card"
                  onClick={handleOpenCurrentDraft}
                >
                  <div className="select-card-top">
                    <div className="select-card-title-row">
                      <span className="status-pill draft-pill">編集中</span>
                      <h3 className="select-card-title">{activeListTitle}</h3>
                    </div>
                    <span className="open-arrow">開く ＞</span>
                  </div>
                  <div className="select-card-meta">
                    <span>買うもの: {toBuyList.length}件</span>
                    <span>／</span>
                    <span>買ったもの: {boughtList.length}件</span>
                  </div>
                  {toBuyList.length > 0 && (
                    <p className="select-card-preview">
                      {toBuyList
                        .slice(0, 5)
                        .map((i) => i.text)
                        .join('、')}
                      {toBuyList.length > 5 ? ' ...' : ''}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* 保存済みリスト一覧セクション */}
            <section className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">保存したリスト</h2>
                <span className="badge">{savedLists.length}件</span>
              </div>

              {savedLists.length === 0 ? (
                <div className="list-card">
                  <p className="empty-message">
                    保存されたリストはまだありません。
                    <br />
                    リスト画面右上の「保存」ボタンから登録できます。
                  </p>
                </div>
              ) : (
                <ul className="saved-select-list">
                  {savedLists.map((saved) => (
                    <li
                      key={saved.id}
                      className="select-list-card"
                      onClick={() => handleOpenSavedList(saved)}
                    >
                      <div className="select-card-top">
                        <div>
                          <h3 className="select-card-title">{saved.title}</h3>
                          <span className="select-card-date">
                            {saved.createdAt}
                          </span>
                        </div>
                        <div className="select-card-right">
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={(e) => handleDeleteSavedList(saved.id, e)}
                          >
                            削除
                          </button>
                          <span className="open-arrow">開く ＞</span>
                        </div>
                      </div>

                      <div className="select-card-meta">
                        <span>買うもの: {saved.toBuyItems.length}件</span>
                        <span>／</span>
                        <span>買ったもの: {saved.boughtItems.length}件</span>
                      </div>

                      {(saved.toBuyItems.length > 0 ||
                        saved.boughtItems.length > 0) && (
                        <p className="select-card-preview">
                          {[...saved.toBuyItems, ...saved.boughtItems]
                            .slice(0, 6)
                            .map((i) => i.text)
                            .join('、')}
                          {saved.toBuyItems.length + saved.boughtItems.length >
                          6
                            ? ' ...'
                            : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. お買い物メモ編集画面
  // ==========================================
  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="app-header">
          <div className="header-left-group">
            <button
              type="button"
              className="back-home-btn"
              onClick={() => setScreen('home')}
              aria-label="リスト選択へ戻る"
            >
              ＜ 一覧へ
            </button>
            <div className="header-title-area">
              <h1>{activeListTitle}</h1>
              <span className="current-view-tag">{currentView}</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="header-action-btn save-btn"
              onClick={openSaveModal}
            >
              保存
            </button>
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="お店切り替えメニューを開く"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </header>

        {/* ハンバーガーメニュー（お店切り替え） */}
        {isMenuOpen && (
          <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}>
            <nav className="drawer-menu" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h2>表示するお店を選択</h2>
                <button
                  type="button"
                  className="close-menu-btn"
                  onClick={() => setIsMenuOpen(false)}
                >
                  閉じる
                </button>
              </div>

              <ul className="menu-list">
                <li>
                  <button
                    type="button"
                    className={`menu-item-btn ${
                      currentView === 'すべて' ? 'active' : ''
                    }`}
                    onClick={() => handleSelectView('すべて')}
                  >
                    <span>すべて（全体像）</span>
                    <span className="menu-count">
                      {getCountByCategory('すべて')}件
                    </span>
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat} className="menu-list-row">
                    <button
                      type="button"
                      className={`menu-item-btn ${
                        currentView === cat ? 'active' : ''
                      }`}
                      onClick={() => handleSelectView(cat)}
                    >
                      <span className="menu-cat-name">{cat}</span>
                      <span className="menu-count">
                        {getCountByCategory(cat)}件
                      </span>
                    </button>
                    {!DEFAULT_CATEGORIES.includes(cat) && (
                      <button
                        type="button"
                        className="cat-delete-btn"
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        aria-label={`${cat}を削除`}
                      >
                        削除
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="add-category-section">
                <h3>お店を追加する</h3>
                <form
                  className="add-category-form"
                  onSubmit={handleAddCategory}
                >
                  <input
                    type="text"
                    className="category-input"
                    placeholder="例：100均、パン屋"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                  />
                  <button type="submit" className="category-add-btn">
                    追加
                  </button>
                </form>
              </div>
            </nav>
          </div>
        )}

        {/* リスト保存モーダル */}
        {isSaveModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsSaveModalOpen(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>リストを保存</h2>
                <button
                  type="button"
                  className="close-menu-btn"
                  onClick={() => setIsSaveModalOpen(false)}
                >
                  閉じる
                </button>
              </div>
              <p className="modal-desc">
                現在表示中（<strong>{currentView}</strong>）の買うもの{' '}
                {displayedToBuy.length}件・買ったもの {displayedBought.length}
                件を保存します。
              </p>
              <form className="save-form" onSubmit={handleSaveCurrentList}>
                <label className="modal-label" htmlFor="save-title">
                  リスト名
                </label>
                <input
                  id="save-title"
                  type="text"
                  className="modal-input"
                  placeholder="例：週末のまとめ買い、カレーの材料"
                  value={saveTitleInput}
                  onChange={(e) => setSaveTitleInput(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setIsSaveModalOpen(false)}
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="modal-submit-btn">
                    保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <form className="input-form" onSubmit={handleAddItem}>
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="お店のジャンルを選択"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="memo-input"
            placeholder="買うものを入力..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="add-button">
            追加
          </button>
        </form>

        <main className="lists-area">
          <section className="list-card">
            <div className="list-header">
              <h2>1. 買うものリスト</h2>
              <span className="badge">{displayedToBuy.length}件</span>
            </div>
            {displayedToBuy.length === 0 ? (
              <p className="empty-message">買うものはありません</p>
            ) : (
              <ul className="item-list">
                {displayedToBuy.map((item) => (
                  <li
                    key={item.id}
                    className="list-item to-buy-item"
                    onClick={() => moveToBought(item)}
                  >
                    <span className="checkbox-circle"></span>
                    <span className="item-text">{item.text}</span>
                    {currentView === 'すべて' && (
                      <span className="category-pill">{item.category}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="list-card bought-card">
            <div className="list-header">
              <h2>2. 買ったものリスト</h2>
              {displayedBought.length > 0 && (
                <button
                  className="clear-all-btn"
                  onClick={clearDisplayedBought}
                >
                  すべて削除
                </button>
              )}
            </div>
            {displayedBought.length === 0 ? (
              <p className="empty-message">買ったものはありません</p>
            ) : (
              <ul className="item-list">
                {displayedBought.map((item) => (
                  <li
                    key={item.id}
                    className="list-item bought-item"
                    onClick={() => moveToBuy(item)}
                  >
                    <span className="checkbox-checked">済</span>
                    <span className="item-text">{item.text}</span>
                    {currentView === 'すべて' && (
                      <span className="category-pill bought-pill">
                        {item.category}
                      </span>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => deleteBoughtItem(item.id, e)}
                      aria-label="削除"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}