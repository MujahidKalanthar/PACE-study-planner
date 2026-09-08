import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  RotateCw,
  Calendar,
  Heart,
  UserPlus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

export const NotificationsModal: React.FC = () => {
  const {
    notifications,
    showNotificationsModal,
    setShowNotificationsModal,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
    acceptFriendRequest,
    declineFriendRequest,
  } = useApp();

  if (!showNotificationsModal) return null;

  const handleActionClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.targetTab) {
      setActiveTab(notif.targetTab as any);
      setShowNotificationsModal(false);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'revision':
        return <RotateCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'exam':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'friend_nudge':
        return <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />;
    }
  };

  const getBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'revision':
        return 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40';
      case 'exam':
        return 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40';
      case 'friend_nudge':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40';
      case 'friend_request':
      case 'friend_accepted':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40';
    }
  };

  return (
    <div
      id="notifications_modal_backdrop"
      className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5E1] dark:border-[#2E3036] flex items-center justify-between bg-white dark:bg-[#1A1B1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-light text-[#111827] dark:text-white">
                Notifications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Revision reminders, exam pacing & circle updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No notifications right now
              </p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                We'll notify you when revisions are due or when your study circle nudges you.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                id={`notif_item_${notif.id}`}
                onClick={() => handleActionClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  notif.read
                    ? 'bg-white dark:bg-[#1A1B1F] border-[#E5E5E1] dark:border-[#2E3036] opacity-75 hover:opacity-100'
                    : 'bg-[#FDFCFB] dark:bg-[#202227] border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs'
                }`}
              >
                {/* Icon box */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getBg(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        notif.read
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-[#111827] dark:text-white'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Special actions for friend requests */}
                  {notif.type === 'friend_request' && notif.relatedEntityId && (
                    <div
                      className="flex items-center gap-2 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => acceptFriendRequest(notif.relatedEntityId!)}
                        className="px-3 py-1 bg-[#4F46E5] text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest(notif.relatedEntityId!)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {notif.targetTab && notif.type !== 'friend_request' && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-[#4F46E5] dark:text-indigo-400">
                      <span>View in {notif.targetTab}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#141518] border-t border-[#E5E5E1] dark:border-[#2E3036] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Alerts sync across your sessions</span>
          <button
            onClick={() => {
              setShowNotificationsModal(false);
              setActiveTab('more');
            }}
            className="font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline"
          >
            Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
};
