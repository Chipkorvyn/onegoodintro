/**
 * ChatPanel component for messaging functionality
 */

import React from 'react';
import { X, ArrowLeft, Send } from 'lucide-react';

interface NetworkConnection {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  connectionContext: string;
  currentStatus: {
    type: 'looking_for' | 'recently_helped' | 'mutual_benefit';
    text: string;
  }
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
}

interface ChatPanelProps {
  showChatPanel: boolean;
  chatView: 'list' | 'chat';
  activeChat: string | null;
  conversations: NetworkConnection[];
  chatMessages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  messageText: string;
  sendingMessage: boolean;
  onClose: () => void;
  onConversationSelect: (connectionId: string) => void;
  onBackToList: () => void;
  onMessageChange: (text: string) => void;
  onSendMessage: () => void;
  getLastMessage: (connectionId: string) => Message | null;
  getActiveConversations: () => NetworkConnection[];
}

const ChatPanel = ({
  showChatPanel,
  chatView,
  activeChat,
  conversations,
  chatMessages,
  unreadCounts,
  messageText,
  sendingMessage,
  onClose,
  onConversationSelect,
  onBackToList,
  onMessageChange,
  onSendMessage,
  getLastMessage,
  getActiveConversations
}: ChatPanelProps) => {
  if (!showChatPanel) return null;
  
  if (chatView === 'list') {
    // Conversation List View (like WhatsApp)
    const conversationList = getActiveConversations();
    
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Messages</h1>
            <div className="w-10"></div>
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationList.length > 0 ? (
            conversationList.map(conn => {
              const lastMessage = getLastMessage(conn.id);
              return (
                <button
                  key={conn.id}
                  onClick={() => {
                    onConversationSelect(conn.id);
                  }}
                  className="w-full p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors flex items-center space-x-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-300 flex-shrink-0">
                    {conn.avatar}
                  </div>
                  
                  {/* Message Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white text-sm">{conn.name}</h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {lastMessage ? lastMessage.text : 'Start a conversation'}
                      </p>
                      {unreadCounts[conn.id] > 0 && (
                        <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                          <span className="text-xs text-white font-bold">{unreadCounts[conn.id]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                <p className="text-gray-400">Start a conversation with your connections</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Individual Chat View
  const activeChatConnection = conversations.find(conn => conn.id === activeChat);
  const messages = activeChat ? chatMessages[activeChat] || [] : [];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Chat Header */}
      <div className="bg-gray-800 px-4 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToList}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {activeChatConnection && (
            <>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-semibold text-gray-300">
                {activeChatConnection.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-sm">{activeChatConnection.name}</h2>
                <p className="text-gray-400 text-xs">{activeChatConnection.title}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.sender === 'me'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 px-4 py-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !sendingMessage) {
                onSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={onSendMessage}
            disabled={sendingMessage || !messageText.trim()}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;