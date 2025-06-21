interface PotentialMatch {
  rationale?: string
  match_type?: string
  mutual_score?: number
  user1_gives?: string
  user1_gets?: string
  user2_gives?: string
  user2_gets?: string
  seeker?: User
  helper?: User
  user1?: User
  user2?: User
  help_request?: {
    title?: string
    help_type?: string
    proof?: string
  }
}

interface User {
  name?: string
  email?: string
  background?: string
  current_focus?: string
}

interface ConfirmedMatch {
  id: string
  seeker_id?: string
  helper_id?: string
  user1_id?: string
  user2_id?: string
  seeker_accepted?: boolean
  helper_accepted?: boolean
  user1_accepted?: boolean
  user2_accepted?: boolean
  created_at: string
  potential_match?: PotentialMatch
}

export interface TransformedMatch {
  id: string
  other_user: {
    name: string
    email: string
    background: string
    current_focus: string
  }
  request: {
    title: string
    help_type: string
    proof: string
  }
  rationale: string
  is_seeker: boolean
  is_mutual: boolean
  mutual_score?: number
  you_give?: string
  you_get?: string
  they_give?: string
  they_get?: string
  status: 'pending' | 'accepted' | 'completed'
  created_at: string
}

export class MatchProcessor {
  static isMutualMatch(match: ConfirmedMatch): boolean {
    return Boolean(match.user1_id && match.user2_id)
  }

  static getMatchStatus(
    userAccepted: boolean | undefined,
    otherAccepted: boolean | undefined
  ): 'pending' | 'accepted' | 'completed' {
    if (userAccepted && otherAccepted) {
      return 'completed'
    } else if (userAccepted) {
      return 'accepted'
    }
    return 'pending'
  }

  static transformMatch(match: ConfirmedMatch, currentUserId: string): TransformedMatch | null {
    if (this.isMutualMatch(match)) {
      return this.transformMutualMatch(match, currentUserId)
    } else {
      return this.transformOldStyleMatch(match, currentUserId)
    }
  }

  private static transformMutualMatch(match: ConfirmedMatch, currentUserId: string): TransformedMatch {
    const isUser1 = match.user1_id === currentUserId
    const userAccepted = isUser1 ? match.user1_accepted : match.user2_accepted
    const otherAccepted = isUser1 ? match.user2_accepted : match.user1_accepted
    const otherUser = isUser1 ? match.potential_match?.user2 : match.potential_match?.user1
    
    const userGives = isUser1 ? match.potential_match?.user1_gives : match.potential_match?.user2_gives
    const userGets = isUser1 ? match.potential_match?.user1_gets : match.potential_match?.user2_gets
    const otherGives = isUser1 ? match.potential_match?.user2_gives : match.potential_match?.user1_gives
    const otherGets = isUser1 ? match.potential_match?.user2_gets : match.potential_match?.user1_gets

    const status = this.getMatchStatus(userAccepted, otherAccepted)

    return {
      id: match.id,
      other_user: {
        name: otherUser?.name || 'Unknown',
        email: otherUser?.email || '',
        background: otherUser?.background || '',
        current_focus: otherUser?.current_focus || ''
      },
      request: {
        title: 'Mutual Benefit Exchange',
        help_type: match.potential_match?.match_type || 'mutual_benefit',
        proof: `You give: ${userGives} | You get: ${userGets}`
      },
      rationale: match.potential_match?.rationale || '',
      is_seeker: false,
      is_mutual: true,
      mutual_score: match.potential_match?.mutual_score,
      you_give: userGives,
      you_get: userGets,
      they_give: otherGives,
      they_get: otherGets,
      status,
      created_at: match.created_at
    }
  }

  private static transformOldStyleMatch(match: ConfirmedMatch, currentUserId: string): TransformedMatch {
    const isSeeker = match.seeker_id === currentUserId
    const userAccepted = isSeeker ? match.seeker_accepted : match.helper_accepted
    const otherAccepted = isSeeker ? match.helper_accepted : match.seeker_accepted
    const otherUser = isSeeker ? match.potential_match?.helper : match.potential_match?.seeker

    const status = this.getMatchStatus(userAccepted, otherAccepted)

    return {
      id: match.id,
      other_user: {
        name: otherUser?.name || 'Unknown',
        email: otherUser?.email || '',
        background: otherUser?.background || '',
        current_focus: otherUser?.current_focus || ''
      },
      request: {
        title: match.potential_match?.help_request?.title || '',
        help_type: match.potential_match?.help_request?.help_type || '',
        proof: match.potential_match?.help_request?.proof || ''
      },
      rationale: match.potential_match?.rationale || '',
      is_seeker: isSeeker,
      is_mutual: false,
      status,
      created_at: match.created_at
    }
  }

  static filterValidMatches(matches: (TransformedMatch | null)[]): TransformedMatch[] {
    return matches.filter((match): match is TransformedMatch => 
      match !== null && 
      ['pending', 'accepted', 'completed'].includes(match.status)
    )
  }
}