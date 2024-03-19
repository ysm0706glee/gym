import { useDisclosure } from "@mantine/hooks";
import { Modal as MantineModal, Button } from "@mantine/core";
import { ReactNode } from "react";

type Props = {
  buttonMessage: string;
  children: ReactNode;
};

export default function Modal(props: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <MantineModal opened={opened} onClose={close} centered>
        {props.children}
      </MantineModal>

      <Button variant="filled" color="gray" onClick={open}>
        {props.buttonMessage}
      </Button>
    </>
  );
}
