import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBookingHistory } from "../actions";
import { BookingHistoryView } from "./booking-history-view";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookings = await getBookingHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Aulas</h1>
        <p className="mt-1 text-gray-500">Todas as suas aulas e alugueres.</p>
      </div>
      <BookingHistoryView bookings={bookings} />
    </div>
  );
}
