import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <button
      type="button"
      onClick={handleVideoCall}
      className="btn btn-success btn-sm min-h-11 min-w-11 shrink-0 text-white shadow-md flex items-center gap-1"
      aria-label="Start video call"
      title="Start Video Call"
    >
      <VideoIcon className="size-5" aria-hidden="true" />
      <span className="hidden sm:inline">Call</span>
    </button>
  );
}

export default CallButton;
