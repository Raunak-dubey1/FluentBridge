import FriendCard from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriendsFound.jsx";
import { getUserFriends } from "../lib/api.js";
import { useQuery } from "@tanstack/react-query";

export const FriendPage = () => {
  const {
    data: friends = [],
    isLoading: loadingFriends,
    isError,
    error,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Loading state
  if (loadingFriends) {
    return (
      <div className="min-h-screen bg-base-200 px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-base-300" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-base-300" />
          </div>

          {/* Friend Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 animate-pulse rounded-full bg-base-300 shrink-0" />

                  <div className="flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-base-300" />
                    <div className="mt-2 h-3 w-32 animate-pulse rounded bg-base-300" />
                  </div>
                </div>

                <div className="mt-4 sm:mt-5 h-9 w-full animate-pulse rounded-lg bg-base-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (friends.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-base-content">
              My Friends
            </h1>

            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-base-content/60">
              Connect with people and grow your network.
            </p>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-8 shadow-sm">
            <NoFriendsFound />
          </div>
        </div>
      </div>
    );
  }

  // Main page
  return (
    <div className="min-h-screen bg-base-200 px-3 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-base-content">
                My Friends
              </h1>

              <span className="badge badge-primary badge-md sm:badge-lg">
                {friends.length}
              </span>
            </div>

            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-base-content/60">
              People you're connected with.
            </p>
          </div>
        </div>

        {/* Friends Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {friends.map((friend) => (
            <FriendCard key={friend._id} friend={friend} />
          ))}
        </div>
      </div>
    </div>
  );
};
