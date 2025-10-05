import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { z } from 'zod';

// Define the Portfolio schema using Zod
const portfolioSchema = z.object({
  portfolio_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  template_id: z.string(),
  is_published: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Component for fetching and updating portfolio data
const UV_PortfolioBuilder: React.FC = () => {
  // Fetch portfolio ID from URL params
  const { portfolio_id } = useParams<{ portfolio_id: string }>();
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentPortfolio = useAppStore(state => state.user_portfolio);

  const { isLoading, data: portfolioData = {
    id: '',
    portfolio_id: '',
    user_id: '',
    title: '',
    template_id: '',
    is_published: false,
    created_at: '',
    updated_at: ''
  }, error } = useQuery({
    queryKey: ['portfolio', portfolio_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/portfolios/${portfolio_id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return portfolioSchema.parse(response.data);
    },
    enabled: !!portfolio_id,
    staleTime: 5 * 60 * 1000,
  });

  const updatePortfolioMutation = useMutation({
    mutationFn: (updateData: { section_id: string; type: string; content: string }) => {
      return axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/portfolios/${portfolio_id}/sections/${updateData.section_id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    }
  });

  useEffect(() => {
    if (portfolioData && portfolioData.portfolio_id) {
      useAppStore.setState({ 
        user_portfolio: {
          id: portfolioData.portfolio_id,
          title: portfolioData.title,
          template_id: portfolioData.template_id,
          is_published: portfolioData.is_published,
          created_at: portfolioData.created_at,
          updated_at: portfolioData.updated_at
        }
      });
    }
  }, [portfolioData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading portfolio</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Portfolio Builder</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/portfolio/preview" className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Preview
                </Link>
                <button
                  onClick={() => updatePortfolioMutation.mutate({ section_id: 'some_section_id', type: 'text', content: 'Updated content' })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="py-8 max-w-7xl mx-auto">
          <div className="px-4 py-6">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentPortfolio?.title || 'Untitled Portfolio'}</h2>
              {/* Implement drag-and-drop and customization panels here */}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_PortfolioBuilder;