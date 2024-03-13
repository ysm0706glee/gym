import { Link } from "@remix-run/react";

export default function Home() {
  const LINKS = [
    {
      href: "/home/workout",
      label: "Start Workout",
    },
    {
      href: "/home/workout_menus",
      label: "Manage your workout menus",
    },
    {
      href: "/home/progress/chart",
      label: "View your progress",
    },
  ];

  return (
    <div>
      <h1>Home</h1>
      <ul>
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link to={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
