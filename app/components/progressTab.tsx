import { Tabs } from "@mantine/core";
import { useNavigate } from "@remix-run/react";
import { ReactNode } from "react";
import { links } from "~/lib/links";

type Props = {
  defaultValue: string;
  children: ReactNode;
};

export default function ProgressTab(props: Props) {
  const navigate = useNavigate();

  return (
    <Tabs
      color="violet"
      defaultValue={props.defaultValue}
      onChange={(value) => navigate(`${links.progress}/${value}`)}
    >
      <Tabs.List>
        <Tabs.Tab value="chart">Chart</Tabs.Tab>
        <Tabs.Tab value="calendar">calendar</Tabs.Tab>
      </Tabs.List>
      {props.children}
    </Tabs>
  );
}
