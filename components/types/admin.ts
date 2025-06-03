export type FilterType = 'all' | 'active' | 'pending_match' | 'solved';

export interface FilterState {
  currentFilter: FilterType;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'urgent';
}

export interface AdminRequest {
  id: string;
  userName: string;
  profileImage?: string;
  title: string;
  proof: string;
  helpType: string;
  timeline: 'urgent' | 'standard' | 'flexible';
  status: 'active' | 'pending_match' | 'solved';
  createdAt: Date;
  lastUpdated: Date;
}

export interface StatsData {
  totalRequests: number;
  activeRequests: number;
  pendingMatches: number;
  solvedRequests: number;
  averageResponseTime: number;
  matchRate: number;
} 