import React, { useRef } from 'react';
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import useFlowStore from '../../store/useFlowStore';
import { toast } from 'react-hot-toast';

const FlowPersistence = () => {
    const { nodes, edges, loadProjectData } = useFlowStore();
    const fileInputRef = useRef(null);

    const handleExport = () => {
        try {
            const exportData = { nodes, edges, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `erd-export-${new Date().getTime()}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Diagram exported to JSON');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.nodes && json.edges) {
                    loadProjectData(json); // Injects data into Zustand store
                    toast.success('Diagram imported successfully');
                } else {
                    toast.error('Invalid file format');
                }
            } catch (err) {
                toast.error('Failed to parse JSON');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="flex flex-row gap-2">
            <button
                onClick={handleExport}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Export to JSON"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
            </button>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Import from JSON"
            >
                <ArrowUpTrayIcon className="w-5 h-5" />
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
            />
        </div>
    );
};

export default FlowPersistence;