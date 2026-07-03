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
        size={{ base: "sm", md: "xl" }}
        isOpen={isOpen}
        onClose={handleClose}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          h={{ base: "auto", md: "500px" }}
          p={{ base: 2, md: 0 }}
          boxShadow="0 20px 60px rgba(0,0,0,0.3)"
          borderRadius={{ base: "md", md: "xl" }}
        >
          {/* User ka naam header mein */}
          <ModalHeader
            fontSize={{ base: "24px", md: "48px" }}
            fontFamily="Work sans"
            fontWeight="bold"
            display="flex"
            justifyContent="center"
            p={{ base: "16px", md: "32px 24px 24px" }}
            borderBottom={{ base: "none", md: "2px solid" }}
            borderColor={{ base: "transparent", md: "blue.100" }}
          >
            {profileName || user?.name}
          </ModalHeader>

          <ModalCloseButton
            size={{ base: "sm", md: "lg" }}
            _hover={{ bg: "red.50" }}
            transition="all 0.2s"
          />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={{ base: "12px", md: "40px 24px" }}
            gap={{ base: 3, md: 6 }}
          >
            {isEditing ? (
              <Box w="100%">
                <Input
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  mb={3}
                  size={{ base: "sm", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "8px 12px", md: "12px 16px" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)" }}
                />
                <Input
                  placeholder="Email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  size={{ base: "sm", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "8px 12px", md: "12px 16px" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)" }}
                />
                <Box mt={4} display="flex" gap={3} flexDir={{ base: "column", md: "row" }}>
                  <Button
                    colorScheme="green"
                    onClick={handleSave}
                    size={{ base: "sm", md: "lg" }}
                    w={{ base: "100%", md: "auto" }}
                    px={{ base: 4, md: 8 }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    size={{ base: "sm", md: "lg" }}
                    w={{ base: "100%", md: "auto" }}
                    px={{ base: 4, md: 8 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Image
                  borderRadius="full"
                  h={{ base: "100px", md: "160px" }}
                  w={{ base: "100px", md: "160px" }}
                  src={user?.pic}
                  alt={profileName || user?.name}
                  boxShadow="0 8px 20px rgba(0,0,0,0.15)"
                  _hover={{ transform: "scale(1.05)", transition: "all 0.3s" }}
                  transition="all 0.3s"
                />
                <Text
                  fontSize={{ base: "14px", md: "20px" }}
                  fontFamily="Work sans"
                  textAlign="center"
                  wordBreak="break-word"
                  color={{ base: "gray.600", md: "gray.700" }}
                  fontWeight="500"
                >
                  Email: {profileEmail || user?.email}
                </Text>
              </>
            )}
          </ModalBody>

          <ModalFooter
            display="flex"
            gap={{ base: 2, md: 4 }}
            justifyContent="center"
            flexDir={{ base: "column", md: "row" }}
            p={{ base: "12px", md: "24px" }}
            borderTop={{ base: "none", md: "1px solid" }}
            borderColor={{ base: "transparent", md: "blue.100" }}
          >
            {!isEditing && (
              <Button
                colorScheme="blue"
                size={{ base: "sm", md: "lg" }}
                w={{ base: "100%", md: "auto" }}
                onClick={() => setIsEditing(true)}
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                transition="all 0.2s"
                px={{ base: 6, md: 8 }}
              >
                Edit Profile
              </Button>
            )}
            <Button
              colorScheme="blue"
              variant={{ base: "solid", md: "outline" }}
              size={{ base: "sm", md: "lg" }}
              w={{ base: "100%", md: "auto" }}
              onClick={handleClose}
              _hover={{ transform: "translateY(-2px)" }}
              transition="all 0.2s"
              px={{ base: 6, md: 8 }}
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
