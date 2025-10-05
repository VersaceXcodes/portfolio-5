import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

interface UserDetails {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

const UV_AccountSettings: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const [userDetails, setUserDetails] = useState<UserDetails>({
    user_id: '',
    email: '',
    name: '',
    created_at: ''
  });

  const fetchUserProfile = useQuery({
    queryKey: ['fetchUserProfile'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data.find((user: UserDetails) => user.user_id === currentUser?.user_id);
    },
    enabled: !!authToken
  });

  const updateUserSettings = useMutation({
    mutationFn: async (updatedDetails: UserDetails) => {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${updatedDetails.user_id}`,
        { email: updatedDetails.email, name: updatedDetails.name },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    },
    onSuccess: () => {
      alert('User details updated successfully!');
    }
  });

  useEffect(() => {
    if (fetchUserProfile.data) {
      setUserDetails(fetchUserProfile.data);
    }
  }, [fetchUserProfile.data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userDetails.email && userDetails.name) {
      updateUserSettings.mutate(userDetails);
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Settings
          </h2>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={userDetails.name}
                  onChange={handleInputChange}
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={userDetails.email}
                  onChange={handleInputChange}
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={updateUserSettings.isPending}
              >
                {updateUserSettings.isPending ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
            <div className="flex justify-center">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 ml-4">
                Back to Dashboard
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_AccountSettings;