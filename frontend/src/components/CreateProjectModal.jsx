import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Button from './Button';
import Input from './Input';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const CreateProjectModal = ({ isOpen, closeModal, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/project/', { name, description });
            toast.success('Project created successfully!');
            onProjectCreated(response.data);
            setName('');
            setDescription('');
            closeModal();
        } catch (error) {
            console.error("Failed to create project", error);
            if (error.response?.status === 403) {
                toast.error('Authentication failed. Please login again.');
            } else if (error.response?.status === 401) {
                toast.error('Your session has expired. Please login again.');
            } else {
                toast.error(error.response?.data?.error || 'Failed to create project');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                                >
                                    Create New Project
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="mt-4">
                                    <Input
                                        id="projectName"
                                        label="Project Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="My Awesome Project"
                                    />

                                    <div className="mb-4">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Optional description"
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <Button variant="secondary" onClick={closeModal}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={loading}>
                                            {loading ? 'Creating...' : 'Create Project'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreateProjectModal;
