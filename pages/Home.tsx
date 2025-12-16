
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Truck, Star, TrendingUp, Dumbbell, Shield, RefreshCw, MessageSquare } from 'lucide-react';

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
            <div className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold text-brand-400 ring-1 ring-inset ring-brand-500/20 mb-6">
                Fresh & Organic 🌿
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Turn your healthy diet into a lifestyle.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Dietanic isn't just about salads; it's about giving you instant, accurate answers to your nutritional needs. Join our community and turn from a prospect into a fan.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/shop"
                className="rounded-full bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 transition-all"
              >
                Explore Menu
              </Link>
              <Link to="/about" className="text-sm font-semibold leading-6 text-white flex items-center gap-1">
                Our Story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Answers Feature Highlight */}
      <div className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Instant, Accurate Answers.</h2>
                  <p className="text-lg text-gray-600 mb-6">
                      Not sure which bowl fits your macros? Wondering about allergens? Our AI Nutritionist is available 24/7 to turn your questions into confidence.
                  </p>
                  <button onClick={() => document.querySelector<HTMLElement>('.fixed.bottom-6.right-6 button')?.click()} className="flex items-center gap-2 text-brand-600 font-bold hover:text-brand-700">
                      <MessageSquare /> Try the Chat Now
                  </button>
              </div>
              <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative">
                  <div className="space-y-4">
                      <div className="flex justify-end"><div className="bg-brand-600 text-white p-3 rounded-2xl rounded-tr-none text-sm">Is the Green Goddess keto-friendly?</div></div>
                      <div className="flex justify-start"><div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-none text-sm">Yes! It contains only 8g net carbs and is packed with healthy fats from avocado.</div></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Why plant based diet works better */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-600">The Dietanic Method</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why plant based works better 🍃
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Scientific approach to nutrition that delivers sustainable health benefits.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-50">
                    <TrendingUp className="h-6 w-6 text-brand-600" aria-hidden="true" />
                  </div>
                  Results that last
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Achieve standard weight management with our diet. We include personalized nutrition to lock in long-term success.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-50">
                    <Dumbbell className="h-6 w-6 text-brand-600" aria-hidden="true" />
                  </div>
                  Muscle Strength
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Our Dietanic™ protocol pairs muscle gain with strength training to prevent muscle loss and support metabolism.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-50">
                    <Shield className="h-6 w-6 text-brand-600" aria-hidden="true" />
                  </div>
                  Immunity Defense
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">We tailor your nutrition carefully to keep you energized, comfortable, and in full control of your health.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-50">
                    <RefreshCw className="h-6 w-6 text-brand-600" aria-hidden="true" />
                  </div>
                  Sustainable
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">We help you build habits that stick — so your progress continues naturally, turning you into a lifelong fan.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 border-t border-gray-100">
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
                Have questions? We've got answers.
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
