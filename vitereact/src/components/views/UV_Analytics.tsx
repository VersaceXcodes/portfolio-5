import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_Analytics: React.FC = () => {
  const { portfolio_id } = useParams<{ portfolio_id: string }>();
  const authToken = useAppStore((state) => state.authentication_state.auth_token);

  // Fetch analytics data using react-query
  const { data, isLoading, error } = useQuery(
    ['analyticsData', portfolio_id],
    async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/analytics/${portfolio_id}`,
        { 
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      return response.data;
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: Boolean(portfolio_id && authToken),
    }
  );

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">Error loading analytics data. Please try again later.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 my-12">
                  <div className="bg-white p-6 shadow-lg rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Page Views</h2>
                    <p className="text-4xl font-bold text-blue-600">{data?.page_views || 0}</p>
                  </div>
                  <div className="bg-white p-6 shadow-lg rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Unique Visitors</h2>
                    <p className="text-4xl font-bold text-green-600">{data?.unique_visitors || 0}</p>
                  </div>
                  <div className="bg-white p-6 shadow-lg rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Average Time Spent</h2>
                    <p className="text-4xl font-bold text-yellow-600">{data?.average_time_spent || 0} mins</p>
                  </div>
                </div>

                <div className="mt-8">
                  <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                    Back to Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_Analytics;