import { useDisclosure } from "@mantine/hooks";
import { Modal, Button } from "@mantine/core";
import { ReactNode } from "react";

type Props = {
  buttonMessage: string;
  children: ReactNode;
};

export default function WorkoutModal(props: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} centered>
        {props.children}
      </Modal>

      <Button variant="filled" color="gray" onClick={open}>
        {props.buttonMessage}
      </Button>
    </>
  );
}
