import LanguageBadges from "./LanguageBadges";
import { Link } from "react-router";

const FriendCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3 min-w-0">
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

        <Link to={`/chat/${friend._id}`} className="btn btn-outline btn-sm sm:btn-md w-full">
          Message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;
