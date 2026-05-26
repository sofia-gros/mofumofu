# mofuri-cli Implementation Walkthrough

Mofuriのコア機能（管理画面の保存機能、カスタムタグ対応、アセットバンドル）の実装が完了しました。

## 🛠 実装内容

### 1. 管理画面 (Admin GUI) の編集・保存機能
[src/core/server.ts](file:///a:/Project/mofuri/src/core/server.ts) に記事の読み書き用APIを追加し、`/mofuri-admin` のUIを拡張しました。
- **機能**: 記事一覧から選択してMarkdownを直接編集し、ボタン一つでローカルの [.md](file:///a:/Project/mofuri/sekkei.md) ファイルに保存できます。
- **API**: `GET /api/post-content`, `POST /api/save-post`

### 2. コンパイラのカスタムタグ対応
[src/core/compiler.ts](file:///a:/Project/mofuri/src/core/compiler.ts) に、`.tsx` コンポーネントを呼び出す仕組みを導入しました。
- **機能**: テンプレート中にある `<m-github-card user="sofia-gros" />` のようなカスタムタグを検出し、`themes/components/` または `plugins/` 内の `.tsx` ファイルを実行してHTMLを生成・置換します。
- **Bunネイティブ**: Bunの動的インポートを利用して、Reactなしで高速にコンポーネントをレンダリングします。

### 3. アセットバンドラー
[src/core/bundler.ts](file:///a:/Project/mofuri/src/core/bundler.ts) を作成し、ビルドプロセスに統合しました。
- **機能**: `public/` フォルダ内の静的アセットのコピーと、テーマ内の `style.css` の書き出しを自動化しました。

## 🚀 動作確認の手順

ユーザー様の手元で以下のコマンドを実行して動作を確認いただけます：

### プロジェクトの初期化
```bash
# 適当な空ディレクトリで実行
bun a:\Project\mofuri\bin\mofuri init
```

### 開発サーバーの起動と管理画面
```bash
bun a:\Project\mofuri\bin\mofuri dev
# ブラウザで http://localhost:3000/mofuri-admin を開く
```

### 静的ビルドの実行
```bash
bun a:\Project\mofuri\bin\mofuri build
# dist/ フォルダにHTMLとCSSが出力されることを確認
```

## 🧪 次のステップの提案
- **JSXコンポーネントの作成**: `themes/default/components/hello.tsx` などを作成し、テンプレートから `<m-hello />` で呼び出せるかテストできます。
- **プラグイン管理**: `mofuri add` コマンドの実装（GitHubからのダウンロード機能など）。
