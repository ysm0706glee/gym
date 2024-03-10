import { DatePicker, type DateValue } from "@mantine/dates";
import { useNavigate } from "@remix-run/react";

export default function Calendar() {
  const navigate = useNavigate();

  return (
    <div>
      <DatePicker
        onChange={(newDate: DateValue) => {
          if (!newDate) return;
          const year = newDate.getFullYear();
          const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
          const day = newDate.getDate().toString().padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;
          navigate(`/home/calendar/workout_menus?date=${formattedDate}`);
        }}
      />
    </div>
  );
}
