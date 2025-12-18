import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { JSONLD } from './SEOHelper';

const faqs = [
  {
    question: "How does the subscription work?",
    answer: "Choose your plan (weekly, bi-weekly, or monthly), select your favorite salads, and we'll deliver them fresh to your door. You can pause or cancel anytime."
  },
  {
    question: "Is there support available?",
    answer: "Yes! Use our 'Instant Answers' chat widget to talk to our AI Nutritionist instantly about ingredients, allergies, or your order status."
  },
  {
    question: "Are the ingredients organic?",
    answer: "Yes! We partner with local certified organic farms to source the freshest greens and produce available. Quality is our top priority."
  },
  {
    question: "Can I customize my meals?",
    answer: "Absolutely. While we offer curated signature salads, you can request ingredient swaps in your account preferences."
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="bg-gray-50 py-24 sm:py-32">
        <JSONLD data={faqSchema} />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-brand-600">FAQ</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600">
                Have questions? We've got answers.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <dl className="space-y-6 divide-y divide-gray-900/10">
              {faqs.map((faq, index) => (
                <div key={index} className="pt-6">
                  <dt>
                    <button
                        onClick={() => toggleIndex(index)}
                        className="flex w-full items-start justify-between text-left text-gray-900 focus:outline-none group"
                    >
                        <span className={`text-lg font-semibold leading-7 transition-colors ${openIndex === index ? 'text-brand-600' : 'group-hover:text-brand-600'}`}>
                            {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                            {openIndex === index ? (
                                <ChevronUp className="h-6 w-6 text-brand-600" aria-hidden="true" />
                            ) : (
                                <ChevronDown className="h-6 w-6 text-gray-400 group-hover:text-brand-600" aria-hidden="true" />
                            )}
                        </span>
                    </button>
                  </dt>
                  {openIndex === index && (
                    <dd className="mt-4 pr-12 animate-fade-in origin-top">
                        <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
  );
};