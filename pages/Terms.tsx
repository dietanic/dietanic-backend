
import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-12 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">Terms and Conditions</h1>
          <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-green max-w-none text-gray-700 space-y-12">
          
          {/* Section: General Terms */}
          <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
            <p className="mb-6 leading-relaxed">
              These Terms and Conditions (“Terms”) constitute a binding agreement between <strong>CULTLIV DIETANIC LLP</strong> (“we,” “us,” or “our”) and you (“you” or “your”), governing your use of our website and/or purchase of goods/services from us (collectively, “Services”).
            </p>
            <p className="mb-6 font-bold text-gray-900">
              By using our website and/or making a purchase from us, you expressly agree to the following Terms.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Use of Services</h3>
                <ul className="list-disc pl-5 space-y-2 marker:text-brand-500">
                  <li>You shall not use our website and/or Services for any purpose that is unlawful, illegal or prohibited under Indian laws, or any other local laws that might apply to you.</li>
                  <li>It is your responsibility to ensure that any goods, services, or information available through our website meet your specific requirements.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Orders & Availability</h3>
                <ul className="list-disc pl-5 space-y-2 marker:text-brand-500">
                  <li>You agree to provide accurate and complete information for order fulfilment and service delivery. We shall not be liable for issues resulting from incorrect or incomplete information you provide to us.</li>
                  <li>All purchases/orders are subject to availability.</li>
                  <li>We reserve the right to cancel orders at our discretion, including but not limited to cases of non-availability of goods you wish to purchase from us or if the order is suspected of fraud.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Payments</h3>
                <ul className="list-disc pl-5 space-y-2 marker:text-brand-500">
                  <li>Payments must be made in full at the time of purchase unless otherwise agreed upon by us.</li>
                  <li>You must ensure that the payment details provided are valid and belong to you.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Liability</h3>
                <ul className="list-disc pl-5 space-y-2 marker:text-brand-500">
                  <li>We shall not be liable for any loss or damage arising from the use of our Services, whether direct, indirect, or consequential.</li>
                  <li>We shall not be liable for any loss or damage arising directly or indirectly from the decline of authorization for any transaction due to the Cardholder exceeding the preset limit mutually agreed upon with our acquiring bank.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">5. Governing Law & Disputes</h3>
                <p>Any dispute arising out of the use of our website, purchase from us, or any engagement with us shall be subject to the laws of India.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">6. Contact Information</h3>
                <p>If you have any questions regarding these Terms, please contact us at <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline font-bold">maran@dietanic.co</a>.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
