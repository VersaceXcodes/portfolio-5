import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const fetchTemplates = async (authToken: string | null) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/templates`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

const UV_TemplateOverview: React.FC = () => {
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(authToken),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Template Overview</h1>
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <p className="text-sm">Failed to load templates. Please try again later.</p>
            </div>
          )}
          <div className="space-y-6">
            {templates?.map((template: any) => (
              <div key={template.template_id} className="bg-white shadow-lg rounded-xl px-6 py-4 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <Link
                  to={`/portfolio/builder?template_id=${template.template_id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Use this template
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_TemplateOverview;