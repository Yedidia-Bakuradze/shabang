import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import DropdownButton from './DropdownButton';
import { useTheme } from "../context/ThemeContext";
import ConfirmationModal from './ConfirmationModal';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/profile/');
      toast.success("Account scheduled for deletion (7-day grace period)");
      logout();
      navigate('/login');
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Disclosure as="nav" className="bg-white dark:bg-gray-800 shadow-sm">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div
                    className="flex flex-shrink-0 items-center cursor-pointer"
                    onClick={() => navigate('/')}
                  >
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ERD Designer
                    </span>
                  </div>
                </div>

                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {user.username}
                        </span>
                        <Menu.Button className="flex rounded-full bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                          <span className="sr-only">Open user menu</span>
                          <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                        </Menu.Button>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <DropdownButton onClick={toggleDarkMode}>
                                {darkMode ? 'Light Mode' : 'Dark Mode'}
                              </DropdownButton>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <DropdownButton onClick={handleLogout}>
                                Log out
                              </DropdownButton>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <DropdownButton
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                Delete Account
                              </DropdownButton>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="space-x-4">
                      <Link
                        to="/login"
                        className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 font-medium"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>

                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
                {user ? (
                  <div className="space-y-1 px-2">
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      className="block w-full rounded-md px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 text-left"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                ) : (
                  <div className="space-y-1 px-2">
                    <Disclosure.Button
                      as={Link}
                      to="/login"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Log in
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/signup"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      Sign up
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="Are you sure you want to delete your account? You will have a 1-week grace period to recover it before it is permanently removed."
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
