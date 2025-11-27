import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import CreateProjectModal from '../components/CreateProjectModal';
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const openProject = (projectId) => {
        navigate(`/editor/${projectId}`);
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
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your ERD designs</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                    <div className="mt-6">
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
                            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full" onClick={() => openProject(project.id)}>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-primary-50 rounded-lg">
                                            <FolderIcon className="h-6 w-6 text-primary-600" />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {project.description || "No description provided."}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <span className="text-sm font-medium text-primary-600 hover:text-primary-700">
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
        </Layout>
    );
};

export default Dashboard;
