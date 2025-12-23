'use client';
import { useState } from 'react';
import { ArrowRight, Database, TrendingUp, Shield, Globe, Sparkles, Languages } from 'lucide-react';
import Image from 'next/image';

const translations = {
  es: {
    nav: { signIn: 'Iniciar Sesión' },
    hero: {
      badge: 'Inteligencia de APIs Impulsada por IA',
      title1: 'Transforma Tus',
      title2: ' Datos de API ',
      title3: 'en Insights',
      subtitle: 'Descubre, analiza e integra APIs automáticamente desde cualquier documentación. Deja que la IA extraiga endpoints, autenticación y estrategias de ejecución por ti.',
      cta: 'Continuar con Google',
      learnMore: 'Saber Más'
    },
    features: {
      title: 'Características Poderosas',
      subtitle: 'Todo lo que necesitas para trabajar con APIs eficientemente',
      ai: { title: 'Análisis con IA', desc: 'Sube PDFs o ingresa URLs. Nuestra IA extrae automáticamente endpoints, parámetros y detalles de autenticación.' },
      crawl: { title: 'Rastreo Web', desc: 'Rastrea sitios de documentación recursivamente para descubrir todos los endpoints y recursos disponibles.' },
      org: { title: 'Organización Inteligente', desc: 'Categoriza y organiza automáticamente las APIs descubiertas por proyecto, facilitando su búsqueda y uso.' },
      exec: { title: 'Estrategias de Ejecución', desc: 'Obtén guías generadas por IA sobre cómo usar cada API efectivamente, incluyendo autenticación y mejores prácticas.' },
      secure: { title: 'Seguro y Privado', desc: 'Tus datos están encriptados y almacenados de forma segura. Google OAuth garantiza autenticación segura.' },
      insights: { title: 'Insights en Tiempo Real', desc: 'Obtén insights y analíticas instantáneas sobre tus APIs descubiertas y sus patrones de uso.' }
    },
    cta: {
      title: '¿Listo para Transformar tu Flujo de Trabajo con APIs?',
      subtitle: 'Únete a los desarrolladores que ya usan DataLive para optimizar su proceso de integración de APIs.',
      button: 'Comenzar con Google'
    },
    footer: '2025 DataLive. Plataforma de inteligencia de APIs impulsada por IA.'
  },
  en: {
    nav: { signIn: 'Sign In' },
    hero: {
      badge: 'AI-Powered API Intelligence',
      title1: 'Transform Your',
      title2: ' API Data ',
      title3: 'Into Insights',
      subtitle: 'Automatically discover, analyze, and integrate APIs from any documentation. Let AI extract endpoints, authentication, and execution strategies for you.',
      cta: 'Continue with Google',
      learnMore: 'Learn More'
    },
    features: {
      title: 'Powerful Features',
      subtitle: 'Everything you need to work with APIs efficiently',
      ai: { title: 'AI-Powered Analysis', desc: 'Upload PDFs or enter URLs. Our AI automatically extracts endpoints, parameters, and authentication details.' },
      crawl: { title: 'Web Crawling', desc: 'Recursively crawl documentation sites to discover all available endpoints and resources.' },
      org: { title: 'Smart Organization', desc: 'Automatically categorize and organize discovered APIs by project, making them easy to find and use.' },
      exec: { title: 'Execution Strategies', desc: 'Get AI-generated guides on how to use each API effectively, including authentication and best practices.' },
      secure: { title: 'Secure & Private', desc: 'Your data is encrypted and stored securely. Google OAuth ensures safe authentication.' },
      insights: { title: 'Real-time Insights', desc: 'Get instant insights and analytics on your discovered APIs and their usage patterns.' }
    },
    cta: {
      title: 'Ready to Transform Your API Workflow?',
      subtitle: 'Join developers who are already using DataLive to streamline their API integration process.',
      button: 'Get Started with Google'
    },
    footer: '2025 DataLive. AI-powered API intelligence platform.'
  },
  fr: {
    nav: { signIn: 'Se Connecter' },
    hero: {
      badge: 'Intelligence API Alimentée par IA',
      title1: 'Transformez Vos',
      title2: ' Données API ',
      title3: 'en Insights',
      subtitle: 'Découvrez, analysez et intégrez automatiquement des APIs depuis n\'importe quelle documentation. Laissez l\'IA extraire les endpoints, l\'authentification et les stratégies d\'exécution pour vous.',
      cta: 'Continuer avec Google',
      learnMore: 'En Savoir Plus'
    },
    features: {
      title: 'Fonctionnalités Puissantes',
      subtitle: 'Tout ce dont vous avez besoin pour travailler efficacement avec les APIs',
      ai: { title: 'Analyse par IA', desc: 'Téléchargez des PDFs ou entrez des URLs. Notre IA extrait automatiquement les endpoints, paramètres et détails d\'authentification.' },
      crawl: { title: 'Exploration Web', desc: 'Explorez récursivement les sites de documentation pour découvrir tous les endpoints et ressources disponibles.' },
      org: { title: 'Organisation Intelligente', desc: 'Catégorisez et organisez automatiquement les APIs découvertes par projet, facilitant leur recherche et utilisation.' },
      exec: { title: 'Stratégies d\'Exécution', desc: 'Obtenez des guides générés par IA sur comment utiliser chaque API efficacement, incluant l\'authentification et les meilleures pratiques.' },
      secure: { title: 'Sécurisé et Privé', desc: 'Vos données sont cryptées et stockées en toute sécurité. Google OAuth garantit une authentification sûre.' },
      insights: { title: 'Insights en Temps Réel', desc: 'Obtenez des insights et analyses instantanés sur vos APIs découvertes et leurs modèles d\'utilisation.' }
    },
    cta: {
      title: 'Prêt à Transformer Votre Flux de Travail API?',
      subtitle: 'Rejoignez les développeurs qui utilisent déjà DataLive pour rationaliser leur processus d\'intégration API.',
      button: 'Commencer avec Google'
    },
    footer: '2025 DataLive. Plateforme d\'intelligence API alimentée par IA.'
  },
  pt: {
    nav: { signIn: 'Entrar' },
    hero: {
      badge: 'Inteligência de API Impulsionada por IA',
      title1: 'Transforme Seus',
      title2: ' Dados de API ',
      title3: 'em Insights',
      subtitle: 'Descubra, analise e integre APIs automaticamente de qualquer documentação. Deixe a IA extrair endpoints, autenticação e estratégias de execução para você.',
      cta: 'Continuar com Google',
      learnMore: 'Saiba Mais'
    },
    features: {
      title: 'Recursos Poderosos',
      subtitle: 'Tudo que você precisa para trabalhar com APIs eficientemente',
      ai: { title: 'Análise com IA', desc: 'Carregue PDFs ou insira URLs. Nossa IA extrai automaticamente endpoints, parâmetros e detalhes de autenticação.' },
      crawl: { title: 'Rastreamento Web', desc: 'Rastreie sites de documentação recursivamente para descobrir todos os endpoints e recursos disponíveis.' },
      org: { title: 'Organização Inteligente', desc: 'Categorize e organize automaticamente as APIs descobertas por projeto, facilitando sua busca e uso.' },
      exec: { title: 'Estratégias de Execução', desc: 'Obtenha guias gerados por IA sobre como usar cada API efetivamente, incluindo autenticação e melhores práticas.' },
      secure: { title: 'Seguro e Privado', desc: 'Seus dados são criptografados e armazenados com segurança. Google OAuth garante autenticação segura.' },
      insights: { title: 'Insights em Tempo Real', desc: 'Obtenha insights e análises instantâneas sobre suas APIs descobertas e seus padrões de uso.' }
    },
    cta: {
      title: 'Pronto para Transformar Seu Fluxo de Trabalho com APIs?',
      subtitle: 'Junte-se aos desenvolvedores que já usam DataLive para otimizar seu processo de integração de APIs.',
      button: 'Começar com Google'
    },
    footer: '2025 DataLive. Plataforma de inteligência de API impulsionada por IA.'
  },
  de: {
    nav: { signIn: 'Anmelden' },
    hero: {
      badge: 'KI-gestützte API-Intelligenz',
      title1: 'Verwandeln Sie Ihre',
      title2: ' API-Daten ',
      title3: 'in Erkenntnisse',
      subtitle: 'Entdecken, analysieren und integrieren Sie APIs automatisch aus jeder Dokumentation. Lassen Sie KI Endpunkte, Authentifizierung und Ausführungsstrategien für Sie extrahieren.',
      cta: 'Mit Google fortfahren',
      learnMore: 'Mehr erfahren'
    },
    features: {
      title: 'Leistungsstarke Funktionen',
      subtitle: 'Alles, was Sie brauchen, um effizient mit APIs zu arbeiten',
      ai: { title: 'KI-gestützte Analyse', desc: 'Laden Sie PDFs hoch oder geben Sie URLs ein. Unsere KI extrahiert automatisch Endpunkte, Parameter und Authentifizierungsdetails.' },
      crawl: { title: 'Web-Crawling', desc: 'Durchsuchen Sie Dokumentationsseiten rekursiv, um alle verfügbaren Endpunkte und Ressourcen zu entdecken.' },
      org: { title: 'Intelligente Organisation', desc: 'Kategorisieren und organisieren Sie entdeckte APIs automatisch nach Projekten, um sie leicht zu finden und zu verwenden.' },
      exec: { title: 'Ausführungsstrategien', desc: 'Erhalten Sie KI-generierte Anleitungen zur effektiven Nutzung jeder API, einschließlich Authentifizierung und Best Practices.' },
      secure: { title: 'Sicher und Privat', desc: 'Ihre Daten werden verschlüsselt und sicher gespeichert. Google OAuth gewährleistet sichere Authentifizierung.' },
      insights: { title: 'Echtzeit-Einblicke', desc: 'Erhalten Sie sofortige Einblicke und Analysen zu Ihren entdeckten APIs und deren Nutzungsmustern.' }
    },
    cta: {
      title: 'Bereit, Ihren API-Workflow zu transformieren?',
      subtitle: 'Schließen Sie sich Entwicklern an, die DataLive bereits nutzen, um ihren API-Integrationsprozess zu optimieren.',
      button: 'Mit Google beginnen'
    },
    footer: '2025 DataLive. KI-gestützte API-Intelligenzplattform.'
  },
  jp: {
    nav: { signIn: 'サインイン' },
    hero: {
      badge: 'AI駆動のAPIインテリジェンス',
      title1: 'あなたの',
      title2: ' APIデータ ',
      title3: 'を洞察に変換',
      subtitle: 'あらゆるドキュメントからAPIを自動的に発見、分析、統合します。AIにエンドポイント、認証、実行戦略を抽出させましょう。',
      cta: 'Googleで続ける',
      learnMore: '詳細を見る'
    },
    features: {
      title: '強力な機能',
      subtitle: 'APIを効率的に扱うために必要なすべて',
      ai: { title: 'AI駆動の分析', desc: 'PDFをアップロードするか、URLを入力してください。AIが自動的にエンドポイント、パラメータ、認証の詳細を抽出します。' },
      crawl: { title: 'Webクローリング', desc: 'ドキュメントサイトを再帰的にクロールして、利用可能なすべてのエンドポイントとリソースを発見します。' },
      org: { title: 'スマート整理', desc: '発見されたAPIをプロジェクトごとに自動的に分類および整理し、簡単に検索して使用できるようにします。' },
      exec: { title: '実行戦略', desc: '認証とベストプラクティスを含む、各APIを効果的に使用する方法に関するAI生成ガイドを取得します。' },
      secure: { title: '安全でプライベート', desc: 'データは暗号化され、安全に保存されます。Google OAuthが安全な認証を保証します。' },
      insights: { title: 'リアルタイムの洞察', desc: '発見されたAPIとその使用パターンに関する即座の洞察と分析を取得します。' }
    },
    cta: {
      title: 'APIワークフローを変革する準備はできていますか？',
      subtitle: 'すでにDataLiveを使用してAPI統合プロセスを合理化している開発者に参加してください。',
      button: 'Googleで始める'
    },
    footer: '2025 DataLive. AI駆動のAPIインテリジェンスプラットフォーム。'
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
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.jpg" alt="DataLive" width={180} height={40} className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Languages className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{languages.find(l => l.code === lang)?.flag}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          setLang(language.code as any);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors flex items-center space-x-3 ${lang === language.code ? 'bg-gray-800' : ''
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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">{t.hero.badge}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t.hero.title1}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t.hero.title2}</span>
              {t.hero.title3}
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignIn}
                className="group px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t.hero.cta}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all duration-200 border border-gray-800"
              >
                {t.hero.learnMore}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{t.features.title}</h2>
            <p className="text-xl text-gray-400">{t.features.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.ai.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.ai.desc}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.crawl.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.crawl.desc}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.org.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.org.desc}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-400 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.exec.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.exec.desc}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-400 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.secure.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.secure.desc}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.insights.title}</h3>
              <p className="text-gray-400 leading-relaxed">{t.features.insights.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">{t.cta.title}</h2>
          <p className="text-xl text-gray-400 mb-10">{t.cta.subtitle}</p>
          <button
            onClick={handleSignIn}
            className="group px-10 py-5 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-200 inline-flex items-center space-x-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{t.cta.button}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
