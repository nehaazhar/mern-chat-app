import React from "react";
// 1. Saare missing components yahan add kar diye hain
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
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose, editProfile } = useDisclosure();
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);

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

      <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent h="410px">
          {/* User ka naam header mein */}
          <ModalHeader
            fontSize="40px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {user?.name}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  mt={3}
                />

                <Button
                  mt={4}
                  colorScheme="green"
                  onClick={() => {
                    console.log("Saved:", { name, email });
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
              </Box>
            ) : (
              <>
                {/* User ki Image */}
                <Image
                  borderRadius="full"
                  h="140px"
                  w="154px"
                  src={user?.pic}
                  alt={user?.name}
                />
                {/* User ka Email */}
                <Text
                  fontSize={{ base: "28px", md: "30px" }}
                  fontFamily="Work sans"
                >
                  Email: {user?.email}
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

            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
