import React, { useCallback, useEffect, useState, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import {
  Box,
  Text,
  IconButton,
  Spinner,
  FormControl,
  Input,
  Image,
  Select,
  Button,
  useToast,
  useColorMode,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import { getSender, getSenderFull } from "../config/ChatLogics";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import axios from "axios";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import notificationSound from "../sound/notification-sound.mp3";

const ENDPOINT =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:5000");
var socket, selectedChatCompare;

function SIngleChat({ fetchAgain, setFetchAgain }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setsocketConnected] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState("friendly");
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const notificationAudioRef = useRef(null);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const toast = useToast();
  const { colorMode } = useColorMode();

  const {
    user,
    selectedChat,
    setSelectedChat,
    setNotification,
    onlineUsers,
    setOnlineUsers,
  } = ChatState();

  const selectedUser =
    selectedChat && !selectedChat.isGroupChat
      ? getSenderFull(user, selectedChat.users)
      : null;
  const isSelectedUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser._id)
    : false;
  const onlineGroupUsersCount = selectedChat?.isGroupChat
    ? selectedChat.users.filter(
        (chatUser) =>
          chatUser._id !== user._id && onlineUsers.includes(chatUser._id),
      ).length
    : 0;

  const playNotificationSound = useCallback(() => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.log(
        "Browser ne automatic sound block kiya (Interaction Needed):",
        err.message,
      );
    });
  }, []);

  const isImage = (url) => {
    return (
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://")) &&
      (url.includes("/image/upload/") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(url))
    );
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config,
      );

      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        localStorage.removeItem("userInfo");
        window.location.reload();
      } else {
        toast({
          title: "Error Occured!",
          description: "Failed to Load the Messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  }, [selectedChat, toast, user.token]);

  const handleMarkMessageAsRead = useCallback(
    async (messageId) => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const token = userInfo.token;

        await fetch(`/api/message/${messageId}/read`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        socket.emit("message read", {
          messageId,
          chatId: selectedChat?._id,
          userId: user._id,
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    },
    [selectedChat?._id, user._id],
  );

  useEffect(() => {
    notificationAudioRef.current = new Audio(notificationSound);
    notificationAudioRef.current.preload = "auto";

    const unlockAudio = () => {
      if (!notificationAudioRef.current) return;

      notificationAudioRef.current
        .play()
        .then(() => {
          notificationAudioRef.current.pause();
          notificationAudioRef.current.currentTime = 0;
        })
        .catch(() => {});
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    socket = io(ENDPOINT, {
      transports: ["websocket", "polling"],
      tryAllTransports: true,
    });
    socket.emit("setup", user);
    socket.on("connected", () => setsocketConnected(true));
    socket.on("online users", (users) => setOnlineUsers(users));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      socket.off("online users");
      socket.disconnect();
    };
  }, [setOnlineUsers, user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setIsTyping(false);
    if (selectedChat) {
      const clearDBNotifications = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };

          await axios.delete(`/api/notification/${selectedChat._id}`, config);
          setNotification((prevNotifications) =>
            prevNotifications.filter((n) => n.chat._id !== selectedChat._id),
          );
        } catch (error) {
          console.log(
            "Database se notification clear karne mein error:",
            error,
          );
        }
      };

      clearDBNotifications();
    }
  }, [fetchMessages, selectedChat, setNotification, user.token]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      playNotificationSound();

      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        setNotification((prevNotifications) => {
          const isAlreadyNotified = prevNotifications.some(
            (n) => n._id === newMessageReceived._id,
          );

          if (!isAlreadyNotified) {
            return [newMessageReceived, ...prevNotifications];
          }
          return prevNotifications;
        });

        setFetchAgain((prev) => !prev);
      } else {
        setMessages((prevMessages) => {
          const alreadyExists = prevMessages.some(
            (message) => message._id === newMessageReceived._id,
          );

          return alreadyExists
            ? prevMessages
            : [...prevMessages, newMessageReceived];
        });
      }
    });

    socket.on("message read", (data) => {
      const { messageId, userId } = data;
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg._id === messageId && !msg.readBy?.includes(userId)) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), userId],
            };
          }
          return msg;
        }),
      );
    });

    return () => {
      socket.off("message received");
      socket.off("message read");
    };
  }, [playNotificationSound, setFetchAgain, setNotification]);

  const submitMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !selectedChat) return;

    socket.emit("stop typing", selectedChat._id);
    setTyping(false);
    setNewMessage("");

    const currentReplyTo = replyTo;
    setReplyTo(null);

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, pic: user.pic },
      content: trimmedMessage,
      chat: selectedChat,
      replyTo: currentReplyTo,
      isOptimistic: true,
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content: trimmedMessage,
          chatId: selectedChat._id,
          replyTo: currentReplyTo ? currentReplyTo._id : null,
        },
        config,
      );

      socket.emit("new message", data);

      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === optimisticMessage._id ? data : message,
        ),
      );
    } catch (error) {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== optimisticMessage._id),
      );

      setNewMessage(trimmedMessage);
      setReplyTo(currentReplyTo);

      toast({
        title: "Error Occured!",
        description: "Failed to Send Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      messageInputRef.current?.focus();
    }
  };

  const sendMessage = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const assistWithAI = async () => {
    const draft = newMessage.trim();

    if (!selectedChat) {
      toast({
        title: "Select a chat",
        description: "Pick a conversation before using AI assist.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (aiMode !== "suggest_reply" && !draft) {
      toast({
        title: "Draft message needed",
        description: "Type a draft first and then try AI assist.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setAiLoading(true);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/ai/message-assist",
        {
          mode: aiMode,
          draft,
          chatId: selectedChat._id,
        },
        config,
      );

      setNewMessage(data.text || "");
      messageInputRef.current?.focus();

      toast({
        title: "AI draft ready",
        description:
          "Your message has been improved and inserted into the composer.",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      const description =
        error.response?.data?.message || "Could not generate AI suggestion.";

      toast({
        title: "AI assist failed",
        description,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const sendImageMessage = async (imageUrl) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const currentReplyTo = replyTo;

      setReplyTo(null);

      const { data } = await axios.post(
        "/api/message",
        {
          content: imageUrl,
          chatId: selectedChat._id,
          replyTo: currentReplyTo ? currentReplyTo._id : null,
        },
        config,
      );

      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.log(error);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    var timerLength = 3000;
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);
    }, timerLength);
  };

  const imageSelectHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg" ||
      file.type === "image/gif"
    ) {
      setLoading(true);

      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "doazgck2h");

      try {
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/doazgck2h/image/upload",
          {
            method: "post",
            body: data,
          },
        );

        const resData = await res.json();
        const imageUrl = resData.url.toString();

        setLoading(false);
        sendImageMessage(imageUrl);
      } catch (err) {
        console.log("Cloudinary Upload Error:", err);
        setLoading(false);
        toast({
          title: "Upload Failed",
          description: "Could not upload image to Cloudinary",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (png/jpg/jpeg/gif)",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            {!selectedChat.isGroupChat ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent={{ base: "flex-start", md: "space-between" }}
                gap={2}
                w={{ base: "auto", md: "100%" }}
              >
                <Box display="flex" alignItems="center" gap={3}>
                  <Image
                    borderRadius="full"
                    h={{ base: "40px", md: "50px" }}
                    w={{ base: "40px", md: "50px" }}
                    src={selectedUser?.pic}
                    alt={selectedUser?.name}
                    objectFit="cover"
                  />
                  <Box>
                    <Text
                      fontSize={{ base: "24px", md: "28px" }}
                      lineHeight="1"
                    >
                      {getSender(user, selectedChat.users)}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={isSelectedUserOnline ? "green.500" : "gray.500"}
                    >
                      {isSelectedUserOnline ? "Online" : "Offline"}
                    </Text>
                  </Box>
                </Box>
                <ProfileModal user={selectedUser} />
              </Box>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent={{ base: "flex-start", md: "space-between" }}
                gap={2}
                w={{ base: "auto", md: "100%" }}
              >
                <Box>
                  <Text fontSize={{ base: "24px", md: "28px" }} lineHeight="1">
                    {selectedChat.chatName.toUpperCase()}
                  </Text>
                  <Text fontSize="xs" color="green.500">
                    {onlineGroupUsersCount} online
                  </Text>
                </Box>
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </Box>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={colorMode === "dark" ? "gray.700" : "#E8E8E8"}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div
                className="message"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  overflowX: "hidden",
                  width: "100%",
                  scrollbarWidth: "thin",
                }}
              >
                <ScrollableChat
                  messages={messages}
                  setReplyTo={setReplyTo}
                  selectedChat={selectedChat}
                  onMarkAsRead={handleMarkMessageAsRead}
                />
              </div>
            )}

            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}

              {replyTo && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  bg={colorMode === "dark" ? "gray.600" : "#F0F9FF"}
                  p="10px 12px"
                  mx="48px"
                  borderTopRadius="md"
                  borderLeft="3px solid"
                  borderColor="blue.400"
                  mb="-1px"
                  boxShadow="0 1px 3px rgba(0, 0, 0, 0.08)"
                >
                  <Box flex={1} overflow="hidden">
                    <Text
                      fontWeight="600"
                      fontSize="xs"
                      color="blue.600"
                      mb="2px"
                    >
                      Replying to{" "}
                      {replyTo.sender._id === user._id
                        ? "Yourself"
                        : replyTo.sender.name}
                    </Text>
                    <Box>
                      {isImage(replyTo.content) ? (
                        <Text fontSize="xs" color="gray.700">
                          Photo
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="gray.700" noOfLines={1}>
                          {replyTo.content}
                        </Text>
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    size="xs"
                    icon={<CloseIcon />}
                    aria-label="Cancel Reply"
                    variant="ghost"
                    ml={2}
                    onClick={() => setReplyTo(null)}
                  />
                </Box>
              )}

              <Box
                display="flex"
                flexDirection={{ base: "column", md: "row" }}
                alignItems="center"
                gap={3}
                p={3}
                bg={colorMode === "dark" ? "gray.800" : "white"}
                border="1px solid"
                borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                borderRadius="3xl"
                boxShadow={
                  colorMode === "dark"
                    ? "0 18px 40px rgba(0,0,0,0.18)"
                    : "0 20px 60px rgba(99, 102, 241, 0.08)"
                }
              >
                <Box
                  display="flex"
                  flexDirection={{ base: "row", md: "column" }}
                  alignItems="stretch"
                  gap={2}
                  minW={{ base: "100%", md: "220px" }}
                >
                  <Select
                    size="md"
                    value={aiMode}
                    onChange={(e) => setAiMode(e.target.value)}
                    bg={colorMode === "dark" ? "gray.700" : "gray.50"}
                    color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
                    borderRadius="2xl"
                    borderColor={colorMode === "dark" ? "gray.600" : "gray.200"}
                    py={3}
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="fix_grammar">Fix grammar</option>
                    <option value="suggest_reply">Suggest reply</option>
                  </Select>

                  <Button
                    size="md"
                    colorScheme="purple"
                    isLoading={aiLoading}
                    loadingText="AI"
                    onClick={assistWithAI}
                    borderRadius="2xl"
                    px={6}
                    py={3}
                    boxShadow="md"
                  >
                    AI Assist
                  </Button>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  flex={1}
                >
                  <Input
                    ref={messageInputRef}
                    variant="filled"
                    bg={colorMode === "dark" ? "gray.700" : "gray.50"}
                    color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
                    onChange={typingHandler}
                    value={newMessage}
                    placeholder="Type your message..."
                    borderRadius="3xl"
                    px={4}
                    py={4}
                    minH="52px"
                    _placeholder={{
                      color: colorMode === "dark" ? "gray.400" : "gray.400",
                    }}
                  />

                  <IconButton
                    icon={<AttachmentIcon />}
                    aria-label="Attach File"
                    bg={colorMode === "dark" ? "gray.700" : "gray.100"}
                    color={colorMode === "dark" ? "whiteAlpha.900" : "gray.600"}
                    borderRadius="full"
                    _hover={{
                      bg: colorMode === "dark" ? "gray.600" : "gray.200",
                    }}
                    onClick={() => fileInputRef.current.click()}
                    size="md"
                  />

                  <IconButton
                    icon={<ArrowForwardIcon />}
                    aria-label="Send Message"
                    colorScheme="green"
                    borderRadius="full"
                    isDisabled={!newMessage.trim()}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={submitMessage}
                    size="md"
                  />
                </Box>
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
}

export default SIngleChat;
