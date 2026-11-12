import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <div className="p-2 sm:p-3 flex items-center justify-end max-w-7xl mx-auto w-full absolute top-1 right-2 sm:right-4 z-10 pointer-events-none">
      <button
        onClick={handleVideoCall}
        className="btn btn-success btn-xs sm:btn-sm text-white shadow-md pointer-events-auto flex items-center gap-1"
        title="Start Video Call"
      >
        <VideoIcon className="size-4 sm:size-5" />
        <span className="hidden sm:inline">Call</span>
      </button>
    </div>
  );
}

export default CallButton;
