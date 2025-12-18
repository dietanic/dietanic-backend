
import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Terms and Conditions</h1>
          <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-green max-w-none text-gray-700 space-y-12">
          
          {/* Section: General Terms */}
          <section className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
            <p className="mb-6">
              These Terms and Conditions (“Terms”) constitute a binding agreement between <strong>CULTLIV DIETANIC LLP</strong> (“we,” “us,” or “our”) and you (“you” or “your”), governing your use of our website and/or purchase of goods/services from us (collectively, “Services”).
            </p>
            <p className="mb-6 font-medium">
              By using our website and/or making a purchase from us, you expressly agree to the following Terms.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Use of Services</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You shall not use our website and/or Services for any purpose that is unlawful, illegal or prohibited under Indian laws, or any other local laws that might apply to you.</li>
                  <li>It is your responsibility to ensure that any goods, services, or information available through our website meet your specific requirements.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Orders & Availability</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You agree to provide accurate and complete information for order fulfilment and service delivery. We shall not be liable for issues resulting from incorrect or incomplete information you provide to us.</li>
                  <li>All purchases/orders are subject to availability.</li>
                  <li>We reserve the right to cancel orders at our discretion, including but not limited to cases of non-availability of goods you wish to purchase from us or if the order is suspected of fraud.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Payments</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Payments must be made in full at the time of purchase unless otherwise agreed upon by us.</li>
                  <li>You must ensure that the payment details provided are valid and belong to you.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Liability</h3>
                <ul className="list-disc pl-5 space-y-1">
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
                <p>If you have any questions regarding these Terms, please contact us at <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline">maran@dietanic.co</a> / 9486919916.</p>
              </div>
            </div>
          </section>

          {/* Section: Data Security & PCI */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Data Security & PCI Compliance</h2>
            <div className="space-y-4">
                <p>
                    <strong>CULTLIV DIETANIC LLP</strong> is committed to the highest standards of transaction security. 
                    We are <strong>PCI DSS (SAQ-D) Compliant</strong>, ensuring that your financial data is handled with strict adherence to the Payment Card Industry Data Security Standard.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>We do not store your raw credit card numbers, CVV, or expiration dates on our servers.</li>
                    <li>All payment transactions are processed through secure, encrypted gateways using TLS 1.2 or higher.</li>
                    <li>We maintain a rigorous firewall configuration and perform regular vulnerability scans to protect user data.</li>
                    <li>Access to payment data is strictly restricted on a business need-to-know basis.</li>
                </ul>
            </div>
          </section>

          {/* Section: Refund & Cancellation */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Refund and Cancellation Policy</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-brand-700">Cancellation Terms</h3>
                <p className="leading-relaxed">
                  After making payment to CULTLIV DIETANIC LLP, customers may request for cancelling the order within <strong>48 hours</strong> of payment by contacting <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline">maran@dietanic.co</a> or 9486919916. CULTLIV DIETANIC LLP reserves the right to accept or reject any cancellation request at its sole discretion, including cases where order processing, dispatch, or service preparation has already begun. Any concerns or disputes will be handled directly between CULTLIV DIETANIC LLP and the customer.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-brand-700">Replacement Terms</h3>
                <p className="leading-relaxed mb-2">
                  CULTLIV DIETANIC LLP entertains requests for replacement only in cases of proven product defects, damage during transit, or service issues. Refunds are not provided under any circumstances.
                </p>
                <p className="leading-relaxed mb-2">
                  To request a replacement, customers must contact CULTLIV DIETANIC LLP via <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline">maran@dietanic.co</a> or 9486919916 within <strong>1 day</strong> of delivery / service completion, along with the invoices, order information and supporting details to establish the alleged defects, damages, or deficiencies.
                </p>
                <p className="leading-relaxed">
                  CULTLIV DIETANIC LLP may accept or reject a replacement request at its sole discretion. If CULTLIV DIETANIC LLP approves the replacement request, the replacement will be processed within the timeline communicated by CULTLIV DIETANIC LLP. Any concerns or disputes will be handled directly between CULTLIV DIETANIC LLP and the customer.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-brand-700">Refund Terms</h3>
                <p className="leading-relaxed mb-2">
                  CULTLIV DIETANIC LLP entertains requests for refunds only in cases of proven defects in product, damage during transit, service issues. To make a request, customers should contact CULTLIV DIETANIC LLP via <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline">maran@dietanic.co</a> or 9486919916 within <strong>7 days</strong> of delivery / service completion with the invoices, order information and supporting information to establish the alleged defects, damages or deficiencies.
                </p>
                <p className="leading-relaxed">
                  CULTLIV DIETANIC LLP may accept or reject a request for refund at its sole discretion. If CULTLIV DIETANIC LLP approves the refund request, refunds will be processed within the timeline communicated by CULTLIV DIETANIC LLP. Any concerns or disputes will be handled directly between CULTLIV DIETANIC LLP and the customer.
                </p>
              </div>

              <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 mt-6">
                <h4 className="font-bold text-gray-900 mb-1">Support Contact</h4>
                <p className="text-sm text-gray-600">
                  For any cancellation, refund, or return requests, please contact us at <a href="mailto:support@dietanic.co" className="text-brand-600 font-medium">support@dietanic.co</a> / 9486919916.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
