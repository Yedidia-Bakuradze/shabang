import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import EditorCanvas from '../components/EditorCanvas';

const Editor = () => {
    const { projectId } = useParams();

    return (
        <Layout>
            <div className="h-[calc(100vh-64px)] w-full bg-white rounded-xl shadow-sm border border-gray-200">
                <EditorCanvas />
            </div>
        </Layout>
    );
};

export default Editor;
