import { AdminRequest, StatsData } from '../types/admin';

export const mockRequests: AdminRequest[] = [
  {
    id: '1',
    userName: 'Sarah Chen',
    profileImage: 'https://i.pravatar.cc/150?img=1',
    title: 'Should I relocate to Edinburgh for this new role?',
    proof: 'Got offered a senior PM role at a healthtech company there. Good step up but means leaving my network in London.',
    helpType: 'Career Strategy',
    timeline: 'urgent',
    status: 'active',
    createdAt: new Date('2024-03-15T10:00:00'),
    lastUpdated: new Date('2024-03-15T10:00:00')
  },
  {
    id: '2',
    userName: 'Marcus Rodriguez',
    profileImage: 'https://i.pravatar.cc/150?img=2',
    title: 'How do I restructure after losing 3 engineers?',
    proof: 'Had to let go some team members due to budget cuts. Need to reorganize workload across remaining 8 people.',
    helpType: 'Management Skills',
    timeline: 'standard',
    status: 'pending_match',
    createdAt: new Date('2024-03-14T15:30:00'),
    lastUpdated: new Date('2024-03-14T16:45:00')
  },
  {
    id: '3',
    userName: 'Jennifer Liu',
    profileImage: 'https://i.pravatar.cc/150?img=3',
    title: 'First time leading an acquisition integration',
    proof: 'My company just acquired a smaller competitor (about 30 people). I have been put in charge of integration.',
    helpType: 'Business Strategy',
    timeline: 'flexible',
    status: 'solved',
    createdAt: new Date('2024-03-13T09:15:00'),
    lastUpdated: new Date('2024-03-14T11:20:00')
  }
];

export const mockStats: StatsData = {
  totalRequests: 156,
  activeRequests: 89,
  pendingMatches: 34,
  solvedRequests: 33,
  averageResponseTime: 2.5,
  matchRate: 0.78
}; 