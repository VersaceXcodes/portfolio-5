import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface Template {
  id: string;
  title: string;
  description: string | null;
}

const GV_TopNav: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  const handleSearch = useCallback(() => {
    return axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/templates`, {
      params: { query: searchQuery }
    }).then(response => {
      return response.data.map((template: any) => ({
        id: template.template_id,
        title: template.name,
        description: template.description
      }));
    });
  }, [searchQuery]);

  const { data: templates, isLoading } = useQuery(['templates', searchQuery], handleSearch, {
    enabled: !!searchQuery,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <>
      <nav className="bg-white shadow fixed w-full z-10 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">ShowcaseCraft</Link>
            </div>

            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  <input 
                    type="text" 
                    placeholder="Search Templates" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {isLoading && <div>Loading...</div>}
                  <ul className="bg-white rounded shadow-lg absolute mt-1 max-h-60 overflow-auto w-full">
                    {templates?.map(template => (
                      <li key={template.id} className="px-4 py-2 hover:bg-gray-100">
                        {template.title}
                      </li>
                    ))}
                  </ul>
                  <Link to="/dashboard" className="ml-4 text-gray-700 hover:text-blue-500">Dashboard</Link>
                  <Link to="/account-settings" className="ml-4 text-gray-700 hover:text-blue-500">Account Settings</Link>
                  <button onClick={() => useAppStore.getState().logout_user()} className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/signup" className="text-gray-700 hover:text-blue-500">Sign Up</Link>
                  <Link to="/login" className="ml-4 text-gray-700 hover:text-blue-500">Log In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;