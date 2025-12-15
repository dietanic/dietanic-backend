import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Truck, Star } from 'lucide-react';

const faqs = [
  {
    question: "How does the subscription work?",
    answer: "Choose your plan (weekly, bi-weekly, or monthly), select your favorite salads, and we'll deliver them fresh to your door on your chosen schedule. You can pause or cancel anytime."
  },
  {
    question: "Where do you deliver?",
    answer: "We currently deliver to the greater metro area within a 20 km radius of our central kitchen. We pride ourselves on local delivery to ensure maximum freshness for your greens."
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

export const Home: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-brand-900 py-24 sm:py-32">
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Fresh Salad Background"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Freshness Delivered Daily.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Dietanic brings premium, organic salads and healthy meal subscriptions straight to your doorstep. Eat clean, live green.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/shop"
                className="rounded-full bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 transition-all"
              >
                Shop Now
              </Link>
              <Link to="/about" className="text-sm font-semibold leading-6 text-white flex items-center gap-1">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-600">Why Dietanic?</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for a healthy lifestyle
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                  <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Organic Ingredients
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Sourced from local farms, ensuring the highest quality and nutritional value in every bite.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                  <Truck className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Fast Delivery
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We deliver your meals fresh daily or weekly, right to your home or office.
              </dd>
            </div>
             <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                  <Star className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Chef Curated
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Recipes designed by top chefs and nutritionists to balance flavor and health.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-600">FAQ</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600">
                Have questions about our subscriptions or delivery? We've got answers.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <dl className="space-y-8 divide-y divide-gray-900/10">
              {faqs.map((faq, index) => (
                <div key={index} className="pt-8 lg:mt-4 first:pt-0">
                  <dt className="text-lg font-semibold leading-7 text-gray-900">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};