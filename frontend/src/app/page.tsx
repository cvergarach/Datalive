'use client';
import { useState } from 'react';
import { ArrowRight, BarChart3, Clock, TrendingUp, Shield, Zap, ChevronDown } from 'lucide-react';
import Image from 'next/image';

const translations = {
  es: {
    nav: { signIn: 'Iniciar Sesión' },
    hero: {
      badge: 'Inteligencia de APIs Impulsada por IA',
      title: 'Las empresas solo usan el 20-30% de sus datos disponibles',
      subtitle: 'Alquimia DataLive lee documentación completa de APIs, identifica todos los endpoints y descubre métricas ocultas que hoy no ves. En 24 horas hacemos lo que otros hacen en 6 meses.',
      cta: 'Comenzar Ahora',
      demo: 'Ver Demo'
    },
    problem: {
      title: 'El Problema que Resolvemos',
      subtitle: 'Pérdidas millonarias por APIs subutilizadas',
      items: [
        { title: 'Integración Manual Lenta', desc: '2-6 meses por API. Costos de US$25.000+ por integración.', stat: '6 meses' },
        { title: 'Datos Desaprovechados', desc: 'Solo usas 20-30% de los datos disponibles en tus APIs.', stat: '70% perdido' },
        { title: 'Métricas Ocultas', desc: 'Insights de negocio críticos quedan sin descubrir por falta de correlación.', stat: 'US$400K/año' }
      ]
    },
    solution: {
      title: 'Nuestra Solución',
      subtitle: 'Máxima extracción de valor en tiempo récord',
      items: [
        { title: 'Discovery Automático', desc: 'Lee PDFs de 1.500+ páginas, Swagger y documentación web. Identifica 100% de endpoints disponibles.', icon: 'search' },
        { title: 'Integración en 24h', desc: 'Genera código de conexión automáticamente. Maneja autenticación, rate limiting y errores.', icon: 'zap' },
        { title: 'Métricas Ocultas', desc: 'IA analiza correlaciones entre APIs y descubre métricas que hoy no existen en tu empresa.', icon: 'chart' },
        { title: 'ROI Comprobado', desc: 'Clientes recuperan inversión en menos de 3 meses. Casos documentados de US$400K/año en valor adicional.', icon: 'trending' }
      ]
    },
    cases: {
      title: 'Casos de Uso Reales',
      subtitle: 'Resultados medibles en empresas como la tuya',
      items: [
        {
          sector: 'E-commerce',
          company: 'Retailer US$3M/año',
          problem: 'Integración manual: 3 meses, US$25.000. Solo usa 25% de datos.',
          result: 'Con DataLive: 2 días, US$2.000/mes. Genera US$80.000/año adicionales.',
          roi: '333% ROI'
        },
        {
          sector: 'Fintech',
          company: 'Cartera US$5M préstamos',
          problem: 'Default rate 7%. Pérdidas US$350.000/año. Scoring 1 dimensión.',
          result: 'Con DataLive: Score 12 variables. Reduce default a 5.5%. Ahorra US$75.000/año.',
          roi: '208% ROI'
        },
        {
          sector: 'Corporación',
          company: '300 empleados, US$30M revenue',
          problem: 'Datos en silos. Dashboards parciales. Métricas clave desconocidas.',
          result: 'Con DataLive: Unifica 6 APIs. Dashboard ejecutivo completo. Reduce churn 8% = US$400.000/año.',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'Características Empresariales',
      subtitle: 'Tecnología de nivel corporativo',
      items: [
        { title: 'Seguridad Enterprise', desc: 'Encriptación end-to-end. Cumplimiento SOC 2. Datos en tu región.' },
        { title: 'Escalabilidad', desc: 'Maneja miles de requests/segundo. Auto-scaling. 99.9% uptime SLA.' },
        { title: 'Soporte Dedicado', desc: 'Customer Success Manager. Implementación asistida. SLA de respuesta.' }
      ]
    },
    cta: {
      title: '¿Cuánto dinero estás perdiendo por APIs subutilizadas?',
      subtitle: 'Agenda una demo de 30 minutos y descubre el valor oculto en tus datos.',
      button: 'Agendar Demo Gratuita'
    },
    footer: '2025 Alquimia DataLive. Convirtiendo APIs en valor de negocio.'
  },
  en: {
    nav: { signIn: 'Sign In' },
    hero: {
      badge: 'AI-Powered API Intelligence',
      title: 'Companies only use 20-30% of their available data',
      subtitle: 'Alquimia DataLive reads complete API documentation, identifies all endpoints, and discovers hidden metrics you don\'t see today. In 24 hours we do what others do in 6 months.',
      cta: 'Get Started',
      demo: 'Watch Demo'
    },
    problem: {
      title: 'The Problem We Solve',
      subtitle: 'Million-dollar losses from underutilized APIs',
      items: [
        { title: 'Slow Manual Integration', desc: '2-6 months per API. Costs of US$25,000+ per integration.', stat: '6 months' },
        { title: 'Wasted Data', desc: 'You only use 20-30% of available data in your APIs.', stat: '70% lost' },
        { title: 'Hidden Metrics', desc: 'Critical business insights remain undiscovered due to lack of correlation.', stat: 'US$400K/year' }
      ]
    },
    solution: {
      title: 'Our Solution',
      subtitle: 'Maximum value extraction in record time',
      items: [
        { title: 'Automatic Discovery', desc: 'Reads 1,500+ page PDFs, Swagger and web documentation. Identifies 100% of available endpoints.', icon: 'search' },
        { title: '24h Integration', desc: 'Automatically generates connection code. Handles authentication, rate limiting and errors.', icon: 'zap' },
        { title: 'Hidden Metrics', desc: 'AI analyzes correlations between APIs and discovers metrics that don\'t exist in your company today.', icon: 'chart' },
        { title: 'Proven ROI', desc: 'Clients recover investment in less than 3 months. Documented cases of US$400K/year in additional value.', icon: 'trending' }
      ]
    },
    cases: {
      title: 'Real Use Cases',
      subtitle: 'Measurable results in companies like yours',
      items: [
        {
          sector: 'E-commerce',
          company: 'Retailer US$3M/year',
          problem: 'Manual integration: 3 months, US$25,000. Only uses 25% of data.',
          result: 'With DataLive: 2 days, US$2,000/month. Generates US$80,000/year additional.',
          roi: '333% ROI'
        },
        {
          sector: 'Fintech',
          company: 'US$5M loan portfolio',
          problem: '7% default rate. US$350,000/year losses. 1-dimension scoring.',
          result: 'With DataLive: 12-variable score. Reduces default to 5.5%. Saves US$75,000/year.',
          roi: '208% ROI'
        },
        {
          sector: 'Corporation',
          company: '300 employees, US$30M revenue',
          problem: 'Data in silos. Partial dashboards. Unknown key metrics.',
          result: 'With DataLive: Unifies 6 APIs. Complete executive dashboard. Reduces churn 8% = US$400,000/year.',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'Enterprise Features',
      subtitle: 'Corporate-grade technology',
      items: [
        { title: 'Enterprise Security', desc: 'End-to-end encryption. SOC 2 compliance. Data in your region.' },
        { title: 'Scalability', desc: 'Handles thousands of requests/second. Auto-scaling. 99.9% uptime SLA.' },
        { title: 'Dedicated Support', desc: 'Customer Success Manager. Assisted implementation. Response SLA.' }
      ]
    },
    cta: {
      title: 'How much money are you losing from underutilized APIs?',
      subtitle: 'Schedule a 30-minute demo and discover the hidden value in your data.',
      button: 'Schedule Free Demo'
    },
    footer: '2025 Alquimia DataLive. Turning APIs into business value.'
  },
  fr: {
    nav: { signIn: 'Se Connecter' },
    hero: {
      badge: 'Intelligence API Alimentée par IA',
      title: 'Les entreprises n\'utilisent que 20-30% de leurs données disponibles',
      subtitle: 'Alquimia DataLive lit la documentation complète des APIs, identifie tous les endpoints et découvre des métriques cachées que vous ne voyez pas aujourd\'hui. En 24 heures, nous faisons ce que d\'autres font en 6 mois.',
      cta: 'Commencer',
      demo: 'Voir Démo'
    },
    problem: {
      title: 'Le Problème que Nous Résolvons',
      subtitle: 'Pertes de millions dues aux APIs sous-utilisées',
      items: [
        { title: 'Intégration Manuelle Lente', desc: '2-6 mois par API. Coûts de 25 000 USD+ par intégration.', stat: '6 mois' },
        { title: 'Données Gaspillées', desc: 'Vous n\'utilisez que 20-30% des données disponibles dans vos APIs.', stat: '70% perdu' },
        { title: 'Métriques Cachées', desc: 'Des insights commerciaux critiques restent non découverts par manque de corrélation.', stat: '400K USD/an' }
      ]
    },
    solution: {
      title: 'Notre Solution',
      subtitle: 'Extraction de valeur maximale en temps record',
      items: [
        { title: 'Découverte Automatique', desc: 'Lit des PDFs de 1 500+ pages, Swagger et documentation web. Identifie 100% des endpoints disponibles.', icon: 'search' },
        { title: 'Intégration en 24h', desc: 'Génère automatiquement le code de connexion. Gère l\'authentification, le rate limiting et les erreurs.', icon: 'zap' },
        { title: 'Métriques Cachées', desc: 'L\'IA analyse les corrélations entre APIs et découvre des métriques qui n\'existent pas dans votre entreprise aujourd\'hui.', icon: 'chart' },
        { title: 'ROI Prouvé', desc: 'Les clients récupèrent l\'investissement en moins de 3 mois. Cas documentés de 400K USD/an en valeur additionnelle.', icon: 'trending' }
      ]
    },
    cases: {
      title: 'Cas d\'Usage Réels',
      subtitle: 'Résultats mesurables dans des entreprises comme la vôtre',
      items: [
        {
          sector: 'E-commerce',
          company: 'Détaillant 3M USD/an',
          problem: 'Intégration manuelle: 3 mois, 25 000 USD. N\'utilise que 25% des données.',
          result: 'Avec DataLive: 2 jours, 2 000 USD/mois. Génère 80 000 USD/an supplémentaires.',
          roi: '333% ROI'
        },
        {
          sector: 'Fintech',
          company: 'Portefeuille 5M USD prêts',
          problem: 'Taux de défaut 7%. Pertes 350 000 USD/an. Scoring 1 dimension.',
          result: 'Avec DataLive: Score 12 variables. Réduit défaut à 5,5%. Économise 75 000 USD/an.',
          roi: '208% ROI'
        },
        {
          sector: 'Corporation',
          company: '300 employés, 30M USD revenus',
          problem: 'Données en silos. Tableaux de bord partiels. Métriques clés inconnues.',
          result: 'Avec DataLive: Unifie 6 APIs. Tableau de bord exécutif complet. Réduit churn 8% = 400 000 USD/an.',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'Fonctionnalités Entreprise',
      subtitle: 'Technologie de niveau corporatif',
      items: [
        { title: 'Sécurité Entreprise', desc: 'Chiffrement de bout en bout. Conformité SOC 2. Données dans votre région.' },
        { title: 'Évolutivité', desc: 'Gère des milliers de requêtes/seconde. Auto-scaling. SLA 99,9% uptime.' },
        { title: 'Support Dédié', desc: 'Customer Success Manager. Implémentation assistée. SLA de réponse.' }
      ]
    },
    cta: {
      title: 'Combien d\'argent perdez-vous avec des APIs sous-utilisées?',
      subtitle: 'Planifiez une démo de 30 minutes et découvrez la valeur cachée dans vos données.',
      button: 'Planifier Démo Gratuite'
    },
    footer: '2025 Alquimia DataLive. Transformer les APIs en valeur commerciale.'
  },
  pt: {
    nav: { signIn: 'Entrar' },
    hero: {
      badge: 'Inteligência de API Impulsionada por IA',
      title: 'As empresas usam apenas 20-30% dos seus dados disponíveis',
      subtitle: 'Alquimia DataLive lê documentação completa de APIs, identifica todos os endpoints e descobre métricas ocultas que você não vê hoje. Em 24 horas fazemos o que outros fazem em 6 meses.',
      cta: 'Começar Agora',
      demo: 'Ver Demo'
    },
    problem: {
      title: 'O Problema que Resolvemos',
      subtitle: 'Perdas milionárias por APIs subutilizadas',
      items: [
        { title: 'Integração Manual Lenta', desc: '2-6 meses por API. Custos de US$25.000+ por integração.', stat: '6 meses' },
        { title: 'Dados Desperdiçados', desc: 'Você usa apenas 20-30% dos dados disponíveis em suas APIs.', stat: '70% perdido' },
        { title: 'Métricas Ocultas', desc: 'Insights de negócio críticos permanecem não descobertos por falta de correlação.', stat: 'US$400K/ano' }
      ]
    },
    solution: {
      title: 'Nossa Solução',
      subtitle: 'Máxima extração de valor em tempo recorde',
      items: [
        { title: 'Discovery Automático', desc: 'Lê PDFs de 1.500+ páginas, Swagger e documentação web. Identifica 100% dos endpoints disponíveis.', icon: 'search' },
        { title: 'Integração em 24h', desc: 'Gera código de conexão automaticamente. Gerencia autenticação, rate limiting e erros.', icon: 'zap' },
        { title: 'Métricas Ocultas', desc: 'IA analisa correlações entre APIs e descobre métricas que não existem em sua empresa hoje.', icon: 'chart' },
        { title: 'ROI Comprovado', desc: 'Clientes recuperam investimento em menos de 3 meses. Casos documentados de US$400K/ano em valor adicional.', icon: 'trending' }
      ]
    },
    cases: {
      title: 'Casos de Uso Reais',
      subtitle: 'Resultados mensuráveis em empresas como a sua',
      items: [
        {
          sector: 'E-commerce',
          company: 'Varejista US$3M/ano',
          problem: 'Integração manual: 3 meses, US$25.000. Usa apenas 25% dos dados.',
          result: 'Com DataLive: 2 dias, US$2.000/mês. Gera US$80.000/ano adicionais.',
          roi: '333% ROI'
        },
        {
          sector: 'Fintech',
          company: 'Carteira US$5M empréstimos',
          problem: 'Taxa de inadimplência 7%. Perdas US$350.000/ano. Scoring 1 dimensão.',
          result: 'Com DataLive: Score 12 variáveis. Reduz inadimplência para 5,5%. Economiza US$75.000/ano.',
          roi: '208% ROI'
        },
        {
          sector: 'Corporação',
          company: '300 funcionários, US$30M receita',
          problem: 'Dados em silos. Dashboards parciais. Métricas-chave desconhecidas.',
          result: 'Com DataLive: Unifica 6 APIs. Dashboard executivo completo. Reduz churn 8% = US$400.000/ano.',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'Recursos Empresariais',
      subtitle: 'Tecnologia de nível corporativo',
      items: [
        { title: 'Segurança Enterprise', desc: 'Criptografia end-to-end. Conformidade SOC 2. Dados na sua região.' },
        { title: 'Escalabilidade', desc: 'Gerencia milhares de requisições/segundo. Auto-scaling. SLA 99,9% uptime.' },
        { title: 'Suporte Dedicado', desc: 'Customer Success Manager. Implementação assistida. SLA de resposta.' }
      ]
    },
    cta: {
      title: 'Quanto dinheiro você está perdendo por APIs subutilizadas?',
      subtitle: 'Agende uma demo de 30 minutos e descubra o valor oculto em seus dados.',
      button: 'Agendar Demo Gratuita'
    },
    footer: '2025 Alquimia DataLive. Transformando APIs em valor de negócio.'
  },
  de: {
    nav: { signIn: 'Anmelden' },
    hero: {
      badge: 'KI-gestützte API-Intelligenz',
      title: 'Unternehmen nutzen nur 20-30% ihrer verfügbaren Daten',
      subtitle: 'Alquimia DataLive liest vollständige API-Dokumentation, identifiziert alle Endpunkte und entdeckt verborgene Metriken, die Sie heute nicht sehen. In 24 Stunden machen wir, was andere in 6 Monaten machen.',
      cta: 'Jetzt Starten',
      demo: 'Demo Ansehen'
    },
    problem: {
      title: 'Das Problem, das Wir Lösen',
      subtitle: 'Millionenverluste durch untergenutzte APIs',
      items: [
        { title: 'Langsame Manuelle Integration', desc: '2-6 Monate pro API. Kosten von 25.000 USD+ pro Integration.', stat: '6 Monate' },
        { title: 'Verschwendete Daten', desc: 'Sie nutzen nur 20-30% der verfügbaren Daten in Ihren APIs.', stat: '70% verloren' },
        { title: 'Verborgene Metriken', desc: 'Kritische Geschäftseinblicke bleiben unentdeckt aufgrund fehlender Korrelation.', stat: '400K USD/Jahr' }
      ]
    },
    solution: {
      title: 'Unsere Lösung',
      subtitle: 'Maximale Wertextraktion in Rekordzeit',
      items: [
        { title: 'Automatische Entdeckung', desc: 'Liest 1.500+ Seiten PDFs, Swagger und Web-Dokumentation. Identifiziert 100% der verfügbaren Endpunkte.', icon: 'search' },
        { title: '24h Integration', desc: 'Generiert automatisch Verbindungscode. Verwaltet Authentifizierung, Rate Limiting und Fehler.', icon: 'zap' },
        { title: 'Verborgene Metriken', desc: 'KI analysiert Korrelationen zwischen APIs und entdeckt Metriken, die in Ihrem Unternehmen heute nicht existieren.', icon: 'chart' },
        { title: 'Bewiesener ROI', desc: 'Kunden erholen Investition in weniger als 3 Monaten. Dokumentierte Fälle von 400K USD/Jahr an zusätzlichem Wert.', icon: 'trending' }
      ]
    },
    cases: {
      title: 'Echte Anwendungsfälle',
      subtitle: 'Messbare Ergebnisse in Unternehmen wie Ihrem',
      items: [
        {
          sector: 'E-commerce',
          company: 'Einzelhändler 3M USD/Jahr',
          problem: 'Manuelle Integration: 3 Monate, 25.000 USD. Nutzt nur 25% der Daten.',
          result: 'Mit DataLive: 2 Tage, 2.000 USD/Monat. Generiert 80.000 USD/Jahr zusätzlich.',
          roi: '333% ROI'
        },
        {
          sector: 'Fintech',
          company: '5M USD Kreditportfolio',
          problem: '7% Ausfallrate. 350.000 USD/Jahr Verluste. 1-dimensionales Scoring.',
          result: 'Mit DataLive: 12-Variablen-Score. Reduziert Ausfall auf 5,5%. Spart 75.000 USD/Jahr.',
          roi: '208% ROI'
        },
        {
          sector: 'Konzern',
          company: '300 Mitarbeiter, 30M USD Umsatz',
          problem: 'Daten in Silos. Teilweise Dashboards. Unbekannte Schlüsselmetriken.',
          result: 'Mit DataLive: Vereint 6 APIs. Vollständiges Executive Dashboard. Reduziert Churn 8% = 400.000 USD/Jahr.',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'Enterprise-Funktionen',
      subtitle: 'Unternehmensklasse-Technologie',
      items: [
        { title: 'Enterprise-Sicherheit', desc: 'End-to-End-Verschlüsselung. SOC 2-Konformität. Daten in Ihrer Region.' },
        { title: 'Skalierbarkeit', desc: 'Verarbeitet Tausende Anfragen/Sekunde. Auto-Scaling. 99,9% Uptime-SLA.' },
        { title: 'Dedizierter Support', desc: 'Customer Success Manager. Unterstützte Implementierung. Antwort-SLA.' }
      ]
    },
    cta: {
      title: 'Wie viel Geld verlieren Sie durch untergenutzte APIs?',
      subtitle: 'Vereinbaren Sie eine 30-minütige Demo und entdecken Sie den verborgenen Wert in Ihren Daten.',
      button: 'Kostenlose Demo Vereinbaren'
    },
    footer: '2025 Alquimia DataLive. APIs in Geschäftswert verwandeln.'
  },
  jp: {
    nav: { signIn: 'サインイン' },
    hero: {
      badge: 'AI駆動のAPIインテリジェンス',
      title: '企業は利用可能なデータの20-30%しか使用していません',
      subtitle: 'Alquimia DataLiveは完全なAPIドキュメントを読み取り、すべてのエンドポイントを識別し、今日見えない隠れたメトリクスを発見します。6ヶ月かかることを24時間で実現します。',
      cta: '今すぐ始める',
      demo: 'デモを見る'
    },
    problem: {
      title: '私たちが解決する問題',
      subtitle: '活用不足のAPIによる数百万ドルの損失',
      items: [
        { title: '遅い手動統合', desc: 'API1つあたり2-6ヶ月。統合1つあたり25,000ドル以上のコスト。', stat: '6ヶ月' },
        { title: '無駄なデータ', desc: 'APIで利用可能なデータの20-30%しか使用していません。', stat: '70%損失' },
        { title: '隠れたメトリクス', desc: '相関関係の欠如により、重要なビジネス洞察が発見されないままです。', stat: '40万ドル/年' }
      ]
    },
    solution: {
      title: '私たちのソリューション',
      subtitle: '記録的な時間で最大の価値抽出',
      items: [
        { title: '自動ディスカバリー', desc: '1,500ページ以上のPDF、Swagger、Webドキュメントを読み取ります。利用可能なエンドポイントの100%を識別します。', icon: 'search' },
        { title: '24時間統合', desc: '接続コードを自動生成します。認証、レート制限、エラーを処理します。', icon: 'zap' },
        { title: '隠れたメトリクス', desc: 'AIがAPI間の相関関係を分析し、今日あなたの会社に存在しないメトリクスを発見します。', icon: 'chart' },
        { title: '実証済みROI', desc: 'クライアントは3ヶ月未満で投資を回収します。年間40万ドルの追加価値の文書化されたケース。', icon: 'trending' }
      ]
    },
    cases: {
      title: '実際のユースケース',
      subtitle: 'あなたのような企業での測定可能な結果',
      items: [
        {
          sector: 'Eコマース',
          company: '小売業者300万ドル/年',
          problem: '手動統合：3ヶ月、25,000ドル。データの25%のみ使用。',
          result: 'DataLiveで：2日、2,000ドル/月。年間80,000ドル追加生成。',
          roi: '333% ROI'
        },
        {
          sector: 'フィンテック',
          company: '500万ドルローンポートフォリオ',
          problem: 'デフォルト率7%。年間35万ドルの損失。1次元スコアリング。',
          result: 'DataLiveで：12変数スコア。デフォルトを5.5%に削減。年間75,000ドル節約。',
          roi: '208% ROI'
        },
        {
          sector: '企業',
          company: '従業員300人、収益3000万ドル',
          problem: 'サイロ化されたデータ。部分的なダッシュボード。不明な主要メトリクス。',
          result: 'DataLiveで：6つのAPIを統合。完全な経営ダッシュボード。チャーン8%削減 = 年間40万ドル。',
          roi: '555% ROI'
        }
      ]
    },
    features: {
      title: 'エンタープライズ機能',
      subtitle: '企業グレードの技術',
      items: [
        { title: 'エンタープライズセキュリティ', desc: 'エンドツーエンド暗号化。SOC 2準拠。お客様の地域にデータ。' },
        { title: 'スケーラビリティ', desc: '毎秒数千のリクエストを処理。自動スケーリング。99.9%稼働時間SLA。' },
        { title: '専任サポート', desc: 'カスタマーサクセスマネージャー。支援付き実装。応答SLA。' }
      ]
    },
    cta: {
      title: '活用不足のAPIでどれだけのお金を失っていますか？',
      subtitle: '30分のデモをスケジュールして、データに隠された価値を発見してください。',
      button: '無料デモをスケジュール'
    },
    footer: '2025 Alquimia DataLive. APIをビジネス価値に変換。'
  }
};

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'jp', name: '日本語', flag: '🇯🇵' }
];

export default function LandingPage() {
  const [lang, setLang] = useState<'es' | 'en' | 'fr' | 'pt' | 'de' | 'jp'>('es');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = translations[lang];

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm border-b border-gray-900 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo-full.png" alt="DataLive" width={200} height={45} className="h-11 w-auto" priority />
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors border border-gray-800"
                >
                  <span className="text-sm text-gray-400">{languages.find(l => l.code === lang)?.flag}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-950 border border-gray-800 rounded-lg shadow-2xl py-2">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          setLang(language.code as any);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-900 transition-colors flex items-center space-x-3 ${lang === language.code ? 'bg-gray-900' : ''
                          }`}
                      >
                        <span>{language.flag}</span>
                        <span className="text-sm text-gray-300">{language.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSignIn}
                className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                {t.nav.signIn}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-950/30 border border-blue-900/50 rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-400 font-medium">{t.hero.badge}</span>
            </div>

            <div className="flex justify-center mb-6">
              <Image src="/icon-wave.png" alt="DataLive Icon" width={80} height={80} className="opacity-90" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
              {t.hero.title}
            </h1>

            <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignIn}
                className="px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>{t.hero.cta}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                className="px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-200 border border-gray-800"
              >
                {t.hero.demo}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t.problem.title}</h2>
            <p className="text-xl text-red-400">{t.problem.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.problem.items.map((item, idx) => (
              <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                <div className="text-4xl font-bold text-red-500 mb-4">{item.stat}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t.solution.title}</h2>
            <p className="text-xl text-gray-400">{t.solution.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {t.solution.items.map((item, idx) => (
              <div key={idx} className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon === 'search' && <BarChart3 className="w-6 h-6 text-blue-400" />}
                    {item.icon === 'zap' && <Zap className="w-6 h-6 text-yellow-400" />}
                    {item.icon === 'chart' && <TrendingUp className="w-6 h-6 text-green-400" />}
                    {item.icon === 'trending' && <Clock className="w-6 h-6 text-purple-400" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t.cases.title}</h2>
            <p className="text-xl text-gray-400">{t.cases.subtitle}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {t.cases.items.map((item, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                <div className="text-sm text-blue-400 font-semibold mb-2">{item.sector}</div>
                <div className="text-lg font-bold text-white mb-4">{item.company}</div>

                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-2">Antes:</div>
                  <p className="text-sm text-gray-400">{item.problem}</p>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-500 mb-2">Después:</div>
                  <p className="text-sm text-gray-300">{item.result}</p>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="text-2xl font-bold text-green-400">{item.roi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t.features.title}</h2>
            <p className="text-xl text-gray-400">{t.features.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.features.items.map((item, idx) => (
              <div key={idx} className="bg-gray-900/30 border border-gray-800 rounded-xl p-8">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                  {idx === 0 && <Shield className="w-6 h-6 text-blue-400" />}
                  {idx === 1 && <TrendingUp className="w-6 h-6 text-green-400" />}
                  {idx === 2 && <BarChart3 className="w-6 h-6 text-purple-400" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-950 to-black border-t border-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">{t.cta.title}</h2>
          <p className="text-xl text-gray-400 mb-10">{t.cta.subtitle}</p>
          <button
            onClick={handleSignIn}
            className="px-10 py-5 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition-all duration-200 inline-flex items-center space-x-3"
          >
            <span>{t.cta.button}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
