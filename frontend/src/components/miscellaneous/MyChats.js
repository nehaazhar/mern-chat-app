import React, { useEffect, useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
import { useToast, Text, Stack, useColorMode } from "@chakra-ui/react";
import { Box, Button } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "../ChatLoading";
import { getSender, getSenderFull } from "../../config/ChatLogics";
import GroupChatModal from "./GroupChatModal";

function MyChats({ fetchAgain }) {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, user, setSelectedChat, chats, setChats, onlineUsers } =
    ChatState();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const getOnlineGroupUsersCount = (chat) => {
    if (!loggedUser || !chat.isGroupChat) return 0;

    return chat.users.filter(
      (chatUser) =>
        chatUser._id !== loggedUser._id && onlineUsers.includes(chatUser._id),
    ).length;
  };

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Result",
        status: "error",
        duration: 1000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg={colorMode === "dark" ? "gray.800" : "white"}
      color={colorMode === "dark" ? "whiteAlpha.900" : "gray.800"}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colorMode === "dark" ? "whiteAlpha.200" : "gray.200"}
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
          >
            {" "}
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg={colorMode === "dark" ? "gray.700" : "#F8F8F8"}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={
                  selectedChat === chat
                    ? "teal.500"
                    : colorMode === "dark"
                      ? "gray.600"
                      : "#E8E8E8"
                }
                color={
                  selectedChat === chat
                    ? "white"
                    : colorMode === "dark"
                      ? "whiteAlpha.900"
                      : "black"
                }
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {!chat.isGroupChat && loggedUser && (
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={
                        onlineUsers.includes(
                          getSenderFull(loggedUser, chat.users)._id,
                        )
                          ? "green.400"
                          : "gray.400"
                      }
                      flexShrink={0}
                    />
                  )}

                  <Box>
                    <Text>
                      {!chat.isGroupChat
                        ? getSender(loggedUser, chat.users)
                        : chat.chatName}
                    </Text>
                    {chat.isGroupChat && (
                      <Text fontSize="xs" opacity={0.75}>
                        {getOnlineGroupUsersCount(chat)} online
                      </Text>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
}

export default MyChats;
