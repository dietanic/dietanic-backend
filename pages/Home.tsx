
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Leaf, Zap, Shield, Heart, ArrowRight, Star, ExternalLink, Utensils, Rss, BrainCircuit } from 'lucide-react';
import { useAuth } from '../App';
import { BlogPost, Product, Review } from '../types';
import { CatalogService, EngagementService, KnowledgeService } from '../services/storeService';

const FeatureCard = ({ icon, title, text, index }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

    useEffect(() => {
        if (inView) {
            controls.start('visible');
        } 
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 } }
    };

    return (
        <motion.div ref={ref} initial="hidden" animate={controls} variants={variants} className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-lg text-center h-full flex flex-col">
            <div className="mx-auto mb-4 bg-brand-500/10 p-4 rounded-full text-brand-400">{icon}</div>
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-white/70 leading-relaxed flex-grow">{text}</p>
        </motion.div>
    );
};

const ProductCard = ({ product, index }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

    useEffect(() => {
        if (inView) controls.start('visible');
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: index * 0.1 } }
    };

    return (
        <motion.div ref={ref} initial="hidden" animate={controls} variants={variants} className="bg-slate-800/50 rounded-2xl overflow-hidden group border border-white/10">
            <div className="h-48 bg-gray-700 relative">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                <span className="absolute top-3 right-3 bg-brand-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">{product.category}</span>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 truncate">{product.name}</h3>
                <p className="text-sm text-white/60 mb-4 h-10 overflow-hidden">{product.description}</p>
                <div className="flex justify-between items-center">
                    <p className="text-xl font-black text-brand-400">₹{product.price}</p>
                    <Link to={`/product/${product.id}`} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-500 transition-colors">View</Link>
                </div>
            </div>
        </motion.div>
    );
};

const TestimonialCard = ({ review, index }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });

    useEffect(() => {
        if (inView) controls.start('visible');
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6, delay: index * 0.2 } }
    };

    return (
        <motion.div ref={ref} initial="hidden" animate={controls} variants={variants} className="bg-gray-800/60 p-6 rounded-xl border border-white/10">
            <div className="flex items-center mb-4">
                <img src={review.userProfile.avatar} alt={review.userProfile.name} className="w-12 h-12 rounded-full mr-4 object-cover"/>
                <div>
                    <h4 className="font-bold text-white">{review.userProfile.name}</h4>
                    <div className="flex text-yellow-400">
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                        {[...Array(5 - review.rating)].map((_, i) => <Star key={i} size={16} className="opacity-30" />)}
                    </div>
                </div>
            </div>
            <p className="text-white/80 italic">"{review.comment}"</p>
        </motion.div>
    )
}

const BlogCard = ({ post, index }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

    useEffect(() => {
        if (inView) controls.start('visible');
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 } }
    };

    return (
        <motion.a href={post.url} target="_blank" ref={ref} initial="hidden" animate={controls} variants={variants} className="bg-slate-800/50 rounded-2xl overflow-hidden group block border border-white/10 hover:border-brand-500/50 transition-colors">
            <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">{post.title}</h3>
                <p className="text-sm text-white/60 mb-4 h-16 overflow-hidden">{post.summary}</p>
                <div className="flex justify-between items-center text-xs text-white/40">
                    <span>{post.source} &bull; {new Date(post.publishedDate).toLocaleDateString()}</span>
                    <ExternalLink size={16}/>
                </div>
            </div>
        </motion.a>
    )
}

const Section = ({ children, className = '' }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

    useEffect(() => {
        if (inView) {
            controls.start('visible');
        }
    }, [controls, inView]);

    return (
        <motion.section 
            ref={ref} 
            initial={{ opacity: 0, y: 100 }}
            animate={controls}
            variants={{ visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }} }}
            className={`py-20 sm:py-32 ${className}`}>
            {children}
        </motion.section>
    )
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [posts, setPosts] = React.useState<BlogPost[]>([]);

  React.useEffect(() => {
    async function fetchData() {
        const [p, r, b] = await Promise.all([
            CatalogService.getProducts(4),
            EngagementService.getReviews(3),
            KnowledgeService.getRecentBlogPosts(3)
        ]);
        setProducts(p);
        setReviews(r);
        setPosts(b);
    }
    fetchData();
  }, []);

  const heroControls = useAnimation();
  useEffect(() => {
    heroControls.start(i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.8, ease: "easeOut" },
    }))
  }, [heroControls]);

  return (
    <div className="bg-slate-900 text-white scroll-smooth">
      {/* --- Hero Section --- */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900 to-gray-800">
          <div className="absolute inset-0 bg-[url('/img/hero-bg-pattern.svg')] opacity-5"></div>
          <div className="absolute -bottom-1/3 -left-48 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none"></div>
          <div className="absolute -top-1/4 -right-48 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none"></div>

          <div className="text-center z-10 p-4">
            <motion.div custom={0} initial={{ opacity: 0, y: 20 }} animate={heroControls}>
                <img src="/img/logo-symbol.png" alt="Dietanic Logo" className="mx-auto h-24 mb-6"/>
            </motion.div>
            <motion.h1 custom={1} initial={{ opacity: 0, y: 20 }} animate={heroControls} className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-tight tracking-tight shadow-text">
              Eat Well, Live Fully.
            </motion.h1>
            <motion.p custom={2} initial={{ opacity: 0, y: 20 }} animate={heroControls} className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/70">
              Delicious, nutritious meals and premium products delivered to your door. Your journey to a healthier lifestyle starts here.
            </motion.p>
            <motion.div custom={3} initial={{ opacity: 0, y: 20 }} animate={heroControls} className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link to="/products" className="bg-brand-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-all transform hover:scale-105 flex items-center gap-2">
                Shop Now <ArrowRight size={20}/>
              </Link>
              <Link to="/about" className="bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
                Book a Table
              </Link>
            </motion.div>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce hidden sm:block">
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                  <div className="w-1 h-2 bg-white/50 rounded-full"></div>
              </div>
          </div>
      </section>

      {/* --- Why Dietanic Section --- */}
      <Section className="bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">Why Dietanic?</h2>
              <p className="text-lg text-white/60 mt-4">We're more than just food. We're a commitment to your health, taste, and convenience.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard index={0} icon={<Leaf size={28}/>} title="Pure Ingredients" text="We source only the freshest, highest-quality organic ingredients for every meal."/>
              <FeatureCard index={1} icon={<Zap size={28}/>} title="Peak Freshness" text="Our meals are prepared daily and delivered fast, ensuring farm-to-table freshness."/>
              <FeatureCard index={2} icon={<Shield size={28}/>} title="No Compromises" text="Free from artificial preservatives, colors, or flavors. Just pure, wholesome goodness."/>
              <FeatureCard index={3} icon={<Heart size={28}/>} title="Made with Love" text="Every dish is crafted by our expert chefs with passion and a deep love for healthy food."/>
            </div>
          </div>
      </Section>

      {/* --- Featured Products Section --- */}
      <Section>
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">Featured Products</h2>
              <p className="text-lg text-white/60 mt-4">Hand-picked selections from our customers' favorites. Healthy, delicious, and ready for you.</p>
            </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
           <div className="text-center mt-16">
                <Link to="/products" className="bg-white/10 text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-sm">
                  Explore All Products
              </Link>
            </div>
        </div>
      </Section>
      
      {/* --- Testimonials Section --- */}
      {reviews.length > 0 && (
        <Section className="bg-gray-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">What Our Customers Say</h2>
              <p className="text-lg text-white/60 mt-4">We're humbled by the love and support from our community. Here’s what they share about their Dietanic experience.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {reviews.map((r, i) => <TestimonialCard key={r.id} review={r} index={i} />)}
            </div>
          </div>
        </Section>
      )}

      {/* --- Blog Section --- */}
      {posts.length > 0 && (
          <Section>
              <div className="container mx-auto px-4">
                   <div className="text-center max-w-3xl mx-auto mb-16">
                      <h2 className="text-4xl sm:text-5xl font-bold text-white">From Our Journal</h2>
                      <p className="text-lg text-white/60 mt-4">Insights on nutrition, wellness tips, and delicious recipes from the Dietanic team and community.</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {posts.map((p, i) => <BlogCard key={p.id} post={p} index={i} />)}
                  </div>
              </div>
          </Section>
      )}

      {/* --- CTA Section --- */}
       <Section className="relative overflow-hidden">
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="container mx-auto px-4 z-10 relative">
                <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-3xl p-12 lg:p-20 text-center shadow-2xl shadow-brand-500/20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">Ready to Elevate Your Diet?</h2>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
                        Join thousands of happy customers transforming their health and enjoying every bite. Get started today!
                    </p>
                    <div className="mt-10">
                         <Link to="/products" className="bg-white text-brand-600 px-10 py-5 rounded-full font-bold text-xl shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105">
                            Start Your Journey
                        </Link>
                    </div>
                </div>
            </div>
       </Section>

    </div>
  );
};
