import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">プライバシーポリシー</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">最終更新日: 2025年12月17日</p>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. はじめに</h2>
            <p>
              BatteryLink（以下「本サービス」）は、お客様のプライバシーを尊重し、個人情報の保護に努めております。
              本プライバシーポリシーは、本サービスがどのような情報を収集し、どのように使用・保護するかについて説明します。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. 収集する情報</h2>
            <p>本サービスでは、以下の情報を収集する場合があります：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>アカウント情報（メールアドレス、ユーザー名など）</li>
              <li>デバイス情報（デバイス名、バッテリー状態、接続情報など）</li>
              <li>利用状況データ（アクセスログ、操作履歴など）</li>
              <li>技術情報（IPアドレス、ブラウザ情報、OSなど）</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的で利用します：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>本サービスの提供・運営・改善</li>
              <li>ユーザーサポートの提供</li>
              <li>サービスに関する通知・お知らせの送信</li>
              <li>不正利用の防止・セキュリティの確保</li>
              <li>統計データの作成（個人を特定できない形式）</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. 情報の共有</h2>
            <p>
              本サービスは、以下の場合を除き、お客様の個人情報を第三者に提供することはありません：
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>お客様の同意がある場合</li>
              <li>法令に基づく開示要求があった場合</li>
              <li>サービス提供に必要な業務委託先への提供（適切な管理のもと）</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. データの保護</h2>
            <p>
              本サービスは、お客様の情報を保護するために、適切な技術的・組織的セキュリティ対策を講じています。
              ただし、インターネット上での送信やデータ保存において、100%の安全性を保証することはできません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. Cookieの使用</h2>
            <p>
              本サービスでは、ユーザー体験の向上やサービスの改善のためにCookieを使用する場合があります。
              ブラウザの設定によりCookieを無効にすることができますが、一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. お客様の権利</h2>
            <p>お客様は以下の権利を有しています：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>個人情報へのアクセス・訂正・削除の請求</li>
              <li>データ処理への同意の撤回</li>
              <li>アカウントの削除</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. 本ポリシーの変更</h2>
            <p>
              本プライバシーポリシーは、必要に応じて変更される場合があります。
              重要な変更がある場合は、本サービス上でお知らせします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. お問い合わせ</h2>
            <p>
              プライバシーに関するご質問やお問い合わせは、以下の連絡先までお願いします：
            </p>
            <p className="font-medium">
              メール: <a href="mailto:support@batt.ryuya-dev.net" className="text-primary hover:underline">support@batt.ryuya-dev.net</a>
            </p>
          </section>
        </div>

        <footer className="mt-12 pt-8 border-t text-center text-muted-foreground text-xs sm:text-sm">
          <p>© 2025 BatteryLink</p>
        </footer>
      </div>
    </div>
  );
}
