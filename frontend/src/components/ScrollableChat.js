import React from "react";
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
              marginLeft={isSameSenderMargin(messages, m, i, user._id)}
              marginTop={isSameUser(messages, m, i, user._id) ? 3 : 10}
              maxWidth="75%"
              display="flex"
              flexDirection="column"
              bg={m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}
              borderRadius="20px"
              p="6px 14px"
              position="relative"
              role="group"
              className="message-bubble"
              boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
              _hover={{
                "& [data-reply-btn]": {
                  opacity: 1,
                  visibility: "visible",
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
                />
              ) : (
                <Text wordBreak="break-word">{m.content}</Text>
              )}

              {/* ====================== */}
              {/* Reply Button */}
              {/* ====================== */}

              <IconButton
                data-reply-btn
                aria-label="Reply to message"
                icon={<ArrowLeftIcon style={{ transform: "scaleX(-1)", fontSize: "16px" }} />}
                size="md"
                variant="solid"
                bg="blue.400"
                color="white"
                position="absolute"
                left={m.sender._id === user._id ? "-45px" : "auto"}
                right={m.sender._id === user._id ? "auto" : "-45px"}
                top="35%"
                borderRadius="full"
                opacity={0}
                visibility="hidden"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                cursor="pointer"
                _hover={{
                  bg: "blue.500",
                  transform: "scale(1.15)",
                  boxShadow: "0 4px 12px rgba(66, 153, 225, 0.4)",
                }}
                onClick={() => setReplyTo(m)}
                title="Click to reply"
              />
            </Box>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
