import React, { useState } from "react";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import {
  Avatar,
  Tooltip,
  Image,
  Box,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { ArrowLeftIcon } from "@chakra-ui/icons";

const ScrollableChat = ({ messages, setReplyTo }) => {
  const { user } = ChatState();
  const [swipeState, setSwipeState] = useState({});

  // ✅ Common Image Helper
  const isImage = (url) => {
    return (
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://")) &&
      (url.includes("/image/upload/") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(url))
    );
  };

  // ✅ Scroll to Original Message
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    element.classList.add("reply-highlight");

    setTimeout(() => {
      element.classList.remove("reply-highlight");
    }, 1500);
  };

  // ✅ Swipe Handlers
  const handleMouseDown = (messageId, e) => {
    setSwipeState({
      messageId,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
    });
  };

  const handleMouseMove = (messageId, e) => {
    if (swipeState.messageId !== messageId || !swipeState.isDragging) return;

    const diff = swipeState.startX - e.clientX;
    const element = document.getElementById(`swipe-indicator-${messageId}`);

    if (element) {
      const opacity = Math.min(Math.abs(diff) / 80, 1);
      element.style.opacity = opacity;
      element.style.transform = `translateX(${Math.max(diff, 0)}px)`;
    }
  };

  const handleMouseUp = (messageId, message, e) => {
    if (swipeState.messageId !== messageId) {
      setSwipeState({});
      return;
    }

    const diff = swipeState.startX - e.clientX;

    if (Math.abs(diff) > 50) {
      setReplyTo(message);
    }

    const element = document.getElementById(`swipe-indicator-${messageId}`);
    if (element) {
      element.style.opacity = 0;
      element.style.transform = "translateX(0)";
    }

    setSwipeState({});
  };

  // ✅ Touch Handlers for Mobile
  const handleTouchStart = (messageId, e) => {
    setSwipeState({
      messageId,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isDragging: true,
    });
  };

  const handleTouchMove = (messageId, e) => {
    if (swipeState.messageId !== messageId || !swipeState.isDragging) return;

    const diff = swipeState.startX - e.touches[0].clientX;
    const element = document.getElementById(`swipe-indicator-${messageId}`);

    if (element) {
      const opacity = Math.min(Math.abs(diff) / 80, 1);
      element.style.opacity = opacity;
      element.style.transform = `translateX(${Math.max(diff, 0)}px)`;
    }
  };

  const handleTouchEnd = (messageId, message, e) => {
    if (swipeState.messageId !== messageId) {
      setSwipeState({});
      return;
    }

    const diff = swipeState.startX - e.changedTouches[0].clientX;

    if (Math.abs(diff) > 50) {
      setReplyTo(message);
    }

    const element = document.getElementById(`swipe-indicator-${messageId}`);
    if (element) {
      element.style.opacity = 0;
      element.style.transform = "translateX(0)";
    }

    setSwipeState({});
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div
            key={m._id}
            id={`message-${m._id}`}
            className="message-container"
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
            }}
          >
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mt="7px"
                  mr={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}

            <Box
              position="relative"
              marginLeft={isSameSenderMargin(messages, m, i, user._id)}
              marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
              maxWidth="75%"
            >
              {/* ✨ Swipe Indicator */}
              <Box
                id={`swipe-indicator-${m._id}`}
                position="absolute"
                left={m.sender._id === user._id ? "auto" : "-50px"}
                right={m.sender._id === user._id ? "-50px" : "auto"}
                top="50%"
                transform="translateY(-50%)"
                opacity={0}
                transition="opacity 0.2s ease"
                pointerEvents="none"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="40px"
                  h="40px"
                  bg="blue.400"
                  borderRadius="full"
                  boxShadow="0 2px 8px rgba(66, 153, 225, 0.3)"
                >
                  <ArrowLeftIcon
                    style={{
                      transform: "scaleX(-1)",
                      fontSize: "18px",
                      color: "white",
                    }}
                  />
                </Box>
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                bg={m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}
                borderRadius="20px"
                p="6px 14px"
                className="message-bubble"
                boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
                cursor="grab"
                userSelect="none"
                onMouseDown={(e) => handleMouseDown(m._id, e)}
                onMouseMove={(e) => handleMouseMove(m._id, e)}
                onMouseUp={(e) => handleMouseUp(m._id, m, e)}
                onMouseLeave={(e) => {
                  if (swipeState.isDragging) {
                    handleMouseUp(m._id, m, e);
                  }
                }}
                onTouchStart={(e) => handleTouchStart(m._id, e)}
                onTouchMove={(e) => handleTouchMove(m._id, e)}
                onTouchEnd={(e) => handleTouchEnd(m._id, m, e)}
                sx={{
                  "&:active": {
                    cursor: "grabbing",
                  },
                }}
              >
              {/* ====================== */}
              {/* Reply Preview */}
              {/* ====================== */}

              {m.replyTo && (
                <Box
                  bg={m.sender._id === user._id ? "#A3BFFA" : "#A7F3D0"}
                  p="8px 12px"
                  borderRadius="8px"
                  mb="8px"
                  borderLeft="4px solid"
                  borderColor={
                    m.sender._id === user._id ? "blue.500" : "green.500"
                  }
                  fontSize="xs"
                  cursor="pointer"
                  transition="all 0.2s"
                  position="relative"
                  _before={{
                    content: '""',
                    position: "absolute",
                    left: "-2px",
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    bg: m.sender._id === user._id ? "blue.500" : "green.500",
                    borderRadius: "0 4px 4px 0",
                  }}
                  _hover={{
                    opacity: 0.85,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transform: "translateX(2px)",
                  }}
                  onClick={() => scrollToMessage(m.replyTo._id)}
                >
                  <Text fontWeight="bold" noOfLines={1} mb="4px">
                    {m.replyTo.sender?._id === user._id
                      ? "👤 You"
                      : `👤 ${m.replyTo.sender?.name}`}
                  </Text>

                  {isImage(m.replyTo.content) ? (
                    <Box display="flex" alignItems="center" gap={2} mt={1}>
                      <Image
                        src={m.replyTo.content}
                        boxSize="38px"
                        borderRadius="md"
                        objectFit="cover"
                        boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                      />
                      <Text color="gray.700" fontWeight="500">
                        🖼 Photo
                      </Text>
                    </Box>
                  ) : (
                    <Text noOfLines={1} color="gray.700" fontWeight="500">
                      {m.replyTo.content}
                    </Text>
                  )}
                </Box>
              )}

              {/* ====================== */}
              {/* Main Message */}
              {/* ====================== */}

              {isImage(m.content) ? (
                <Image
                  src={m.content}
                  alt="Sent Attachment"
                  borderRadius="lg"
                  maxH="250px"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/150?text=Loading+Image..."
                  cursor="pointer"
                  onClick={() => window.open(m.content, "_blank")}
                  pointerEvents="none"
                />
              ) : (
                <Text wordBreak="break-word" pointerEvents="none">{m.content}</Text>
              )}
            </Box>
            </Box>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
