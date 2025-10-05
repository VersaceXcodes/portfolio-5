import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface Section {
  type: string;
  content: string;
}

interface PortfolioData {
  portfolio_id: string;
  title: string;
  template_id: string;
  is_published: boolean;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

const UV_PortfolioPreview: React.FC = () => {
  const { portfolio_id } = useParams<{ portfolio_id: string }>();
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // Fetching portfolio preview data
  const { data: portfolioPreviewData, isLoading, error } = useQuery<PortfolioData>(
    ['portfolioPreview', portfolio_id],
    async () => {
      const response = await axios.get<PortfolioData>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/portfolios/${portfolio_id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      return response.data;
    },
    {
      enabled: !!portfolio_id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    }
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading portfolio. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-6 lg:p-8 mb-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{portfolioPreviewData?.title}</h1>

            {/* Portfolio Sections */}
            <div className="space-y-6">
              {portfolioPreviewData?.sections.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-700">{section.type}</h2>
                  <p className="text-gray-600 mt-2">{section.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 px-6 py-3 rounded-lg font-medium"
            >
              Back to Dashboard
            </Link>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 py-3 rounded-lg font-medium"
              onClick={/* Add your publish logic here */}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PortfolioPreview;