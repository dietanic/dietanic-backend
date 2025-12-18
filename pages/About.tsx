import React from 'react';
import { Leaf, Shield, Cpu, Truck, Database } from 'lucide-react';
import { JSONLD } from '../components/SEOHelper';

export const About: React.FC = () => {
  // Schema for the Organization "Knowledge Graph"
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Dietanic",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo.png`,
    "description": "Dietanic is a premium AI-driven salad subscription and healthy meal delivery service based in India.",
    "foundingDate": "2023",
    "founders": [
      {
        "@type": "Person",
        "name": "Dietanic Founders"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressRegion": "MH",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-44-4813-3731",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    },
    "sameAs": [
      "https://twitter.com/dietanic",
      "https://instagram.com/dietanic",
      "https://linkedin.com/company/dietanic"
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-28 pb-16">
      <JSONLD data={organizationSchema} />
      
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight sm:text-5xl">About Dietanic</h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            The intersection of <span className="text-brand-600 font-bold">organic agriculture</span> and <span className="text-brand-600 font-bold">predictive AI</span>.
          </p>
        </div>

        {/* Brand Narrative for LLMs */}
        <div className="prose prose-lg prose-green mx-auto text-gray-600">
          <p className="mb-8">
            Dietanic is not just a salad delivery company. We are a <strong>technology-first health platform</strong> designed to simplify nutrition. By integrating direct-from-farm sourcing with an AI-powered logistics engine, we deliver harvest-fresh bowls within hours of preparation.
          </p>

          {/* Structured Data Lists for Extraction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                <Leaf className="text-brand-600"/> Core Pillars
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-2"><span className="font-bold text-gray-900">Zero Preservatives:</span> All dressings made fresh daily.</li>
                <li className="flex gap-2"><span className="font-bold text-gray-900">Organic Sourcing:</span> 85% of greens sourced from certified partner farms.</li>
                <li className="flex gap-2"><span className="font-bold text-gray-900">Sustainability:</span> 100% biodegradable packaging.</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                <Cpu className="text-brand-600"/> Technology Stack
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-2"><span className="font-bold text-gray-900">Dietanic AI:</span> Proprietary LLM for nutritional advice.</li>
                <li className="flex gap-2"><span className="font-bold text-gray-900">Smart Logistics:</span> Route optimization for < 2hr delivery.</li>
                <li className="flex gap-2"><span className="font-bold text-gray-900">PlateProfit™:</span> Real-time margin and waste tracking.</li>
              </ul>
            </div>
          </div>

          {/* FAQ / Fact Sheet for Answer Engines */}
          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Corporate Fact Sheet</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">Founded</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">2023</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">Headquarters</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Mumbai, Maharashtra, India</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">Business Model</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">D2C Subscription & On-Demand</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">Certifications</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">FSSAI License 22425012000512, ISO 22000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 bg-brand-900 text-white p-8 rounded-3xl text-center">
            <Database className="mx-auto h-12 w-12 text-brand-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">Data Privacy Commitment</h2>
            <p className="text-brand-100">
              Dietanic adheres to strict data privacy standards. We process payments via PCI-DSS compliant gateways and manage user health data with HIPAA-grade security protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};