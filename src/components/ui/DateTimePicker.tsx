"use client";

import { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { pt } from "date-fns/locale/pt";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("pt", pt);

type Props = {
  name: string;
  required?: boolean;
};

export default function DateTimePicker({ name, required }: Props) {
  const [date, setDate] = useState<Date | null>(null);

  const value = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`
    : "";

  const filterTime = (time: Date) => {
    const hour = time.getHours();
    return hour >= 7 && hour <= 19;
  };

  return (
    <>
      <DatePicker
        selected={date}
        onChange={(d: Date | null) => setDate(d)}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        filterTime={filterTime}
        dateFormat="dd/MM/yyyy HH:mm"
        locale="pt"
        placeholderText="dd/mm/aaaa hh:mm"
        className="w-full border rounded-md px-3 py-2"
        wrapperClassName="w-full"
      />
      <input type="hidden" name={name} value={value} required={required} />
    </>
  );
}