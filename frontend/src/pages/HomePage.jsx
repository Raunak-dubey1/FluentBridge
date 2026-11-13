import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { capitialize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();

  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // Send friend request
  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,

    onSuccess: () => {
      // Refetch outgoing requests after successfully sending
      queryClient.invalidateQueries({
        queryKey: ["outgoingFriendReqs"],
      });
    },
  });

  // Create a Set containing recipient IDs
  useEffect(() => {
    const outgoingIds = new Set();

    if (outgoingFriendReqs?.outgoingRequests) {
      outgoingFriendReqs.outgoingRequests.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
    }

    setOutgoingRequestsIds(outgoingIds);
  }, [outgoingFriendReqs]);

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8 sm:space-y-10">

        {/* Friends Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
            Your Friends
          </h2>

          <Link to="/notifications" className="btn btn-outline btn-xs sm:btn-sm">
            <UsersIcon className="mr-1.5 size-4" />
            Friend Requests
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        {/* Recommended Users */}
        <section>
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                  Meet New Learners
                </h2>

                <p className="text-xs sm:text-sm opacity-70 mt-1">
                  Discover perfect language exchange partners based on your profile
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                No recommendations available
              </h3>

              <p className="text-base-content opacity-70 text-sm">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-4 sm:p-5 space-y-3 sm:space-y-4">

                      {/* User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="avatar size-14 sm:size-16 rounded-full shrink-0">
                          <img
                            src={user.profilePic}
                            alt={user.fullName}
                            className="rounded-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate">
                            {user.fullName}
                          </h3>

                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-0.5 truncate">
                              <MapPinIcon className="size-3 mr-1 shrink-0" />
                              <span className="truncate">{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary badge-xs sm:badge-sm">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitialize(user.nativeLanguage)}
                        </span>

                        <span className="badge badge-outline badge-xs sm:badge-sm">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <p className="text-xs sm:text-sm opacity-70 line-clamp-3">
                          {user.bio}
                        </p>
                      )}

                      {/* Action Button */}
                      <button
                        className={`btn btn-sm sm:btn-md w-full mt-2 ${
                          hasRequestBeenSent
                            ? "btn-disabled"
                            : "btn-primary"
                        }`}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-1.5" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-1.5" />
                            Send Friend Request
                          </>
                        )}
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
