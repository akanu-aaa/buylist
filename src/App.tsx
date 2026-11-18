import React, { useState, useEffect } from 'react';
import './App.css';

interface Item {
  id: number;
  text: string;
  category: string;
}

const DEFAULT_CATEGORIES = ['スーパー', 'ドラッグストア', '本屋'];

export default function App() {
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

  useEffect(() => {
    localStorage.setItem('shopCategories_v1', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('toBuyList_v3', JSON.stringify(toBuyList));
  }, [toBuyList]);

  useEffect(() => {
    localStorage.setItem('boughtList_v3', JSON.stringify(boughtList));
  }, [boughtList]);
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
  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="app-header">
          <div className="header-title-area">
            <h1>お買い物メモ</h1>
            <span className="current-view-tag">{currentView}</span>
          </div>
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="メニューを開く"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </header>

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
