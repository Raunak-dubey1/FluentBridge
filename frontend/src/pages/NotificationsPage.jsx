import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import useAuthUser from "../hooks/useAuthUser";
import { label, learningLanguages, nativeLanguages } from "../constants/learning";
import { Link } from "react-router";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const verified = learningLanguages(authUser).filter(l => l.isVerified);

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // Filter out any entries where sender or recipient might be null (e.g. deleted user)
  const incomingRequests = (friendRequests?.incomingReqs || []).filter(r => Boolean(r?.sender));
  const acceptedRequests = (friendRequests?.acceptedReqs || []).filter(r => Boolean(r?.recipient));

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Notifications</h1>

        {verified.map(l => (
          <Link key={l.language} to="/dashboard" className="card bg-success/10 border border-success/30 p-5">
            <strong>⭐ You earned Native Verification in {label(l.language)}!</strong>
            <span className="text-sm opacity-70 mt-1">View your practice milestones and consider your next CEFR level.</span>
          </Link>
        ))}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="size-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => {
                    const sender = request.sender;
                    if (!sender) return null;

                    const nativeLangs = nativeLanguages(sender);
                    const targetLangs = learningLanguages(sender);

                    return (
                      <div
                        key={request._id}
                        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="card-body p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="avatar size-12 sm:size-14 rounded-full bg-base-300 shrink-0">
                                <img
                                  src={sender.profilePic || `https://api.dicebear.com/9.x/adventurer/svg?seed=${sender._id || "default"}`}
                                  alt={sender.fullName || "User"}
                                  className="rounded-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{sender.fullName || "Language Partner"}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {nativeLangs.length > 0 ? (
                                    nativeLangs.map(l => (
                                      <span key={l} className="badge badge-secondary badge-xs sm:badge-sm">
                                        Native: {label(l)}
                                      </span>
                                    ))
                                  ) : sender.nativeLanguage ? (
                                    <span className="badge badge-secondary badge-xs sm:badge-sm">
                                      Native: {label(sender.nativeLanguage)}
                                    </span>
                                  ) : null}

                                  {targetLangs.length > 0 ? (
                                    targetLangs.map(l => (
                                      <span key={l.language} className="badge badge-outline badge-xs sm:badge-sm">
                                        Learning: {label(l.language)} {l.level ? `(${l.level})` : ""}
                                      </span>
                                    ))
                                  ) : sender.learningLanguage ? (
                                    <span className="badge badge-outline badge-xs sm:badge-sm">
                                      Learning: {label(sender.learningLanguage)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <button
                              className="btn btn-primary btn-sm w-full sm:w-auto shrink-0"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isPending}
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATIONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="size-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => {
                    const recipient = notification.recipient;
                    if (!recipient) return null;

                    return (
                      <div key={notification._id} className="card bg-base-200 shadow-sm">
                        <div className="card-body p-3 sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="avatar size-10 sm:size-11 rounded-full shrink-0">
                              <img
                                src={recipient.profilePic || `https://api.dicebear.com/9.x/adventurer/svg?seed=${recipient._id || "default"}`}
                                alt={recipient.fullName || "User"}
                                className="rounded-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{recipient.fullName || "Language Partner"}</h3>
                              <p className="text-xs sm:text-sm my-0.5 truncate opacity-80">
                                Accepted your friend request
                              </p>
                              <p className="text-[11px] sm:text-xs flex items-center opacity-70">
                                <ClockIcon className="size-3 mr-1" />
                                Recently
                              </p>
                            </div>
                            <div className="badge badge-success badge-sm shrink-0">
                              <MessageSquareIcon className="size-3 mr-1" />
                              <span className="hidden xs:inline">Friend</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && verified.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
