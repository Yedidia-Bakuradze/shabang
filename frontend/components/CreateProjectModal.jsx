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
            const response = await api.post('/projects/', { name, description });
            toast.success('Project created successfully!');
            onProjectCreated(response.data);
            setName('');
            setDescription('');
            closeModal();
        } catch (error) {
            console.error("Failed to create project", error);
            toast.error('Failed to create project');
        }
        setLoading(false);
    };

