import React, { useState, useEffect } from "react";
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
import { ChatIcon } from "@chakra-ui/icons";

const ScrollableChat = ({
  messages,
  setReplyTo,
  selectedChat,
  onMarkAsRead,
}) => {
  const { user } = ChatState();
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  // Mark message as read when viewed
  useEffect(() => {
    if (messages && messages.length > 0) {
      messages.forEach((msg) => {
        // Only mark incoming messages as read
        if (msg.sender._id !== user._id && !msg.readBy?.includes(user._id)) {
          const element = document.getElementById(`message-${msg._id}`);
          if (element) {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting) {
                  onMarkAsRead(msg._id);
                }
              },
              { threshold: 0.5 },
            );
            observer.observe(element);

            return () => observer.disconnect();
          }
        }
      });
    }
  }, [messages, user._id, onMarkAsRead]);

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

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div
            key={m._id}
            id={`message-${m._id}`}
            style={{
              display: "flex",
              alignItems: "flex-end",
              position: "relative",
              marginTop: isSameUser(messages, m, i, user._id) ? "2px" : "10px",
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
              display="flex"
              flexDirection="column"
              marginLeft={isSameSenderMargin(messages, m, i, user._id)}
              maxWidth={{ base: "85%", md: "70%" }}
              onMouseEnter={() => setHoveredMessageId(m._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <Box
                bg={m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}
                borderRadius="18px"
                px="12px"
                py="8px"
                boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
                display="flex"
                alignItems="center"
                gap="6px"
              >
                <Box flex={1}>
                  {m.replyTo && (
                    <Box
                      bg={m.sender._id === user._id ? "#A3BFFA" : "#A7F3D0"}
                      px="10px"
                      py="6px"
                      borderRadius="6px"
                      mb="6px"
                      borderLeft="3px solid"
                      borderColor={
                        m.sender._id === user._id ? "blue.500" : "green.500"
                      }
                      fontSize="xs"
                      cursor="pointer"
                      _hover={{ opacity: 0.8 }}
                      onClick={() => scrollToMessage(m.replyTo._id)}
                    >
                      <Text fontWeight="600" noOfLines={1}>
                        {m.replyTo.sender?._id === user._id
                          ? "You"
                          : m.replyTo.sender?.name}
                      </Text>
                      {isImage(m.replyTo.content) ? (
                        <Text fontSize="xs" color="gray.700">
                          Photo
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="gray.700" noOfLines={1}>
                          {m.replyTo.content}
                        </Text>
                      )}
                    </Box>
                  )}

                  {isImage(m.content) ? (
                    <Image
                      src={m.content}
                      alt="Attachment"
                      borderRadius="12px"
                      maxH="200px"
                      objectFit="cover"
                      cursor="pointer"
                      onClick={() => window.open(m.content, "_blank")}
                    />
                  ) : (
                    <Text wordBreak="break-word">{m.content}</Text>
                  )}
                </Box>

                {hoveredMessageId === m._id && (
                  <IconButton
                    icon={<ChatIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    aria-label="Reply"
                    onClick={() => setReplyTo(m)}
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                    isRound
                    flexShrink={0}
                    w="24px"
                    h="24px"
                    minW="24px"
                    minH="24px"
                    p="0"
                  />
                )}
              </Box>

              {/* Read Status Indicator */}
              {m.sender._id === user._id && (
                <Box display="flex" justifyContent="flex-end" mt="2px" px="4px">
                  <Text
                    fontSize="xs"
                    color={m.readBy?.length > 0 ? "blue.500" : "gray.400"}
                  >
                    {m.readBy?.length > 0 ? "✓✓" : "✓"}
                  </Text>
                </Box>
              )}
            </Box>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
