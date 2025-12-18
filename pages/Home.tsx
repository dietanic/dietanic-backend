import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Truck, Star, TrendingUp, Dumbbell, Shield, RefreshCw, MessageSquare, Apple, CheckCircle2 } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { JSONLD } from '../components/SEOHelper';

export const Home: React.FC = () => {
  useEffect(() => {
    // Dynamic Metadata Injection
    document.title = "Dietanic - Premium Healthy Meal Subscriptions & Fresh Salads";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Dietanic delivers organic, chef-curated healthy meal subscriptions and fresh salads directly to your doorstep. Experience premium plant-based nutrition designed for weight management and immunity.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Dietanic delivers organic, chef-curated healthy meal subscriptions and fresh salads directly to your doorstep. Experience premium plant-based nutrition designed for weight management and immunity.";
      document.head.appendChild(meta);
    }
  }, []);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Dietanic",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/shop?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="bg-white">
      <JSONLD data={websiteSchema} />
      
      {/* Hero Section */}
      <section className="relative isolate h-screen min-h-[600px] flex items-center overflow-hidden" aria-label="Welcome to Dietanic">
        {/* Background Image - Descriptive Alt for SEO */}
        <img
          src="https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=2070&auto=format&fit=crop"
          alt="Fresh organic fruit and salad bowl with vibrant colors - Dietanic Healthy Meals"
          className="absolute inset-0 -z-20 h-full w-full object-cover animate-scale-in-slow"
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 w-full">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-black text-white ring-1 ring-inset ring-white/20 mb-8 animate-fade-in border border-white/10">
                <span className="mr-2">🍓</span> Fresh Organic Season is Here
            </div>
            {/* SEO: Primary Keyword in H1 */}
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-6 drop-shadow-2xl">
              Fresh <span className="text-brand-400 underline decoration-brand-400/30">Salad Delivery</span> <br/>& Healthy Subscriptions.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-200 drop-shadow-md max-w-xl font-light">
              From organic fruit bowls to protein-packed salad subscriptions, Dietanic delivers premium health directly to your home. Sustain your lifestyle with chef-curated meal plans.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/shop"
                className="rounded-full bg-brand-600 px-8 py-4 text-sm font-black text-white shadow-lg hover:bg-brand-500 hover:shadow-brand-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 transition-all transform hover:scale-105"
              >
                Order Fresh Salads
              </Link>
              <Link to="/shop?category=Weekly%20Subscriptions" className="text-sm font-bold leading-6 text-white flex items-center gap-2 hover:gap-3 transition-all drop-shadow-md hover:text-brand-300">
                View Subscription Plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce hidden sm:block">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white/50 rounded-full"></div>
            </div>
        </div>
      </section>

      {/* Featured Keywords Section for SEO */}
      <div className="bg-white py-12 border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-sm font-bold tracking-widest text-gray-900 flex items-center gap-2 uppercase"><Apple size={16}/> Organic Sourced</span>
                  <span className="text-sm font-bold tracking-widest text-gray-900 flex items-center gap-2 uppercase"><CheckCircle2 size={16}/> Zero Preservatives</span>
                  <span className="text-sm font-bold tracking-widest text-gray-900 flex items-center gap-2 uppercase"><Truck size={16}/> Daily Delivery</span>
                  <span className="text-sm font-bold tracking-widest text-gray-900 flex items-center gap-2 uppercase"><Shield size={16}/> FSSAI Certified</span>
              </div>
          </div>
      </div>

      {/* Instant Answers Feature Highlight */}
      <section className="bg-gray-50 py-24" aria-labelledby="ai-nutritionist-heading">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                  <h2 id="ai-nutritionist-heading" className="text-3xl font-black text-gray-900 mb-4">Your Personal AI Nutritionist.</h2>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      Finding the right <span className="font-bold text-gray-900">healthy meal plan</span> can be confusing. Our integrated Dietanic AI provides instant answers on macro counts, allergens, and dietary recommendations 24/7.
                  </p>
                  <button 
                    onClick={() => document.querySelector<HTMLElement>('.fixed.bottom-6.right-6 button')?.click()} 
                    className="bg-white border border-gray-200 px-6 py-3 rounded-full flex items-center gap-3 text-brand-600 font-black hover:bg-brand-50 hover:border-brand-200 transition-all shadow-sm"
                  >
                      <MessageSquare /> Chat with Dietitian AI
                  </button>
              </div>
              <div className="flex-1 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-500/20 transition-all"></div>
                  <div className="space-y-6 relative z-10">
                      <div className="flex justify-end">
                          <div className="bg-brand-600 text-white px-5 py-3 rounded-2xl rounded-tr-none text-sm font-medium shadow-md">
                              Is the Quinoa Power Bowl high in protein?
                          </div>
                      </div>
                      <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tl-none text-sm border border-gray-200">
                              Yes! It packs <span className="font-bold">18g of plant-based protein</span> and provides sustained energy with complex carbs.
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Why plant based diet works better */}
      <section className="bg-white py-24 sm:py-32" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 id="benefits-heading" className="text-base font-black leading-7 text-brand-600 uppercase tracking-widest">Scientific Nutrition</h2>
            <p className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Why Our Plant-Based Meal Plans Win 🍃
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Dietanic isn't just about salads. It's a bio-optimized approach to food that fuels your body and brain.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              <div className="flex flex-col p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all hover:bg-white hover:shadow-lg group">
                <dt className="flex items-center gap-x-3 text-base font-black leading-7 text-gray-900 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Measurable Results
                </dt>
                <dd className="flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto italic font-medium">Sustainable weight management through calorie-controlled, high-fiber meal subscriptions that keep you full and focused.</p>
                </dd>
              </div>
              <div className="flex flex-col p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all hover:bg-white hover:shadow-lg group">
                <dt className="flex items-center gap-x-3 text-base font-black leading-7 text-gray-900 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Peak Performance
                </dt>
                <dd className="flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto italic font-medium">The Dietanic™ protocol pairs nutrient density with metabolic support to prevent energy crashes and build lean muscle.</p>
                </dd>
              </div>
              <div className="flex flex-col p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all hover:bg-white hover:shadow-lg group">
                <dt className="flex items-center gap-x-3 text-base font-black leading-7 text-gray-900 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Immune Defense
                </dt>
                <dd className="flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto italic font-medium">Vitamins and antioxidants delivered in their whole-food state for maximum bio-availability and cold/flu resilience.</p>
                </dd>
              </div>
              <div className="flex flex-col p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all hover:bg-white hover:shadow-lg group">
                <dt className="flex items-center gap-x-3 text-base font-black leading-7 text-gray-900 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                    <RefreshCw className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Zero Waste Effort
                </dt>
                <dd className="flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto italic font-medium">We handle the shopping, washing, and chopping. You focus on living. Freshness guaranteed with every delivery.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-24 border-t border-gray-100" aria-labelledby="why-dietanic-heading">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 id="why-dietanic-heading" className="text-base font-black leading-7 text-brand-600 uppercase tracking-widest">The Dietanic Edge</h2>
          <p className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Everything for your Health Journey
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-bold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                  <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Certified Organic Ingredients
              </dt>
              <dd className="mt-2 text-sm leading-7 text-gray-600">
                Sourced from local partner farms, ensuring the highest quality, non-GMO produce in every single bowl.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-bold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                  <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Express Salad Delivery
              </dt>
              <dd className="mt-2 text-sm leading-7 text-gray-600">
                Optimized logistics to ensure your leafy greens stay crisp from our kitchen to your door within 2 hours.
              </dd>
            </div>
             <div className="relative pl-16">
              <dt className="text-base font-bold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/30">
                  <Star className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Nutritionist Designed
              </dt>
              <dd className="mt-2 text-sm leading-7 text-gray-600">
                Each recipe is a balance of flavor and functional health, reviewed by clinical nutritionists.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* FAQ Section Component */}
      <FAQSection />
    </div>
  );
};