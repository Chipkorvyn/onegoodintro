/**
 * BottomNavigation component for app navigation
 */

import React from 'react';
import { User, Target, Users, Heart, Network } from 'lucide-react';

type ViewType = 'auth' | 'full-profile' | 'match-found' | 'match-connection' | 'public-board' | 'network' | 'new-get-help' | 'voice' | 'resume' | 'messages';

interface BottomNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BottomNavigation = ({ currentView, onViewChange }: BottomNavigationProps) => (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-40">
    <div className="flex justify-around">
      <button 
        onClick={() => onViewChange('full-profile')}
        className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
          currentView === 'full-profile' 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
            : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
        }`}
      >
        <User className="h-5 w-5" />
        <span className="text-xs font-medium">Profile</span>
      </button>
      <button 
        onClick={() => onViewChange('new-get-help')}
        className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
          currentView === 'new-get-help' 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
            : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
        }`}
      >
        <Target className="h-5 w-5" />
        <span className="text-xs font-medium">Requests</span>
      </button>
      <button 
        onClick={() => onViewChange('match-found')}
        className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
          currentView === 'match-found' 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
            : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
        }`}
      >
        <Users className="h-5 w-5" />
        <span className="text-xs font-medium">Matches</span>
      </button>
      <button 
        disabled
        className="flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] text-gray-500 cursor-not-allowed relative"
      >
        <Heart className="h-5 w-5" />
        <span className="text-xs font-medium">Help Others</span>
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
          Soon
        </span>
      </button>
      <button 
        onClick={() => onViewChange('network')}
        className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
          currentView === 'network' 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
            : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
        }`}
      >
        <Network className="h-5 w-5" />
        <span className="text-xs font-medium">Connections</span>
      </button>
    </div>
  </div>
);

export default BottomNavigation;