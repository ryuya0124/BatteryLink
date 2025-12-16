import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <SEO
        title="利用規約"
        description="BatterySyncの利用規約。サービスをご利用いただく際の条件についてご説明します。"
        canonical="/terms"
      />
      <div className="container max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">利用規約</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">最終更新日: 2025年12月17日</p>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. はじめに</h2>
            <p>
              本利用規約（以下「本規約」）は、BatterySync（以下「本サービス」）の利用条件を定めるものです。
              本サービスを利用することにより、本規約に同意したものとみなされます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. サービスの概要</h2>
            <p>
              本サービスは、複数のデバイスのバッテリー状態を一元管理・監視するためのウェブアプリケーションです。
              ユーザーはアカウントを作成し、デバイスを登録してバッテリー情報を確認することができます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. アカウント</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>本サービスの利用にはアカウントの作成が必要です</li>
              <li>アカウント情報は正確かつ最新の状態を維持してください</li>
              <li>アカウントの認証情報は安全に管理し、第三者に共有しないでください</li>
              <li>アカウントの不正利用については、ユーザー自身が責任を負います</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. 禁止事項</h2>
            <p>本サービスの利用にあたり、以下の行為を禁止します：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスのサーバーやネットワークに過度な負担をかける行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他のユーザーの情報を不正に収集・利用する行為</li>
              <li>本サービスを不正に利用する行為</li>
              <li>リバースエンジニアリング、逆コンパイル、逆アセンブル</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. サービスの変更・停止</h2>
            <p>
              運営者は、事前の通知なく本サービスの内容を変更、または提供を停止・中断することができます。
              これによりユーザーに生じた損害について、運営者は責任を負いません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. 免責事項</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>本サービスは「現状有姿」で提供され、明示・黙示を問わず、いかなる保証も行いません</li>
              <li>本サービスの利用により生じた損害について、運営者は責任を負いません</li>
              <li>バッテリー情報の精度については保証しません</li>
              <li>サービスの中断、データの消失等について責任を負いません</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. 知的財産権</h2>
            <p>
              本サービスに関する著作権、商標権、その他の知的財産権は、運営者または正当な権利者に帰属します。
              本規約により、ユーザーにこれらの権利が譲渡されることはありません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. アカウントの削除</h2>
            <p>
              ユーザーは、いつでもアカウントを削除することができます。
              また、運営者は本規約に違反した場合、事前の通知なくアカウントを削除する権利を有します。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. 規約の変更</h2>
            <p>
              運営者は、必要に応じて本規約を変更することができます。
              重要な変更がある場合は、本サービス上でお知らせします。
              変更後も本サービスを継続して利用することにより、変更後の規約に同意したものとみなされます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">10. 準拠法・管轄裁判所</h2>
            <p>
              本規約の解釈および適用は、日本法に準拠します。
              本サービスに関する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">11. お問い合わせ</h2>
            <p>
              本規約に関するご質問やお問い合わせは、以下の連絡先までお願いします：
            </p>
            <p className="font-medium">
              メール: <a href="mailto:support@batt.ryuya-dev.net" className="text-primary hover:underline">support@batt.ryuya-dev.net</a>
            </p>
          </section>
        </div>

        <footer className="mt-12 pt-8 border-t text-center text-muted-foreground text-xs sm:text-sm">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
}
