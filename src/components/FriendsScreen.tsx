import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Flame,
  Clock,
  Send,
  Heart,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Smile,
  Search,
  Loader2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  searchRealUsers,
  sendRealFriendRequest,
  acceptRealFriendRequest,
  declineRealFriendRequest,
  fetchIncomingFriendRequests,
  fetchRealFriends,
  removeRealFriend,
  DiscoveredUser,
} from '../services/friends';

export const FriendsScreen: React.FC = () => {
  const {
    friends,
    friendRequests,
    nudgeFriend,
    userStats,
    profile,
    authUser,
    setShowAuthModal,
    addNotification,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveredUser[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Live friends & requests state
  const [liveFriends, setLiveFriends] = useState(friends);
  const [liveRequests, setLiveRequests] = useState(friendRequests);

  // Refresh live friends from Supabase when authUser changes
  useEffect(() => {
    if (authUser?.id) {
      fetchRealFriends(authUser.id).then((f) => {
        if (f.length > 0) setLiveFriends(f);
      });
      fetchIncomingFriendRequests(authUser.id).then((r) => {
        if (r.length > 0) setLiveRequests(r);
      });
    }
  }, [authUser?.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (!authUser) {
      setFeedbackMsg({
        text: 'Please sign in or create an account to search and connect with study buddies.',
        isError: true,
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setFeedbackMsg(null);

    try {
      const results = await searchRealUsers(query, authUser.id);
      setSearchResults(results);
      if (results.length === 0) {
        setFeedbackMsg({
          text: `No user found matching "${query}". Please check the spelling or enter their registered email.`,
          isError: true,
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: 'Error searching for users. Please try again.', isError: true });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUser: DiscoveredUser) => {
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }

    const res = await sendRealFriendRequest(authUser.id, targetUser.id, authUser.name || profile.name);
    setFeedbackMsg({ text: res.message, isError: !res.success });

    if (res.success) {
      setSearchResults((prev) => (prev ? prev.filter((u) => u.id !== targetUser.id) : null));
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 5000);
  };

  const handleAccept = async (reqId: string, fromUserId: string) => {
    if (!authUser) return;

    const res = await acceptRealFriendRequest(reqId, fromUserId, authUser.id, authUser.name || profile.name);
    if (res.success) {
      setLiveRequests((prev) => prev.filter((r) => r.id !== reqId));
      fetchRealFriends(authUser.id).then((f) => setLiveFriends(f));
      setFeedbackMsg({ text: 'Study buddy request accepted!', isError: false });
    }
  };

  const handleDecline = async (reqId: string) => {
    if (!authUser) return;
    await declineRealFriendRequest(reqId, authUser.id);
    setLiveRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleRemove = async (friendId: string) => {
    if (authUser) {
      await removeRealFriend(authUser.id, friendId);
    }
    setLiveFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const totalCircleWeeklyHours = Math.floor(
    (liveFriends.reduce((acc, f) => acc + (f.weeklyStudyMinutes || 0), 0) +
      userStats.weekMinutes) /
      60
  );

  return (
    <div id="friends_screen" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
            Study Circle
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
            Study alongside verified classmates for daily momentum & mutual accountability
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5" />
          <span>{userStats.currentStreak} Day Streak</span>
        </div>
      </div>

      {/* Guest Sign In Callout if not signed in */}
      {!authUser && (
        <div className="p-5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-[#111827] dark:text-white">
              Connect with Real Classmates
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sign in with your account to search registered students, send buddy requests, and share streaks.
            </p>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      )}

      {/* Add Friend Bar */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-[#111827] dark:text-white">
            Find a Study Buddy
          </h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classmate by name or registered email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </form>

        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              feedbackMsg.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            {feedbackMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Search Results List */}
        {searchResults && searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#282A30]">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Discovered Students ({searchResults.length})
            </span>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#141518] border border-gray-200/80 dark:border-gray-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white truncate">
                        {user.name}
                      </h4>
                      {user.email && (
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRequest(user)}
                    className="px-4 py-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Pending Requests */}
      {liveRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400">
            Pending Requests ({liveRequests.length})
          </h2>
          <div className="space-y-2.5">
            {liveRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    {req.fromUserAvatar || req.fromUserName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-white">
                      {req.fromUserName}
                    </h3>
                    <p className="text-xs text-gray-400">Sent a study buddy request</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(req.id, req.fromUserId)}
                    className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Circle Collective Stats Card */}
      <div className="bg-[#111827] dark:bg-[#15161A] text-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl border border-gray-800 relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
              Circle Overview
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-light text-white mt-1">
              {liveFriends.length + 1} student(s) studying together
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-lg relative z-10">
          Your study circle has completed <strong className="text-white">{totalCircleWeeklyHours} hours</strong> of focused preparation this week.
        </p>

        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#4F46E5]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Friends List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400">
            Your Study Buddies ({liveFriends.length})
          </h2>
          <span className="text-xs text-gray-400">Live streak & hours</span>
        </div>

        {/* You (User's own card in the circle) */}
        <div className="p-4 sm:p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#4F46E5] text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
              {(profile.name || 'Student')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111827] dark:text-white truncate">
                  {profile.name || 'Student'} (You)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[#4F46E5] dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  You
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profile.classLevel ? `Class ${profile.classLevel}` : 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{userStats.currentStreak}d</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                {userStats.formattedWeek}
              </span>
            </div>
          </div>
        </div>

        {/* Friends cards */}
        {liveFriends.length === 0 ? (
          <div className="p-8 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl text-center space-y-3">
            <Users className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#111827] dark:text-white">
                Your study circle is empty
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Search for classmates using the search bar above to send buddy requests and motivate each other.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {liveFriends.map((friend) => {
              const weekHours = Math.floor(friend.weeklyStudyMinutes / 60);
              const weekMins = friend.weeklyStudyMinutes % 60;
              const formattedFriendWeek = `${weekHours}h ${weekMins > 0 ? `${weekMins}m` : ''}`;

              return (
                <div
                  key={friend.id}
                  id={`friend_card_${friend.id}`}
                  className="p-4 sm:p-5 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] hover:border-[#4F46E5] dark:hover:border-indigo-500 rounded-2xl flex items-center justify-between gap-3 shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0">
                      {friend.avatar || friend.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-sm font-semibold text-[#111827] dark:text-white truncate">
                        {friend.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{friend.streakDays}d streak</span>
                        </span>
                        <span>•</span>
                        <span>{formattedFriendWeek} this week</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => nudgeFriend(friend.id)}
                      disabled={friend.nudgedToday}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
                        friend.nudgedToday
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                      }`}
                      title={
                        friend.nudgedToday
                          ? 'You nudged them today!'
                          : 'Send friendly study nudge'
                      }
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>{friend.nudgedToday ? 'Nudged' : 'Nudge'}</span>
                    </button>

                    <button
                      onClick={() => handleRemove(friend.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                      title="Remove from circle"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Privacy Guarantee Note */}
      <div className="p-4 bg-gray-50 dark:bg-[#16171A] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="leading-relaxed">
          <strong>Privacy first:</strong> Only your daily streak and total weekly hours are shared with your circle. Your private syllabus, individual chapter notes, and timetable are never visible to anyone else.
        </p>
      </div>
    </div>
  );
};
