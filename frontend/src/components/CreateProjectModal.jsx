import React, { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'; //
import Button from './Button';
import Input from './Input';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const CreateProjectModal = ({ isOpen, closeModal, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [importedData, setImportedData] = useState(null); //
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (json.nodes && json.edges) {
                    setImportedData(json); //
                    // Auto-fill name if it's currently empty
                    if (!name) setName(file.name.replace('.json', ''));
                    toast.success('JSON file loaded successfully');
                } else {
                    toast.error('Invalid JSON: Missing nodes or edges');
                }
            } catch (err) {
                toast.error('Failed to parse JSON file');
            }
        };
        reader.readAsText(file);
    };

    const clearImport = () => {
        setImportedData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // We include importedData in the 'entities' field if it exists
            const response = await api.post('/project/', {
                name,
                description,
                entities: importedData || { nodes: [], edges: [] }
            });

            toast.success(importedData ? 'Project imported!' : 'Project created!');
            onProjectCreated(response.data);
            resetAndClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setName('');
        setDescription('');
        setImportedData(null);
        closeModal();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={resetAndClose}>
                <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                                Create New Project
                            </Dialog.Title>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Import Section */}
                                {!importedData ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-gray-500 dark:text-gray-400"
                                    >
                                        <DocumentArrowUpIcon className="w-8 h-8" />
                                        <span className="text-sm font-medium">Import from JSON (Optional)</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <DocumentArrowUpIcon className="w-5 h-5" />
                                            <span className="text-sm font-medium">JSON Data Ready</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearImport}
                                            className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"
                                        >
                                            <XMarkIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden"
                                />

                                <hr className="border-gray-100 dark:border-gray-700" />

                                <Input
                                    label="Project Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Enter project name..."
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional description"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button variant="secondary" onClick={resetAndClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Processing...' : (importedData ? 'Import Project' : 'Create Project')}
                                    </Button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreateProjectModal;