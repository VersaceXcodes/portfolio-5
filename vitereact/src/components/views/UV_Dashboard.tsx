import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

interface Portfolio {
  portfolio_id: string;
  title: string;
  template_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const UV_Dashboard: React.FC = () => {
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logoutUser = useAppStore(state => state.logout_user);

  const { data, isLoading, error } = useQuery(
    ['fetchDashboardData'],
    async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      return response.data.portfolios.map((portfolio: any) => ({
        portfolio_id: portfolio.portfolio_id,
        title: portfolio.title,
        template_id: portfolio.template_id,
        is_published: portfolio.is_published,
        created_at: portfolio.created_at,
        updated_at: portfolio.updated_at,
      }));
    },
    { staleTime: 60000, refetchOnWindowFocus: false, retry: 1 }
  );

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600">Error loading data</div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Welcome back, {currentUser?.name}!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      This is your dashboard. Here you can manage your portfolios and check your engagements.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      {data?.map((portfolio: Portfolio) => (
                        <div key={portfolio.portfolio_id} className="bg-white p-4 rounded-md shadow-md">
                          <h3 className="text-xl font-semibold">{portfolio.title}</h3>
                          <p className="text-gray-500">Template: {portfolio.template_id}</p>
                          <p className="text-gray-600">
                            Status: {portfolio.is_published ? 'Published' : 'Unpublished'}
                          </p>
                          <Link
                            to={`/portfolio/builder/${portfolio.portfolio_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit Portfolio
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_Dashboard;