import { supabase } from './auth';
import { Friend, FriendRequest } from '../types';

export interface DiscoveredUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  streakDays: number;
  weeklyStudyMinutes: number;
}

/**
 * Search for real registered users by name or email in Supabase.
 * Returns only real matching users. If none exist, returns empty array.
 */
export async function searchRealUsers(
  query: string,
  currentUserId?: string
): Promise<DiscoveredUser[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  if (supabase) {
    try {
      let req = supabase
        .from('profiles')
        .select('id, name, email, avatar_url, streak_days, weekly_study_minutes')
        .or(`name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`)
        .limit(10);

      if (currentUserId) {
        req = req.neq('id', currentUserId);
      }

      const { data, error } = await req;

      if (error) {
        console.warn('[Friends Search] Supabase query error:', error);
        return [];
      }

      if (data && Array.isArray(data)) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Student',
          email: u.email,
          avatarUrl: u.avatar_url,
          streakDays: Number(u.streak_days) || 0,
          weeklyStudyMinutes: Number(u.weekly_study_minutes) || 0,
        }));
      }
    } catch (err) {
      console.warn('[Friends Search] Network or unexpected error:', err);
    }
  }

  return [];
}

/**
 * Send a real friend request to a discovered user in Supabase.
 */
export async function sendRealFriendRequest(
  currentUserId: string,
  targetUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string }> {
  if (!currentUserId || !targetUserId) {
    return { success: false, message: 'Invalid user IDs.' };
  }

  if (currentUserId === targetUserId) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  if (supabase) {
    try {
      // 1. Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .match({ user_id: currentUserId, friend_id: targetUserId })
        .maybeSingle();

      if (existingFriendship) {
        return { success: false, message: 'You are already study buddies with this user.' };
      }

      // 2. Check if a pending request already exists
      const { data: existingReq } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${currentUserId})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingReq) {
        return { success: false, message: 'A study buddy request is already pending between you two.' };
      }

      // 3. Create the friend request
      const reqId = `freq_${Date.now()}`;
      const { error: insertErr } = await supabase.from('friend_requests').insert({
        id: reqId,
        from_user_id: currentUserId,
        to_user_id: targetUserId,
        status: 'pending',
      });

      if (insertErr) {
        console.error('[Friends] Insert request error:', insertErr);
        return { success: false, message: insertErr.message || 'Failed to send request.' };
      }

      // 4. Send in-app notification to the target user
      await supabase.from('notifications').insert({
        id: `notif_freq_${Date.now()}`,
        user_id: targetUserId,
        type: 'friend_request',
        title: 'New Study Buddy Request',
        message: `${currentUserName || 'A student'} wants to connect on PACE!`,
        target_tab: 'friends',
        action_id: reqId,
      });

      return { success: true, message: 'Study buddy request sent!' };
    } catch (err: any) {
      console.error('[Friends] Unexpected error sending request:', err);
      return { success: false, message: err.message || 'Error communicating with server.' };
    }
  }

  return {
    success: false,
    message: 'Please sign in with your Supabase account to send study buddy requests.',
  };
}

/**
 * Fetch incoming pending friend requests for current user.
 * Uses a robust 2-step query to prevent PostgREST foreign-key join resolution errors.
 */
export async function fetchIncomingFriendRequests(
  currentUserId: string
): Promise<FriendRequest[]> {
  if (!supabase || !currentUserId) return [];

  try {
    // Step 1: Query pending requests targeted at current user
    const { data: requests, error: reqError } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, status, created_at')
      .eq('to_user_id', currentUserId)
      .eq('status', 'pending');

    if (reqError) {
      console.warn('[Friends] Fetch requests DB error:', reqError.message);
      return [];
    }

    if (!requests || requests.length === 0) {
      return [];
    }

    // Step 2: Fetch sender profile details for all senders in requests
    const senderIds = requests.map((r: any) => r.from_user_id);
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, email')
      .in('id', senderIds);

    if (profError) {
      console.warn('[Friends] Fetch sender profiles error:', profError.message);
    }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return requests.map((r: any) => {
      const p = profileMap.get(r.from_user_id);
      return {
        id: r.id,
        fromUserId: r.from_user_id,
        fromUserName: p?.name || p?.email?.split('@')[0] || 'Student',
        fromUserAvatar: p?.avatar_url,
        createdAt: r.created_at,
        status: r.status,
      };
    });
  } catch (err) {
    console.warn('[Friends] Fetch requests exception:', err);
    return [];
  }
}

/**
 * Accept a friend request.
 */
export async function acceptRealFriendRequest(
  requestId: string,
  fromUserId: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string }> {
  if (!supabase || !currentUserId) {
    return { success: false, message: 'Not authenticated.' };
  }

  try {
    // 1. Update request status to accepted
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', currentUserId);

    // 2. Insert bidirectional friendships (separately to ensure RLS compliance)
    await supabase.from('friendships').upsert(
      { user_id: currentUserId, friend_id: fromUserId },
      { onConflict: 'user_id,friend_id' }
    );
    await supabase.from('friendships').upsert(
      { user_id: fromUserId, friend_id: currentUserId },
      { onConflict: 'user_id,friend_id' }
    );

    // 3. Notify the original sender
    await supabase.from('notifications').insert({
      id: `notif_faccept_${Date.now()}`,
      user_id: fromUserId,
      type: 'friend_accepted',
      title: 'Study Buddy Request Accepted',
      message: `${currentUserName || 'Your friend'} accepted your study circle invitation!`,
      target_tab: 'friends',
    });

    return { success: true, message: 'Friend request accepted!' };
  } catch (err: any) {
    console.error('[Friends] Accept error:', err);
    return { success: false, message: err.message || 'Failed to accept request.' };
  }
}

/**
 * Decline a friend request.
 */
export async function declineRealFriendRequest(
  requestId: string,
  currentUserId: string
): Promise<void> {
  if (!supabase || !currentUserId) return;

  try {
    await supabase
      .from('friend_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('to_user_id', currentUserId);
  } catch (err) {
    console.error('[Friends] Decline error:', err);
  }
}

/**
 * Fetch connected friends list with their live study stats.
 * Uses a robust 2-step query to prevent PostgREST foreign-key join resolution errors.
 */
export async function fetchRealFriends(currentUserId: string): Promise<Friend[]> {
  if (!supabase || !currentUserId) return [];

  try {
    // Step 1: Get list of friend IDs for current user
    const { data: friendships, error: friendErr } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', currentUserId);

    if (friendErr) {
      console.warn('[Friends] Fetch friendships DB error:', friendErr.message);
      return [];
    }

    if (!friendships || friendships.length === 0) {
      return [];
    }

    // Step 2: Fetch profile details for all friends
    const friendIds = friendships.map((f: any) => f.friend_id);
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, streak_days, weekly_study_minutes, show_stats_to_friends')
      .in('id', friendIds);

    if (profErr) {
      console.warn('[Friends] Fetch friend profiles DB error:', profErr.message);
    }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return friendIds
      .map((id: string) => profileMap.get(id))
      .filter(Boolean)
      .map((p: any) => ({
        id: p.id,
        name: p.name || p.email?.split('@')[0] || 'Friend',
        avatar: p.avatar_url,
        streakDays: Number(p.streak_days) || 0,
        weeklyStudyMinutes: Number(p.weekly_study_minutes) || 0,
        showStats: p.show_stats_to_friends !== false,
        nudgedToday: false,
      }));
  } catch (err) {
    console.warn('[Friends] Fetch friends exception:', err);
    return [];
  }
}

/**
 * Remove a friend from study circle.
 */
export async function removeRealFriend(
  currentUserId: string,
  friendId: string
): Promise<void> {
  if (!supabase || !currentUserId) return;

  try {
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
  } catch (err) {
    console.error('[Friends] Remove friend error:', err);
  }
}
