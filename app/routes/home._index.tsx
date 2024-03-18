import { List, Text } from "@mantine/core";
import { Link } from "@remix-run/react";

export default function Home() {
  const LINKS = [
    {
      href: "/home/record",
      label: "Start Workout",
    },
    {
      href: "/home/workout_menus",
      label: "Manage workout menus",
    },
    {
      href: "/home/progress/chart",
      label: "View progress",
    },
  ];

  return (
    <div style={{ height: "100%" }}>
      <List>
        {LINKS.map((link) => (
          <List.Item key={link.href}>
            <Link to={link.href}>
              <Text size="xl">{link.label}</Text>
            </Link>
          </List.Item>
        ))}
      </List>
    </div>
  );
}
