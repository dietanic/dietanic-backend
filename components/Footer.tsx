
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-white/75 backdrop-blur-lg text-gray-600 py-16 border-t border-white/50 mt-auto shadow-[0_-4px_30px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Column 1 */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li><Link to="/shop" className="hover:text-brand-600 transition-colors">Order Now</Link></li>
              <li><Link to="/book-table" className="hover:text-brand-600 transition-colors">Book a Table</Link></li>
              <li><Link to="/account" className="hover:text-brand-600 transition-colors">Customer Portal</Link></li>
            </ul>
          </div>
          {/* Column 2 */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6 tracking-wide">Business</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li><Link to="/vendor-portal" className="hover:text-brand-600 transition-colors">Vendor Connect</Link></li>
              <li><Link to="/admin" className="hover:text-brand-600 transition-colors">Administration</Link></li>
              <li><Link to="/delivery" className="hover:text-brand-600 transition-colors">Logistics</Link></li>
            </ul>
          </div>
          {/* Column 3 */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6 tracking-wide">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li><Link to="/terms" className="hover:text-brand-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-brand-600 transition-colors">Refund Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          {/* Column 4 */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6 tracking-wide">Contact</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-600 mb-6">
              <li>support@dietanic.co</li>
              <li>+91 44 4813 3731</li>
            </ul>
            
            <h4 className="text-gray-900 font-bold mb-3 tracking-wide text-xs uppercase">Compliance</h4>
            <ul className="space-y-1 text-xs text-gray-500 font-mono">
              <li>GSTIN: Unregistered</li>
              <li>FSSAI: 22425012000512</li>
              <li>LLPIN: ACP-6488</li>
              <li>MSME: UDYAM-TN-03-0282496</li>
              <li>Startup India: DIPP222593</li>
              <li>PAN: AAVFC3630R</li>
              <li>TAN: CHEC19296E</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dietanic. Crafted for health.</p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-600 hover:text-white transition-all transform hover:scale-110" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-600 hover:text-white transition-all transform hover:scale-110" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-600 hover:text-white transition-all transform hover:scale-110" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-600 hover:text-white transition-all transform hover:scale-110" aria-label="Facebook">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
