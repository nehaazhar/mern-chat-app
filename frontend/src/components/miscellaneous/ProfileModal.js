import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Button,
  Image,
  Text,
  Box,
  Input,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");

  useEffect(() => {
    if (isOpen) {
      // Modal open hone par localStorage se latest data fetch kro
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setProfileName(userInfo.name || user?.name || "");
      setProfileEmail(userInfo.email || user?.email || "");
    }
    setIsEditing(false);
  }, [isOpen, user?.name, user?.email]);

  const handleClose = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setIsEditing(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        userInfo.name = data.name;
        userInfo.email = data.email;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        setIsEditing(false);
      } else {
        console.log(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          display={{ base: "flex" }}
          icon={<ViewIcon />}
          onClick={onOpen}
        />
      )}

      <Modal
        size={{ base: "sm", md: "lg" }}
        isOpen={isOpen}
        onClose={handleClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent h={{ base: "auto", md: "410px" }} p={{ base: 2, md: 0 }}>
          {/* User ka naam header mein */}
          <ModalHeader
            fontSize={{ base: "24px", md: "40px" }}
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            p={{ base: "16px", md: "24px" }}
          >
            {profileName || user?.name}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
            p={{ base: "12px", md: "24px" }}
            gap={{ base: 3, md: 4 }}
          >
            {isEditing ? (
              <Box w="100%">
                <Input
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  mb={3}
                />
                <Input
                  placeholder="Email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
                <Box mt={4} display="flex" gap={3}>
                  <Button colorScheme="green" onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Image
                  borderRadius="full"
                  h={{ base: "100px", md: "140px" }}
                  w={{ base: "100px", md: "154px" }}
                  src={user?.pic}
                  alt={profileName || user?.name}
                />
                <Text
                  fontSize={{ base: "14px", md: "18px" }}
                  fontFamily="Work sans"
                  textAlign="center"
                  wordBreak="break-word"
                >
                  Email: {profileEmail || user?.email}
                </Text>
              </>
            )}
          </ModalBody>

          <ModalFooter
            display="flex"
            gap={2}
            justifyContent="center"
            flexDir={{ base: "column", md: "row" }}
            p={{ base: "12px", md: "24px" }}
          >
            {!isEditing && (
              <Button
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
                w={{ base: "100%", md: "auto" }}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
            <Button
              colorScheme="blue"
              size={{ base: "sm", md: "md" }}
              w={{ base: "100%", md: "auto" }}
              onClick={handleClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
