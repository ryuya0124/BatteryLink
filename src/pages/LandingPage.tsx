import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowRight, Battery, Check, KeyRound, LayoutDashboard, RefreshCw, ShieldCheck, Smartphone, Tablet, Zap } from "lucide-react";
import "./LandingPage.css";

const devices = [
  { name: "My iPhone", detail: "充電中", level: 82, icon: Smartphone },
  { name: "iPad", detail: "バッテリー使用中", level: 64, icon: Tablet },
  { name: "Android", detail: "バッテリー使用中", level: 38, icon: Smartphone },
];

export default function LandingPage() {
  return (
    <div className="landing min-h-screen">
      <SEO canonical="/" />
      <a className="lp-skip" href="#main">本文へスキップ</a>
      <div className="lp-wrap">
        <header className="lp-nav">
          <Link to="/" className="lp-brand" aria-label="BatterySync ホーム"><span className="lp-brand-icon"><Battery size={28} /></span>BatterySync</Link>
          <nav className="lp-nav-links" aria-label="メインナビゲーション">
            <a href="#features">できること</a><a href="#start">使い方</a>
            <Link to="/login" className="lp-button lp-button-small">ログイン<ArrowRight size={16} /></Link>
          </nav>
        </header>
        <main id="main">
          <section className="lp-hero" aria-labelledby="hero-title">
            <div>
              <p className="lp-eyebrow"><span className="lp-dot" />YOUR DEVICES. ONE PLACE.</p>
              <h1 id="hero-title">充電のこと、<br /><span>ひと目でわかる。</span></h1>
              <p className="lp-description">スマホも、タブレットも。<br />デバイスから届いたバッテリー情報をひとつの画面に。充電のタイミングが、もっとわかりやすく。</p>
              <div className="lp-actions"><Link to="/login" className="lp-button">無料で使い始める<ArrowRight size={18} /></Link><a href="#start" className="lp-button lp-button-quiet">使い方を見る</a></div>
              <p className="lp-note">Auth0でログイン · デバイス側の送信設定が必要です</p>
            </div>
            <div className="lp-preview" aria-label="バッテリー管理画面のサンプル。実際のデバイス情報ではありません。">
              <div className="lp-preview-top"><span>マイデバイス</span><span className="lp-preview-label">表示サンプル</span></div>
              <div className="lp-preview-summary"><strong>3</strong><span>台を、ひとつの画面で。</span></div>
              {devices.map(({name, detail, level, icon: Icon}) => <div className="lp-device" key={name}>
                <div className="lp-device-header"><span className="lp-device-icon"><Icon size={22} /></span><div className="lp-device-name">{name}<small>{detail}</small></div><div className="lp-device-value">{level}<small>%</small></div></div>
                <div className="lp-battery-track" aria-hidden="true"><div className="lp-battery-fill" style={{width: `${level}%`}} /></div>
              </div>)}
              <div className="lp-preview-foot"><RefreshCw size={13} />受信した最新の状態をまとめて確認</div>
            </div>
          </section>
          <div className="lp-proof"><p>デバイスをつなぐ、シンプルな仕組み。</p><div className="lp-proof-items"><span><Check size={16} />ブラウザで確認</span><span><KeyRound size={16} />APIでデータ送信</span><span><ShieldCheck size={16} />Auth0認証</span></div></div>
          <section className="lp-section" id="features" aria-labelledby="features-title">
            <div className="lp-section-heading"><div><p className="lp-eyebrow">LESS CHECKING. MORE CLARITY.</p><h2 id="features-title">それぞれの残量を、<br />探しにいかなくていい。</h2></div><p>手元にない端末の状態も、ブラウザから。<br />日々の確認に必要な情報を、すっきりまとめます。</p></div>
            <div className="lp-features">
              <article className="lp-feature"><LayoutDashboard size={27} /><h3>全体が見えるダッシュボード</h3><p>残量・充電状態・最終更新を一覧で確認。検索やフィルターで、気になるデバイスを見つけられます。</p></article>
              <article className="lp-feature"><Zap size={27} /><h3>いつもの自動化とつながる</h3><p>ショートカットなどからAPIへバッテリー情報を送信。端末ごとの自動化を、ひとつの管理先につなげます。</p></article>
              <article className="lp-feature"><ShieldCheck size={27} /><h3>アクセスも、自分で管理</h3><p>ログインとデータ送信用のAPIキーを分離。キーの名前を整理し、不要になったら管理画面から無効化できます。</p></article>
            </div>
          </section>
          <section className="lp-start" id="start" aria-labelledby="start-title">
            <div><p className="lp-eyebrow">GET CONNECTED</p><h2 id="start-title">最初の1台から、<br />始めてみよう。</h2><p>アカウントを作成したら、デバイスを登録。<br />APIを使った送信設定で準備完了です。</p><Link to="/login" className="lp-button">BatterySyncを始める<ArrowRight size={18} /></Link></div>
            <ol className="lp-steps">
              <li><span className="lp-step-number">01</span><div><h3>ログインして、デバイスを登録</h3><p>わかりやすい名前を付けて、管理する端末を追加します。</p></div></li>
              <li><span className="lp-step-number">02</span><div><h3>APIキーを発行して、送信を設定</h3><p>APIキーとデバイスUUIDを使い、ショートカットなどからデータを送ります。</p></div></li>
              <li><span className="lp-step-number">03</span><div><h3>ダッシュボードで状態をチェック</h3><p>届いたデータを一覧で確認。自動更新を有効にすれば、表示も定期的に更新されます。</p></div></li>
            </ol>
          </section>
        </main>
        <footer className="lp-footer"><Link to="/" className="lp-brand"><Battery size={22} />BatterySync</Link><nav className="lp-footer-links" aria-label="フッターナビゲーション"><Link to="/privacy">プライバシーポリシー</Link><Link to="/terms">利用規約</Link></nav><small>© {new Date().getFullYear()} BatterySync</small></footer>
      </div>
    </div>
  );
}
