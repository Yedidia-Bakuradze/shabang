import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const Editor = () => {
    const { projectId } = useParams();

    return (
        <Layout>
            <div className="h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Canvas Editor</h2>
                    <p className="text-gray-500 mt-2">Project ID: {projectId}</p>
                    <p className="text-gray-400 mt-4">React Flow integration coming soon...</p>
                </div>
            </div>
        </Layout>
    );
};

export default Editor;
