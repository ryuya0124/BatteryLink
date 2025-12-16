import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Battery,
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Bell,
  BarChart3,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "マルチデバイス対応",
      description: "iPhone、Android、タブレットなど、複数のデバイスを一括管理",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "リアルタイム同期",
      description: "バッテリー残量をリアルタイムで確認・更新",
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "自動更新機能",
      description: "設定した間隔で自動的にバッテリー情報を更新",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "統計ダッシュボード",
      description: "全デバイスのバッテリー状態を一目で把握",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "セキュアな接続",
      description: "Auth0による安全な認証とデータ保護",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "どこからでもアクセス",
      description: "Webブラウザから、いつでもどこでも確認可能",
    },
  ];

  const steps = [
    { step: "01", title: "アカウント作成", description: "メールアドレスまたはGoogleアカウントで簡単登録" },
    { step: "02", title: "デバイスを追加", description: "管理したいデバイスの情報を登録" },
    { step: "03", title: "APIキーを取得", description: "Shortcutsオートメーション用のキーを発行" },
    { step: "04", title: "モニタリング開始", description: "ダッシュボードでバッテリー状態を管理" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Header */}
        <header className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                BatterySync
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-muted-foreground hover:text-foreground"
              >
                ログイン
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
              >
                無料で始める
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="h-4 w-4" />
              <span>全てのデバイスを一元管理</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                あなたのデバイスの
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                バッテリーを見守る
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              iPhone、Android、タブレット...
              <br className="sm:hidden" />
              複数デバイスのバッテリー残量を
              <br className="hidden sm:block" />
              リアルタイムで一元管理。
              <br className="sm:hidden" />
              もう充電切れの心配はありません。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-lg px-8 py-6 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/40"
              >
                今すぐ無料で始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto text-lg px-8 py-6 border-border/50 hover:bg-accent"
              >
                詳しく見る
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-sm text-muted-foreground mt-1">無料利用</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  ∞
                </div>
                <div className="text-sm text-muted-foreground mt-1">デバイス登録</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground mt-1">監視対応</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              必要な機能が
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                すべて揃っている
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              シンプルなのに高機能。あなたのデバイス管理をスマートに。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                4ステップ
              </span>
              で簡単スタート
            </h2>
            <p className="text-muted-foreground text-lg">
              わずか数分でセットアップ完了。すぐに使い始められます。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center group">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-cyan-500/50" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-xl font-bold mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-8 sm:p-12 text-center">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-400/20 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <Battery className="h-16 w-16 mx-auto mb-6 text-white/90" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                今すぐ始めよう
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                完全無料で、登録から利用開始まで1分。
                <br />
                あなたのデバイスをスマートに管理しましょう。
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 shadow-xl transition-all hover:scale-105"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  無料アカウントを作成
                </Button>
              </div>

              <p className="text-blue-200 text-sm mt-6">
                クレジットカード不要 • いつでも利用可能
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">BatterySync</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-foreground transition-colors"
            >
              プライバシーポリシー
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-foreground transition-colors"
            >
              利用規約
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BatterySync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
