# My Dashboard Frontend

A comprehensive Vue 3 dashboard application built with modern web technologies, featuring personal productivity tools, news feeds, transport information, and more.

## Features

### Authentication System
- JWT-based authentication with secure token storage
- Persistent login state across browser sessions
- User profile management (avatar upload, username/password updates)
- Automatic route protection for dashboard access

### Core Modules

#### Task Management
- Todo list with completion tracking
- Mobile-responsive design with grid/list views
- Auto-scroll to today's date in mobile view

#### Weather Information
- Current weather display with location-based data
- Responsive weather cards and forecasts

#### News Feeds
- **HK News**: Hong Kong news aggregation
- **JP News**: Japan news feed integration
- Real-time news updates and categorization

#### Personal Diary
- Rich text journaling capabilities
- Date-based entry organization
- Search and filter functionality

#### Financial Tracking
- Asset portfolio monitoring
- Weight/fitness tracking charts
- Interactive data visualization

#### Transport Information
- **MTR Station Info**: Real-time train information
- **KMB Bus Routes**: Kowloon Motor Bus schedule lookup
- ETA calculations and route comparisons
- Multi-modal transport planning

#### Entertainment
- **TV Schedule**: Television program guide
- Program search and favorites
- Channel and time-based filtering

## Tech Stack

### Frontend Framework
- **Vue 3** with Composition API and `<script setup>` syntax
- **Pinia** for state management (Vuex successor)
- **Vue Router 4** with hash history for navigation

### UI & Styling
- **Ant Design Vue 4.x** component library
- **Tailwind CSS** utility-first styling
- Custom SCSS for enhanced theming
- Responsive design with mobile-first approach

### Data Visualization
- **Chart.js** with vue-chartjs wrapper
- Interactive charts and graphs for data presentation

### Development Tools
- **Vite** build tool and development server
- **ESLint** and **Prettier** for code quality
- **Dayjs** with UTC plugin for date/time handling
- **vuedraggable** for drag-and-drop functionality

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Asset.vue       # Financial asset tracking
│   ├── Diary.vue       # Personal diary/journal
│   ├── HKNews.vue      # Hong Kong news feed
│   ├── JPNews.vue      # Japan news feed
│   ├── Kmb.vue         # Kowloon Motor Bus info
│   ├── Mtr.vue         # MTR station information
│   ├── ProgramCard.vue # TV program display card
│   ├── TvSchedule.vue  # TV schedule viewer
│   ├── Todo.vue        # Task management
│   ├── Transportation.vue # Transport comparison tool
│   ├── Weather.vue     # Weather information
│   └── Weight.vue      # Weight tracking chart
├── views/              # Page-level components
│   ├── Dashboard.vue   # Main application shell with sidebar navigation
│   ├── Login.vue       # User authentication page
│   └── Register.vue    # User registration page
├── stores/             # Pinia state management
│   └── auth.js         # Authentication state and user management
├── router/             # Vue Router configuration
│   ├── index.js        # Route definitions and basic navigation
│   └── auth-guard.js   # Authentication middleware
├── utils/              # Utility functions
│   ├── tver.js         # TV schedule data processing
│   └── intersect.js    # Intersection Observer directive for lazy loading
└── main.js             # Application entry point
```

## Key Features & Components

### Dashboard Shell
- Collapsible sidebar navigation with drag-and-drop reordering
- Responsive design (mobile-first approach)
- Dark theme sidebar with Ant Design icons
- Menu persistence using localStorage
- User avatar upload functionality

### State Management Patterns
- Centralized state using Pinia stores
- LocalStorage persistence for user preferences and auth tokens
- Reactive computed properties for derived state
- Form validation and error handling

### API Integration
- RESTful API communication via axios
- Environment-based API endpoints (local vs production)
- Authorization headers with Bearer tokens
- Error handling with Ant Design message notifications

### Routing & Navigation
- Hash-based routing for GitHub Pages compatibility
- Authentication guards preventing unauthorized dashboard access
- Redirect logic for authenticated users accessing login page
- Dynamic menu system based on component availability

## Getting Started

### Prerequisites
- Node.js (version 16 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-dashboard-frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Deployment

Deploy to GitHub Pages:
```bash
npm run deploy
```

## Configuration

### Environment Variables

The application uses environment variables for API endpoint configuration:

- `VITE_API_URL_LOCAL`: Local development API URL
- `VITE_API_URL_LIVE`: Production API URL

Create a `.env.local` file for local development:
```env
VITE_API_URL_LOCAL=http://localhost:3000/api
```

### Vite Proxy

During development, API requests are proxied through Vite:
- `/api` requests are routed to the configured API endpoint

## Styling Approach

- **Tailwind CSS** for utility-first responsive design
- **Ant Design Vue** components with custom theming
- **Scoped CSS** for component-specific styles
- **Mobile-First** responsive breakpoints (600px threshold)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Create a feature branch from `main`
2. Make your changes and ensure tests pass
3. Submit a pull request with a clear description of changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Ant Design Vue](https://antdv.com/) - UI component library
- [Pinia](https://pinia.vuejs.org/) - Intuitive, type safe store for Vue 3
---

# 繁體中文

## 簡介

一個功能齊全的 Vue 3 儀表板應用程式，採用現代網頁技術建造，提供個人生產力工具、新聞資訊、交通資訊等。

## 功能

### 認證系統
- 基於 JWT 的認證機制，配合安全的權杖儲存
- 跨瀏覽器 sessions 保持登入狀態
- 用戶個人資料管理（頭像上傳、用戶名/密碼更新）
- 自動保護儀表板路由，未登入無法訪問

### 核心模組

#### 任務管理
- 待辦事項清單，支援完成追蹤
- 響應式設計，支援格狀/清單檢視
- 行動版自動滾動至今日日期

#### 天氣資訊
- 顯示當前天氣，基於位置數據
- 響應式天氣卡片及預報

#### 新聞摘要
- **香港新聞**：香港新聞聚合
- **日本新聞**：日本新聞資訊整合
- 即時新聞更新及分類

#### 個人日誌
- 富文字日誌功能
- 按日期整理項目
- 搜尋及篩選功能

#### 理財追蹤
- 資產組合監控
- 體重/健身追蹤圖表
- 互動式數據視覺化

#### 交通資訊
- **港鐵站資訊**：實時列車資訊
- **九巴路線**：九龍巴士班次查詢
- ETA 計算及路線比較
- 多元交通規劃

#### 娛樂
- **電視節目表**：電視節目指南
- 節目搜尋及收藏
- 按頻道及時間篩選

## 技術堆疊

### 前端框架
- **Vue 3** 搭配 Composition API 及 `<script setup>` 語法
- **Pinia** 狀態管理（Vuex 接班人）
- **Vue Router 4** 使用 hash 模式導航

### UI 與樣式
- **Ant Design Vue 4.x** 元件庫
- **Tailwind CSS** 實用優先樣式
- 自訂 SCSS 增強主題
- 響應式設計，行動版優先

### 數據視覺化
- **Chart.js** 搭配 vue-chartjs 包裝
- 互動式圖表及圖形

### 開發工具
- **Vite** 構建工具及開發伺服器
- **ESLint** 及 **Prettier** 程式碼品質
- **Dayjs** 搭配 UTC 外掛處理日期/時間
- **vuedraggable** 拖放功能

## 開始使用

### 前置需求
- Node.js（建議版本 16 或以上）
- npm 或 yarn 套件管理器

### 安裝

1. 複製儲存庫：
```bash
git clone <repository-url>
cd my-dashboard-frontend
```

2. 安裝依賴：
```bash
npm install
```

### 開發

啟動開發伺服器：
```bash
npm run dev
```

應用程式將在 `http://localhost:5173` 可用（預設 Vite 連接埠）。

### 生產構建

建立生產構建：
```bash
npm run build
```

本地預覽生產構建：
```bash
npm run preview
```

### 部署

部署至 GitHub Pages：
```bash
npm run deploy
```

## 設定

### 環境變數

應用程式使用環境變數設定 API 端點：

- `VITE_API_URL_LOCAL`：本地開發 API URL
- `VITE_API_URL_LIVE`：生產環境 API URL

建立 `.env.local` 檔案用於本地開發：
```env
VITE_API_URL_LOCAL=http://localhost:3000/api
```

### Vite 代理

開發期間，API 請求透過 Vite 代理：
- `/api` 請求會路由至設定的 API 端點

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 貢獻

1. 從 `main` 建立功能分支
2. 進行修改並確保測試通過
3. 提交清晰說明變更的 Pull Request

## 授權

本專案採用 MIT 授權 - 請參閱 LICENSE 檔案了解詳情。

## 鳴謝

- [Vue.js](https://vuejs.org/) - 漸進式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 新一代前端工具
- [Ant Design Vue](https://antdv.com/) - UI 元件庫
- [Pinia](https://pinia.vuejs.org/) - 直觀、類型安全的 Vue 3 狀態管理
