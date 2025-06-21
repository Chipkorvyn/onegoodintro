/**
 * Modal component for displaying informational modals with icons
 */

import React from 'react';
import { Handshake, CheckCircle, Heart } from 'lucide-react';

export type ModalIconType = 'handshake' | 'check' | 'heart';

export interface ModalContent {
  icon: ModalIconType;
  title: string;
  message: string;
}

interface ModalProps {
  isOpen: boolean;
  content: ModalContent | null;
  onClose: () => void;
}

const Modal = ({ isOpen, content, onClose }: ModalProps) => {
  if (!isOpen || !content) return null;

  const getIcon = () => {
    switch (content.icon) {
      case 'handshake':
        return <Handshake className="h-12 w-12 text-teal-400 mx-auto" />;
      case 'check':
        return <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />;
      case 'heart':
        return <Heart className="h-12 w-12 text-purple-400 mx-auto" />;
      default:
        return <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-700">
        <div className="mb-4">
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{content.title}</h3>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          {content.message}
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default Modal;