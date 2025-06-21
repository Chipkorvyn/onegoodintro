import { supabase } from '@/lib/supabase'

export interface UserForMatching {
  id: string
  name: string
  proven_expertise: string[]
  current_asks: string[]
  general_background: string
}

export async function getUsersForMatching(): Promise<UserForMatching[]> {
  // Get users with complete profiles and their associated data
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, name, background, current_focus, role_title, industry, experience_years,
      user_problems(*),
      help_requests(*)
    `)
    .not('current_focus', 'is', null)

  if (!users) return []

  // Filter users who have either problems OR requests (not requiring both)
  const eligibleUsers = users.filter(user => 
    (user.user_problems && user.user_problems.length > 0) || 
    (user.help_requests && user.help_requests.length > 0)
  )

  return eligibleUsers.map(user => ({
    id: user.id,
    name: user.name,
    proven_expertise: user.user_problems?.map(p => `${p.title}: ${p.proof}`) || [],
    current_asks: user.help_requests?.map(r => `${r.challenge || r.title} (${r.help_type})`) || [],
    general_background: `${user.role_title || 'Professional'} with ${user.experience_years || 'some'} experience in ${user.industry || 'various fields'}. ${user.background || ''}`
  }))
}

export function generateMutualMatchPrompt(users: UserForMatching[]): string {
  return `Find mutually beneficial matches for these ${users.length} users:

${users.map(user => `
USER_ID: ${user.id}
PROVEN EXPERTISE:
${user.proven_expertise.map(exp => `- ${exp}`).join('\n') || '- None listed'}
GENERAL BACKGROUND: ${user.general_background}
CURRENT ASKS:
${user.current_asks.map(ask => `- ${ask}`).join('\n') || '- None listed'}
`).join('\n')}

MATCHING RULES:
1. PRIORITY 1: Match PROVEN EXPERTISE to CURRENT ASKS directly
2. PRIORITY 2: Match GENERAL BACKGROUND to ASKS for broader help  
3. Each person gets maximum 1 match
4. Optimize for total mutual benefit

Return top ${Math.floor(users.length/2)} matches as JSON:
[
  {
    "user1_id": "exact USER_ID from above",
    "user2_id": "exact USER_ID from above",
    "match_type": "expertise_match",
    "mutual_score": 8.5,
    "user1_gives": "specific expertise offered",
    "user1_gets": "specific need fulfilled", 
    "user2_gives": "specific expertise offered",
    "user2_gets": "specific need fulfilled",
    "rationale": "why this is mutually beneficial"
  }
]

Only include matches with mutual_score > 6.0. Return valid JSON only.`
}