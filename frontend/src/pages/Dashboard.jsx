import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Card from '../components/Card';
import Button from '../components/Button';
import CreateProjectModal from '../components/CreateProjectModal';
import { PlusIcon, FolderIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { loadExampleProject } from '../data/exampleProject';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, projectId: null, projectName: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/project/');
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreated = (newProject) => {
        setProjects([...projects, newProject]);
    };

    const createExampleProject = async () => {
        try {
            const projectData = loadExampleProject();
            const response = await api.post('/project/', projectData);
            toast.success('Example project created!');
            setProjects([...projects, response.data]);
            // Navigate to the new project
            navigate(`/editor/${response.data.id}`);
        } catch (error) {
            console.error("Failed to create example project", error);
            toast.error('Failed to create example project');
        }
    };

    const openProject = (projectId) => {
        navigate(`/editor/${projectId}`);
    };

    const handleDeleteProject = async (projectId, e) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === projectId);
        setDeleteConfirmation({ isOpen: true, projectId, projectName: project.name });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/project/${deleteConfirmation.projectId}/`);
            setProjects(projects.filter(p => p.id !== deleteConfirmation.projectId));
            toast.success('Project deleted successfully!');
            setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
        } catch (error) {
            console.error("Failed to delete project", error);
            toast.error('Failed to delete project');
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Projects</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Manage your ERD designs</p>
            </div>
            <div className="flex gap-3">
                <Button 
                    onClick={createExampleProject} 
                    variant="secondary"
                    className="flex items-center bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-700"
                >
                    <BeakerIcon className="h-5 w-5 mr-2" />
                    Create Example Project
                </Button>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            </div>
            </div>

            {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
            ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No projects</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Get started by creating a new project.</p>
                <div className="mt-6 flex justify-center gap-3">
                <Button 
                    onClick={createExampleProject}
                    variant="secondary"
                    className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200"
                >
                    <BeakerIcon className="h-5 w-5 mr-2 inline" />
                    Try Example
                </Button>
                <Button onClick={() => setIsModalOpen(true)}>
                    Create Project
                </Button>
                </div>
            </div>
            ) : (
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
                {projects.map((project) => (
                <motion.div key={project.id} variants={item}>
                    <Card
                    className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onClick={() => openProject(project.id)}
                    >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900 rounded-lg">
                            <FolderIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-700 rounded-lg transition-colors"
                            title="Delete project"
                        >
                            <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
                        </button>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">
                        {project.description || "No description provided."}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                            Open Canvas &rarr;
                        </span>
                        </div>
                    </div>
                    </Card>
                </motion.div>
                ))}
            </motion.div>
            )}

            <CreateProjectModal
            isOpen={isModalOpen}
            closeModal={() => setIsModalOpen(false)}
            onProjectCreated={handleProjectCreated}
            />

            <Transition appear show={deleteConfirmation.isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={cancelDelete}>
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
                        Delete Project?
                        </Dialog.Title>
                        <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{deleteConfirmation.projectName}"</span>? This action cannot be undone.
                        </p>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="secondary" onClick={cancelDelete}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </Button>
                        </div>
                    </Dialog.Panel>
                    </Transition.Child>
                </div>
                </div>
            </Dialog>
            </Transition>
        </div>
    );
};

export default Dashboard;
