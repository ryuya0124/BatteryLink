import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const defaultMeta = {
  title: "BatterySync - 複数デバイスのバッテリー残量を一元管理",
  description: "iPhone、Android、タブレットなど複数デバイスのバッテリー残量をリアルタイムで一元管理。無料で使えるバッテリー監視ダッシュボード。",
  keywords: "バッテリー管理,バッテリー残量,デバイス管理,iPhone,Android,タブレット,リアルタイム監視,BatterySync",
  siteUrl: "https://batt.ryuya-dev.net",
  ogImage: "https://batt.ryuya-dev.net/favicon.png",
};

export function SEO({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  canonical,
  ogImage = defaultMeta.ogImage,
  noindex = false,
}: SEOProps) {
  const pageTitle = title
    ? `${title} | BatterySync`
    : defaultMeta.title;

  const canonicalUrl = canonical
    ? `${defaultMeta.siteUrl}${canonical}`
    : undefined;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
