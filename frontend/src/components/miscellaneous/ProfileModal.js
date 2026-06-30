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

      <Modal size="lg" isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent h="410px">
          {/* User ka naam header mein */}
          <ModalHeader
            fontSize="40px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {profileName || user?.name}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
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
                  h="140px"
                  w="154px"
                  src={user?.pic}
                  alt={profileName || user?.name}
                />
                <Text
                  fontSize={{ base: "28px", md: "30px" }}
                  fontFamily="Work sans"
                >
                  Email: {profileEmail || user?.email}
                </Text>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            {!isEditing && (
              <Button
                colorScheme="blue"
                mr={3}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
            <Button colorScheme="blue" mr={3} onClick={handleClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
