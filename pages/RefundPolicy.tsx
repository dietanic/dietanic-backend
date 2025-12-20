
import React from 'react';
import { RotateCcw, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen py-12 pt-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-full mb-4">
            <RotateCcw className="text-brand-600 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">Refund & Cancellation Policy</h1>
          <p className="text-gray-500">We want you to love your meal. Here's how we handle issues.</p>
        </div>

        <div className="space-y-8">
          
          {/* Cancellation */}
          <section className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Cancellation Terms</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                    After making payment to CULTLIV DIETANIC LLP, customers may request for cancelling the order within <strong>48 hours</strong> of payment by contacting <a href="mailto:maran@dietanic.co" className="text-brand-600 hover:underline font-bold">maran@dietanic.co</a> or 9486919916. 
                    <br/><br/>
                    CULTLIV DIETANIC LLP reserves the right to accept or reject any cancellation request at its sole discretion, including cases where order processing, dispatch, or service preparation has already begun. Any concerns or disputes will be handled directly between CULTLIV DIETANIC LLP and the customer.
                    </p>
                </div>
            </div>
          </section>

          {/* Replacement */}
          <section className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Replacement Terms</h3>
                    <p className="text-gray-600 leading-relaxed text-sm mb-4">
                    CULTLIV DIETANIC LLP entertains requests for replacement only in cases of proven product defects, damage during transit, or service issues. Refunds are not provided under any circumstances for taste preferences alone.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-700 space-y-2">
                        <p>To request a replacement, please contact us within <strong>1 day</strong> of delivery / service completion with:</p>
                        <ul className="list-disc pl-5">
                            <li>Order Invoice</li>
                            <li>Order Information</li>
                            <li>Photos/Details establishing defects or damage</li>
                        </ul>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm mt-4">
                    If approved, the replacement will be processed within the communicated timeline.
                    </p>
                </div>
            </div>
          </section>

          {/* Refunds */}
          <section className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Refund Terms</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                    CULTLIV DIETANIC LLP entertains requests for refunds only in cases of proven defects in product, damage during transit, or service issues where replacement is not possible.
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm mt-4">
                    Requests must be made within <strong>7 days</strong> of delivery. CULTLIV DIETANIC LLP may accept or reject a request for refund at its sole discretion. Approved refunds will be processed to the original payment method.
                    </p>
                </div>
            </div>
          </section>

          {/* Support Box */}
          <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h4 className="font-bold text-gray-900 mb-1">Need help with an order?</h4>
                <p className="text-sm text-gray-600">
                  Our support team is available Mon-Sat, 9AM - 7PM.
                </p>
            </div>
            <div className="text-right">
                <a href="mailto:support@dietanic.co" className="block text-brand-700 font-bold hover:underline">support@dietanic.co</a>
                <span className="text-sm text-gray-500 font-mono">9486919916</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
