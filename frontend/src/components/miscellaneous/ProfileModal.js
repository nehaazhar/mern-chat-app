import React, { useEffect, useState, useRef } from "react";
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
import { ViewIcon, EditIcon } from "@chakra-ui/icons";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.pic || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setProfileName(userInfo.name || user?.name || "");
      setProfileEmail(userInfo.email || user?.email || "");
      setProfilePic(userInfo.pic || user?.pic || "");
    }
    setIsEditing(false);
  }, [isOpen, user?.name, user?.email]);

  const handleClose = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePic(user?.pic || "");
    setIsEditing(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;

      const formData = new FormData();
      formData.append("name", profileName);
      formData.append("email", profileEmail);

      if (fileInputRef.current?.files?.[0]) {
        formData.append("pic", fileInputRef.current.files[0]);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        userInfo.name = data.name;
        userInfo.email = data.email;
        if (data.pic) userInfo.pic = data.pic;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        setProfilePic(data.pic || profilePic);
        setIsEditing(false);
      } else {
        console.log(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
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
            _hover={{ bg: "transparent", color: "red.400" }}
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
              <Box w="100%" display="flex" flexDir="column" alignItems="center">
                <Box position="relative" mb={6}>
                  <Image
                    borderRadius="full"
                    h={{ base: "100px", md: "140px" }}
                    w={{ base: "100px", md: "140px" }}
                    src={profilePic}
                    alt="Profile"
                    objectFit="cover"
                  />
                  <IconButton
                    icon={<EditIcon />}
                    position="absolute"
                    bottom={0}
                    right={0}
                    borderRadius="full"
                    bg="blue.500"
                    color="white"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ bg: "blue.600" }}
                  />
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                  />
                </Box>
                <Input
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  mb={3}
                  size={{ base: "sm", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "8px 12px", md: "12px 16px" }}
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
                  }}
                />
                <Input
                  placeholder="Email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  size={{ base: "sm", md: "lg" }}
                  fontSize={{ base: "14px", md: "16px" }}
                  p={{ base: "8px 12px", md: "12px 16px" }}
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)",
                  }}
                />
                <Box
                  mt={4}
                  display="flex"
                  gap={3}
                  flexDir={{ base: "column", md: "row" }}
                >
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
                  color={{ base: "blue.300", md: "blue.400" }}
                  fontWeight="600"
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
