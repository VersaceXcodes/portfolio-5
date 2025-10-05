import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Testimonial {
  author: string;
  content: string;
}

const useFetchTestimonials = () => {
  return useQuery<Testimonial[]>({
    queryKey: ['fetchTestimonials'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/testimonials`);
      return response.data.map((testimonial: any) => ({
        author: testimonial.author_name,
        content: testimonial.content,
      }));
    },
    staleTime: 600000
  });
};

const UV_LandingPage: React.FC = () => {
  const heroMessage = "Welcome to ShowcaseCraft! Build your perfect portfolio today.";
  const featureList = ["Intuitive Design", "Responsive Templates", "Analytics Tracking"];
  const { data: testimonials = [] } = useFetchTestimonials();

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">{heroMessage}</h1>
          <p className="mt-4 text-lg text-gray-600">Join thousands of professionals showcasing their work beautifully.</p>
          <div className="mt-8 space-x-4">
            <Link to="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200">Sign Up</Link>
            <Link to="/login" className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium border border-gray-300 hover:bg-gray-200 transition-all duration-200">Learn More</Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-gray-900 text-center mb-8">Features</h2>
        <ul className="space-y-6">
          {featureList.map((feature, index) => (
            <li key={index} className="text-xl text-gray-700 text-center">{feature}</li>
          ))}
        </ul>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-semibold text-gray-900 text-center mb-8">What Our Users Say</h3>
          <div className="flex flex-col md:flex-row justify-center space-y-6 md:space-y-0 md:space-x-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-lg flex-1">
                <p className="text-gray-700 text-lg italic">"{testimonial.content}"</p>
                <p className="mt-4 text-blue-600 font-medium">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">© 2023 ShowcaseCraft. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default UV_LandingPage;