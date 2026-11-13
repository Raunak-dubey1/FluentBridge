import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const rawApiKey = import.meta.env.VITE_STREAM_API_KEY || "";
const STREAM_API_KEY = rawApiKey.replace(/['"]/g, "").trim();

// Keep track of any in-flight connection promise to prevent duplicate connectUser calls in StrictMode
let connectionPromise = null;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState(null);

  const { authUser } = useAuthUser();

  const { data: tokenData, isError: tokenError } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      if (!STREAM_API_KEY) {
        setChatError("Stream API key is missing. Check your VITE_STREAM_API_KEY in frontend/.env");
        setLoading(false);
        return;
      }

      if (tokenError) {
        setChatError("Failed to fetch Stream authentication token from the server.");
        setLoading(false);
        return;
      }

      if (!tokenData?.token || !authUser?._id || !targetUserId) {
        return;
      }

      if (authUser._id.toString() === targetUserId.toString()) {
        setChatError("You cannot initiate a chat with yourself.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setChatError(null);

        const client = StreamChat.getInstance(STREAM_API_KEY);
        const currentUserId = authUser._id.toString();

        // If client is already connected as this user, don't call connectUser again
        if (client.userID !== currentUserId) {
          if (client.userID) {
            await client.disconnectUser();
          }

          if (!connectionPromise) {
            connectionPromise = client.connectUser(
              {
                id: currentUserId,
                name: authUser.fullName,
                image: authUser.profilePic || "",
              },
              tokenData.token
            );
          }

          await connectionPromise;
          connectionPromise = null;
        }

        const channelId = [currentUserId, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [currentUserId, targetUserId],
        });

        await currChannel.watch();

        if (isMounted) {
          setChatClient(client);
          setChannel(currChannel);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        connectionPromise = null;
        if (isMounted) {
          setChatError(error.message || "Could not connect to chat. Please try again.");
          toast.error("Could not connect to chat. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
  }, [tokenData, tokenError, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (chatError) {
    return (
      <div className="h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="card bg-base-200 p-6 sm:p-8 max-w-md shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-error">Chat Connection Error</h2>
          <p className="text-sm opacity-70">{chatError}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
              Retry
            </button>
            <Link to="/friends" className="btn btn-outline btn-sm">
              Back to Friends
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[calc(100dvh-4rem)] w-full flex flex-col overflow-hidden">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full h-full relative flex flex-col overflow-hidden">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
