import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const GV_Footer: React.FC = () => {
  const appNotification = useAppStore(state => state.app_notification);

  return (
    <>
      <footer className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <Link to="/terms" className="text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>

            <div className="flex space-x-6">
              <a href="https://facebook.com/showcasecraft" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-600 hover:text-gray-900 text-lg">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com/showcasecraft" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-600 hover:text-gray-900 text-lg">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com/company/showcasecraft" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-600 hover:text-gray-900 text-lg">
                <FaLinkedinIn />
              </a>
              <a href="https://instagram.com/showcasecraft" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-600 hover:text-gray-900 text-lg">
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Notification Section */}
          {appNotification?.message && (
            <div aria-live="polite" className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className={`text-sm ${appNotification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {appNotification.message}
              </p>
              <p className="text-xs text-gray-500">{appNotification.timestamp}</p>
            </div>
          )}

          <div className="mt-8 text-center text-gray-600 text-sm">
              &copy; 2023 ShowcaseCraft. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;