# 🐾 mofumofu (もふもふ)

> **「薄く、軽く、速く、そして安全に」が絶対正義。**
> 不安定なネイティブFFIや、数値しか渡せない旧世代のWasm（wasm32-unknown-unknown単体など）の限界を完全打破。
> Wasm Component Model（WIT）を全面採用し、Rust / Go / Python などの多言語ロジックとWebエコシステムを真に融合・トランスパイルする、Bunベースの次世代最軽量コンポーネント・テンプレートエンジン。

---

## 💡 1. 基本思想＆コア・コンセプト（Core Philosophy）

既存のフロントエンドフレームワークは、機能全部入り（フルスタック化）による「ランタイムの肥大化」「バンドルサイズの増加」「学習コストの爆発」という三重苦に陥っています。``mofumofu`` はこの問題を構造から解決するために誕生しました。

### 🧩 1.1 マイクロコア ＋ 完全疎結合プラグインアーキテクチャ
コアエンジン（``mofumofu-core``）は以下の最小限の機能しか持ちません。
- テンプレート（HTML）の静的解析および依存関係の抽出
- メイン言語（JavaScript / TypeScript）の標準実行環境
- コンポーネント間のデータ受け渡し（単方向Props / 双方向Binding）の基盤

状態管理（Store）、シングルページアプリケーション（SPA）ルーティング（Router）、サーバー駆動連携（Server）といった周辺機能は、すべて独立した外部プラグイン（例: ``mofumofu/store``, ``mofumofu/router``）として完全分離。Bunの強力な静的解析とツリーシェイキング（Tree Shaking）により、利用していないコードは最終コンパイル成果物に1ビットも混入しません。

### 🌍 1.2 Wasm Component Modelの全面採用による「真のマルチパラダイム」
1つの ``.mofu`` 単一ファイルコンポーネント（SFC）の中で、開発者は自分の最も得意な、あるいは処理に最適な言語（Rust, Go, Python, TS, JS）のスタイルを選んでロジックを記述できます。
従来のWasmのように「数値のポインタしかやり取りできない」といった不自由はありません。**Wasm Interface Type（WIT）** を型・インターフェースの基盤として全面採用することで、言語の壁を越えて「文字列（String）」「構造体（Struct / Object）」「配列（List）」といった複雑な高レイヤデータを、安全かつオーバーヘッドなしで相互に受け渡すことが可能になりました。

### 🔄 1.3 フロント・バック共通のポータビリティ（Universal Binary）
コンパイラが生成するWIT準拠のWasmコンポーネントは、環境を問いません。
- **サーバーサイド（SSR環境）:** Bun内蔵のV8エンジン上でネイティブスピード実行。
- **ブラウザサイド（クライアント動的処理）:** ブラウザのWasmランタイム上で全く同じバイナリがそのまま動作。

これまでのフレームワークのように「サーバー用コード」と「クライアント用コード」を二重管理するストレスから開発者を完全に解放します。

---

## 🛠️ 2. アーキテクチャ＆コンパイラ戦略（Deep Dive）

``mofumofu`` の最大の特徴は、開発者がだるい環境構築（Cargoの設定、Goのコンパイルオプション、WITファイルの記述、バインディングの手動生成など）を一切行う必要がないという点です。コンパイラ（``mofumofu build``）がすべてを隠蔽し、裏側で自動調律します。

### 🔄 2.1 詳細コンパイル・パイプライン

``.mofu`` ファイルが検出されてから、実行可能なVanilla JS / Wasmへと昇華されるまでの全内部プロセスです。

```
[ ユーザーソース: .mofu コンポーネント ] (SFC)
  │
  ├── 1. コアパーサーによる解体
  │     ├── <template> ──────➔ 【脱・仮想DOMパイプライン】へ
  │     ├── <script lang="..."> ➔ 【Wasm/ロジックビルドパイプライン】へ
  │     └── <style> ──────────➔ スコープ付きCSSへの変換、CSSバンドルへ
  │
  ├── 2. 【Wasm/ロジックビルドパイプライン】
  │     ├── lang="ts"/"js" ───➔ そのままBunランタイム/ローダーへ（最速パス）
  │     └── lang="rust" / "go" / "py"
  │            │
  │            ├── (a) AST解析により、外部公開（export / #[no_mangle]）された関数・変数を抽出
  │            ├── (b) 関数の引数・返り値の型情報をパースし、/mofu/builder/interface.wit を自動生成
  │            ├── (c) 裏側で `wit-bindgen` を子プロセスとして自動実行
  │            ├── (d) 各言語が解釈できるGlueコード（Rustのマクロ、Goのバインディング）を /mofu/builder/ 内に展開
  │            ├── (e) 各言語のコンパイラ（cargo build --target=wasm32-wasip1 や go build）を最適化オプション付きで実行
  │            └── (f) 生成された .wasm バイナリを鏡像ディレクトリ /mofu/build/ に集約
  │
  ├── 3. 【脱・仮想DOMパイプライン】
  │     └── テンプレート内の reactive 変数（{ user.name } など）の依存関係マップ（Dependency Graph）を構築。
  │         仮想DOMを使わず、値が変更された瞬間に該当のDOMノードだけをピンポイントで書き換える
  │         Vanilla JS（例: text_node.data = ...）のネイティブDOM操作コードを自動生成。
  │
  └── 4. パス自動書き換え（Linker Phase）
        └── 元のソースにある「import { ... } from "analytics.go"」や、インラインの <script lang="rust"> の呼び出しを、
            /mofu/build/ 内の Wasmバイナリをロードする「最薄JSローダー（Wrapper）」へと透過的にリダイレクト。
```

### 💎 2.2 異言語間を跨ぐLSP（Language Server Protocol）の仕組み
``mofumofu`` の開発体験（DX）を最高峰に引き上げているのが、リアルタイム型調律LSPです。
コンパイラがバックグラウンドでコードの変更を監視（Watch）し、関数定義から ``interface.wit`` を即座に更新・自動同期します。このLSPが仲介役となることで、エディタ（VSCodeなど）上では以下のような超次元のサポートが有効になります。
- JavaScript / TypeScript 側から、RustやGoの関数を呼び出す際、引数の型やオブジェクトの構造がツールチップで完全に型補完される。
- 逆に、RustやGoファイル側でも、WITを介してエクスポートすべき形状が静的に保証され、エディタ赤線でエラーがコンパイル前に可視化される。

---

## 📝 3. コア仕様＆データ受け渡し（Data Binding Deep Dive）

コンポーネント間のデータ受け渡しは、システム全体の堅牢性を担保するために「コア機能」として厳格に仕様化されています。「単方向の引き渡し」か「双方向の同期」かを開発者がコードの見た目で瞬時に判別できるよう設計されています。

### ⚡ 3.1 伝播構文の完全ルール

| 構文 | データの流れ | 内部動作メカニズム | 主なユースケース |
| :--- | :--- | :--- | :--- |
| ``text=`{value}`` | **親 ➔ 子**<br>（単方向） | 親コンポーネントの変数の変更を検知し、子コンポーネントのPropsオブジェクトへトップダウンで再代入する命令を生成。子から親への逆流はコンパイルエラーとして遮断。 | 静的なテキスト情報、環境設定値、初期状態の引き渡し、デザイン定義のスタイルクラス |
| ``bind=`{variable}`` | **親 ⇄ 子**<br>（双方向） | 親の変数と子の内部変数を、コンパイラが生成する「双方向アクセサ（Getter/Setter付きシグナル関数）」で結合。どちらかが書き換わると即座に他方も同期書き換えされる。 | フォームの各種インプット（テキスト・チェックボックス）、モーダルやドロワーの開閉状態管理、リアルタイム同期を要する数値 |

### ⚙️ 3.2 設定ファイル (``mofumofu.setting.yml``)
コンパイラやLSPがプロジェクトをスキャンする際、不要な言語ツールチェーンの解析によってビルドが低下するのを防ぐため、使用する言語プラグインを設定ファイルでオプトイン（明示的有効化）します。

```yaml
# mofumofu.setting.yml
project_name: "my-hyper-app"
engine_version: "1.0.0"

# 必要な言語プラグインのみを有効化してビルド時間を極限まで削減
plugins:
  - "mofumofu/plugin-rust"
  - "mofumofu/plugin-go"
  - "mofumofu/plugin-python"
```

---

## 🎨 4. コード実例（SFC ＆ 外部インポートの協調）

### 🌟 4.1 ハイブリッド・メインコンポーネント (``src/page/home/index.mofu``)
インラインのガチRustロジックと、外部Goモジュールのダイレクトインポート、およびPython風インデント構文の子コンポーネントが1つの画面内で美しく共存する例です。

```html
<template>
  <div class="app-container">
    <header>
      <h1>こんにちは、{ user.name } (権限: { user.role }) さん</h1>
    </header>

    <main>
      <TaxCalculator text="標準税率計算機" bind={ current_price } />
      
      <div class="result-box">
        <p>インラインRustによる即時計算結果: { add_tax(current_price) } 円</p>
      </div>
    </main>
  </div>
</template>

<script lang="rust">
  // コンポーネント固有の超高速化したい計算ロジックはインラインでRustガチ書き
  // WITを通じて、JS側の数値がそのままRustのi32として降ってくる
  #[no_mangle]
  pub fn add_tax(price: i32) -> i32 {
      if price <= 0 {
          return 0;
      }
      (price as f64 * 1.1) as i32
  }
</script>

<script>
  // 共通ロジックや巨大なデータ解析処理は、外部のGoファイルをそのまま直インポート！
  import { fetchUserData } from "../../parts/analytics.go";
  
  // Go側で定義された「User型構造体」が、WITバインディング層を介してJSのクリーンなObjectとして受け取れる
  let user = fetchUserData();
  let current_price = 1000;
</script>

<style type="css">
  .app-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  }
  .result-box {
    margin-top: 15px;
    padding: 12px;
    background: #eef9f5;
    border-left: 4px solid #10b981;
  }
</style>
```

---

## 📂 5. ディレクトリ構造（環境の完全隠蔽）

ユーザーが触るクリーンなソースコード領域（``src/``）と、ツールチェーンや中間生成ファイルを隔離する領域（``mofu/``）を完全に二分化。複雑性を「完全隠蔽」します。

```text
my-mofu-app/
├── mofumofu.setting.yml      (プロジェクトの全体設定プラグイン定義)
├── src/                      (★ユーザーが自由に開発するピュアなソース領域)
│   ├── index.mofu            (メインコンポーネント)
│   ├── components/
│   │   └── TaxCalculator.mofu (Python風インデントの子コンポーネント)
│   └── parts/
│       └── analytics.go      (生ガチのGo言語データ処理ロジックコード)
│
└── mofu/                     (💥 mofumofuコンパイラが自動管理する隠しブラックボックス領域)
    ├── builder/              (mofumofu add で自動調律・展開される環境)
    │   ├── interface.wit     (コードのAST解析からコンパイラが自動抽出し集約したWIT型定義)
    │   ├── rust/             (Cargo.toml ＆ wit-bindgenが自動生成したRust用Glueコード群)
    │   └── go/               (go.mod ＆ 自動生成されたGo用バインディングコード群)
    └── build/                (mofumofu build コマンドによって出力されるマルチランタイム実行成果物)
        ├── src/
        │   └── parts/
        │       ├── analytics.wasm (WIT Component Model規格に準拠した高圧縮Wasmバイナリ)
        │       └── analytics.js   (Bun(SSR)やブラウザで上のWasmを瞬時に叩くための最薄ローダー)
        └── mofu-runtime.js   (脱・仮想DOMコードとWasmローダーを統合する超軽量オーケストレーターJS)
```

---

## 🚀 6. CLIコマンドと魔法のライフサイクル

開発者は、バックグラウンドのWasmコンパイラの呼び出し、ターゲットオプションの指定、バインディングの手動生成コマンドなどを**1ミリも意識する必要はありません。** 4つの直感的なコマンドがライフサイクルをすべて回します。

```bash
# 1. プロジェクトの完全初期化
# カレントディレクトリに必要な設定ファイル(setting.yml)と基本雛形を瞬時に生成します。
$ mofumofu init -y

# 2. 開発言語プラグインの魔法のワンクリック追加
# 指定された言語のローカルツールチェーン環境（cargo/go等）を検出し、
# 隔離領域(/mofu/builder/)にWITバインディング環境一式を全自動でセットアップ。
$ mofumofu add rust go python

# 3. 爆速の超並列差分ビルド付き「開発用ローカルサーバー」の起動
# ファイルの変更をミリ秒単位でファイルシステム監視（Watch）。
# コード変更を検知すると：関数シグネチャからWITを自動更新 ➔ 該当コンポーネントだけを差分Wasmビルド ➔ ブラウザへ即座にホットリロード（HMR）
$ mofumofu run dev

# 4. 本番デプロイ用最適化ビルド ＆ サーバー起動
# デッドコードストリップ、Wasmバイナリ最適化(wasm-opt)を最大まで適用し、
# 最小バンドルサイズへと凝縮して本番環境をスタンドアップ。
$ mofumofu build .
$ mofumofu run start
```

---

## 🎯 7. 結論：脳汁が出るほどモダンな次世代アーキテクチャ

「``.d.ts`` を生成してお茶を濁す」ような表面上の連携ではありません。

「**ユーザーのソースコードからWasm Interface Type（WIT）をコンパイラが全自動で抽出し、Wasm Component ModelというWeb標準規格をベースに、複数言語のロジックをマルチランタイムで強結合させる。**」

WebAssemblyが本来持っていた最強のポテンシャルを、「テンプレートエンジン」という全開発者が毎日触る最も身近な道具として100%引き出す、これ以上ない最高に美しく研ぎ澄まされた設計図です。

```
