import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, getUserFriends } from "../lib/api";
import { StreamVideo, StreamVideoClient, StreamCall, CallControls, SpeakerLayout, StreamTheme, CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import PageLoader from "../components/PageLoader";
import PostCallFeedbackModal from "../components/PostCallFeedbackModal";

const STREAM_API_KEY = (import.meta.env.VITE_STREAM_API_KEY || "").replace(/['"]/g, "").trim();
export default function CallPage() {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(null);
  const { authUser } = useAuthUser();
  const { data: tokenData, isError: tokenError } = useQuery({ queryKey: ["streamToken"], queryFn: getStreamToken, enabled: !!authUser });
  const { data: friends = [], isPending: friendsPending, isError: friendsError } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });
  const partnerId = callId?.split("-").find(id => id !== authUser?._id);
  const partner = friends.find(friend => friend._id === partnerId);
  const validCall = !!partner && callId.split("-").length === 2 && callId.split("-").includes(authUser._id);
  const userId = authUser?._id;
  const userName = authUser?.fullName;
  const userImage = authUser?.profilePic;
  useEffect(() => {
    if (!tokenData?.token || !validCall || !STREAM_API_KEY) return;
    let cancelled = false;
    let videoClient;
    let instance;
    const dispose = async () => {
      try { if (instance && instance.state.callingState !== CallingState.LEFT) await instance.leave(); } catch { /* Already left. */ }
      try { await videoClient?.disconnectUser(); } catch { /* Connection already closed. */ }
    };
    const init = async () => {
      try {
        videoClient = new StreamVideoClient({ apiKey: STREAM_API_KEY, user: { id: userId, name: userName, image: userImage }, token: tokenData.token });
        instance = videoClient.call("default", callId);
        await instance.join({ create: true });
        if (cancelled) { await dispose(); return; }
        setConnection({ client: videoClient, call: instance });
      } catch (e) {
        await dispose();
        if (!cancelled) setError(e.message || "Could not join the call. Please try again.");
      }
    };
    init();
    return () => { cancelled = true; if (instance?.state.callingState !== CallingState.JOINING) void dispose(); };
  }, [tokenData?.token, callId, userId, userName, userImage, validCall]);
  const onFinished = useCallback(sessionId => setFinished({ sessionId }), []);
  if (finished) return <div className="min-h-screen bg-base-300"><PostCallFeedbackModal user={authUser} partner={partner} callId={callId} sessionId={finished.sessionId} onClose={() => navigate("/friends")} /></div>;
  const failure = error || (tokenError ? "Could not authenticate the call." : "") || (friendsError ? "Could not load your practice partners." : "") || (!STREAM_API_KEY ? "Video calling is unavailable." : "") || (!friendsPending && !validCall ? "This call is only available to its two practice partners." : "");
  if (failure) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"><p role="alert">{failure}</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button><Link className="btn" to="/friends">Back to friends</Link></div>;
  if (!connection) return <PageLoader />;
  return <div className="h-[100dvh] w-full bg-base-300 p-2 sm:p-4 overflow-hidden"><StreamVideo client={connection.client}><StreamCall call={connection.call}><CallContent call={connection.call} onFinished={onFinished} /></StreamCall></StreamVideo></div>;
}
function CallContent({ call, onFinished }) {
  const { useCallCallingState, useCallSession } = useCallStateHooks();
  const callingState = useCallCallingState();
  const session = useCallSession();
  const [sessionId, setSessionId] = useState(call.state.session?.id);
  useEffect(() => {
    if (callingState === CallingState.JOINED && session?.id) setSessionId(session.id);
    if (callingState === CallingState.LEFT) onFinished(sessionId || call.state.session?.id);
  }, [callingState, call, onFinished, sessionId, session?.id]);
  return <StreamTheme><SpeakerLayout /><CallControls /></StreamTheme>;
}
