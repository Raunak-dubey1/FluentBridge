import { useState } from "react";
import LanguageBadges from "./LanguageBadges";
import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import PostCallFeedbackModal from "./PostCallFeedbackModal";

const FriendCard = ({ friend }) => {
  const { authUser } = useAuthUser();
  const [showRatingModal, setShowRatingModal] = useState(false);

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4 space-y-2">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-1 min-w-0">
          <div className="avatar size-12 shrink-0">
            <img
              src={friend.profilePic}
              alt={friend.fullName}
              className="rounded-full object-cover"
            />
          </div>
          <h3 className="font-semibold truncate text-base">{friend.fullName}</h3>
        </div>

        <LanguageBadges user={friend} />

        <div className="flex gap-2 pt-2">
          <Link to={`/chat/${friend._id}`} className="btn btn-outline btn-sm flex-1">
            Message
          </Link>
          <button
            type="button"
            onClick={() => setShowRatingModal(true)}
            className="btn btn-primary btn-sm"
            title="Give practice rating & feedback"
          >
            ★ Rate
          </button>
        </div>

        {showRatingModal && (
          <PostCallFeedbackModal
            user={authUser}
            partner={friend}
            onClose={() => setShowRatingModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FriendCard;
