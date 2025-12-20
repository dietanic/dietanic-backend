
import React from 'react';
import { Shield, Lock, Database, Eye } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-12 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-full mb-4">
            <Shield className="text-brand-600 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Your privacy is critically important to us. Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-green max-w-none text-gray-700 space-y-12">
          
          {/* Section: Data Collection */}
          <section className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
               <Database className="text-brand-500" size={24} /> Information We Collect
            </h2>
            <p className="mb-4">
                We collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4 text-sm text-gray-600">
                <li><strong>Personal Information:</strong> Name, email address, phone number, and delivery address to process your orders.</li>
                <li><strong>Health Data (Optional):</strong> Dietary preferences and allergies you provide to our AI Nutritionist to customize your meal plans.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, such as pages visited and time spent.</li>
            </ul>
          </section>

          {/* Section: Data Security & PCI (Moved from Terms) */}
          <section className="bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Lock size={120} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-slate-700 relative z-10">Data Security & PCI Compliance</h2>
            <div className="space-y-4 relative z-10 text-slate-300">
                <p>
                    <strong>CULTLIV DIETANIC LLP</strong> is committed to the highest standards of transaction security. 
                    We are <strong>PCI DSS (SAQ-D) Compliant</strong>, ensuring that your financial data is handled with strict adherence to the Payment Card Industry Data Security Standard.
                </p>
                <ul className="list-disc pl-5 space-y-3">
                    <li>We <span className="text-white font-bold">do not store</span> your raw credit card numbers, CVV, or expiration dates on our servers.</li>
                    <li>All payment transactions are processed through secure, encrypted gateways using TLS 1.2 or higher.</li>
                    <li>We maintain a rigorous firewall configuration and perform regular vulnerability scans to protect user data.</li>
                    <li>Access to payment data is strictly restricted on a business need-to-know basis.</li>
                </ul>
            </div>
          </section>

          {/* Section: Use of Data */}
          <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
               <Eye className="text-brand-500" size={24} /> How We Use Your Information
            </h2>
            <ul className="space-y-4">
                <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                    <p><strong>Order Fulfillment:</strong> To prepare and deliver your salads and subscriptions accurately.</p>
                </li>
                <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                    <p><strong>Personalization:</strong> To recommend meals based on your previous orders and dietary preferences.</p>
                </li>
                <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0"></div>
                    <p><strong>Communication:</strong> To send order updates, invoices, and relevant promotional offers (which you can opt-out of).</p>
                </li>
            </ul>
          </section>

          {/* Section: Contact */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-500 mb-2">Questions about your data?</p>
            <a href="mailto:privacy@dietanic.co" className="text-brand-600 font-bold hover:underline">privacy@dietanic.co</a>
          </div>

        </div>
      </div>
    </div>
  );
};
