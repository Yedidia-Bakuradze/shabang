import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import EditorCanvas from '../components/EditorCanvas';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import useFlowStore from '../store/useFlowStore';

const Editor = () => {
    const { projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [projectName, setProjectName] = useState('');
    const { loadProjectData, getCanvasData, markAsSaved, setProjectId, hasUnsavedChanges } = useFlowStore();

    // Load project data
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/project/${projectId}/`);
                setProjectName(response.data.name);
                setProjectId(projectId);
                
                // Load canvas data if exists
                if (response.data.entities) {
                    loadProjectData(response.data.entities);
                }
            } catch (error) {
                console.error('Failed to load project:', error);
                toast.error('Failed to load project');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, loadProjectData, setProjectId]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!hasUnsavedChanges || loading) return;

        const autoSaveInterval = setInterval(() => {
            handleSave(true);
        }, 30000); // 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [hasUnsavedChanges, loading]);

    const handleSave = async (isAutoSave = false) => {
        setSaving(true);
        try {
            const canvasData = getCanvasData();
            await api.put(`/project/${projectId}/`, {
                entities: canvasData
            });
            markAsSaved();
            if (!isAutoSave) {
                toast.success('Project saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            if (!isAutoSave) {
                toast.error('Failed to save project');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="h-[calc(100vh-64px)] w-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-[calc(100vh-64px)] w-full bg-white dark:bg-gray-900 relative">
                {/* Save Button */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {projectName}
                        </h2>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving || !hasUnsavedChanges}
                            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2 ${
                                saving || !hasUnsavedChanges
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : hasUnsavedChanges ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                                    </svg>
                                    Save
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Saved
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <EditorCanvas />
            </div>
        </Layout>
    );
};

export default Editor;
