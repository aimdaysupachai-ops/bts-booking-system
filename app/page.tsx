"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const HOLD_HOURS = 12;
const ADMIN_PASSWORD = "admin123";

type Station = {
station_id: string;
station_name: string;
line_name?: string;
sort_order?: number;
};

type BtsCard = {
card_id: string;
balance: number;
card_status: string;
current_booking_id?: string | null;
is_active: boolean;
};

type Booking = {
id: string;
userName: string;
userEmail: string;
origin: string;
destination: string;
trip: string;
fare: number;
cardId: string;
bookingAt: string;
holdUntil: string;
status: string;
calendar: string;
};

type EditDraft = {
origin: string;
destination: string;
trip: string;
};

function getCurrentDateTimeLocal() {
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
return now.toISOString().slice(0, 16);
}

function addHours(value: string, hours: number) {
const d = new Date(value);
d.setHours(d.getHours() + hours);
return d.toISOString().slice(0, 16);
}

function formatDate(value: string) {
if (!value) return "-";
return new Date(value).toLocaleString("th-TH", {
dateStyle: "medium",
timeStyle: "short",
});
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function Button({
children,
variant = "primary",
className = "",
...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
variant?: "primary" | "outline" | "danger";
}) {
const style =
variant === "primary"
? "bg-slate-900 text-white hover:bg-slate-700"
: variant === "danger"
? "bg-red-600 text-white hover:bg-red-500"
: "border bg-white hover:bg-slate-50";

return (
<button
{...props}
className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${style} ${className}`}
>
{children} </button>
);
}

function Badge({
children,
tone = "slate",
}: {
children: React.ReactNode;
tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
const map = {
slate: "bg-slate-100 text-slate-700",
blue: "bg-sky-100 text-sky-700",
green: "bg-emerald-100 text-emerald-700",
amber: "bg-amber-100 text-amber-700",
red: "bg-red-100 text-red-700",
};

return <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[tone]}`}>{children}</span>;
}

export default function App() {
const [role, setRole] = useState("User");
const [tab, setTab] = useState("booking");
const [user, setUser] = useState({ name: "", email: "" });

const [origin, setOrigin] = useState("");
const [destination, setDestination] = useState("");
const [trip, setTrip] = useState("oneway");
const [bookingAt, setBookingAt] = useState(getCurrentDateTimeLocal());

const [stations, setStations] = useState<Station[]>([]);
const [cards, setCards] = useState<BtsCard[]>([]);
const [bookings, setBookings] = useState<Booking[]>([]);
const [fare, setFare] = useState(0);
const [loading, setLoading] = useState(false);

const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
const [editDraft, setEditDraft] = useState<EditDraft>({
origin: "",
destination: "",
trip: "oneway",
});
const [editFarePreview, setEditFarePreview] = useState(0);

const stationLabel = (id: string) => {
const s = stations.find((x) => x.station_id === id);
return s ? `${s.station_id} - ${s.station_name}` : id;
};

const getOneWayFare = async (originCode: string, destinationCode: string) => {
if (!originCode || !destinationCode || originCode === destinationCode) return 0;

```
const { data, error } = await supabase
  .from("bts_fares")
  .select("fare")
  .eq("origin_code", originCode)
  .eq("destination_code", destinationCode)
  .maybeSingle();

if (error) {
  console.error("Load fare error", error);
  return 0;
}

return data ? Number(data.fare) : 0;
```

};

const calculateFare = async (originCode: string, destinationCode: string, tripType: string) => {
const oneWayFare = await getOneWayFare(originCode, destinationCode);
return tripType === "round" ? oneWayFare * 2 : oneWayFare;
};

const loadCards = async () => {
const { data, error } = await supabase
.from("bts_cards")
.select("card_id,balance,card_status,current_booking_id,is_active")
.eq("is_active", true)
.order("card_id", { ascending: true });

```
if (error) {
  alert("Load cards error: " + error.message);
  return;
}

setCards((data || []) as BtsCard[]);
```

};

const mapBookingRow = (row: any): Booking => ({
id: row.title,
userName: row.user_name,
userEmail: row.user_email,
origin: row.origin_code,
destination: row.destination_code,
trip: row.trip_type,
fare: Number(row.fare),
cardId: row.card_id,
bookingAt: row.booking_datetime,
holdUntil: row.hold_until,
status: row.booking_status,
calendar: row.outlook_status || "Pending",
});

const loadBookings = async () => {
const { data, error } = await supabase
.from("bts_bookings")
.select("*")
.order("created_at", { ascending: false });

```
if (error) {
  console.error("Load bookings error", error);
  return;
}

setBookings((data || []).map(mapBookingRow));
```

};

const refreshAll = async () => {
await Promise.all([loadCards(), loadBookings()]);
};

useEffect(() => {
async function loadMasterData() {
setLoading(true);

```
  const { data: stationData, error: stationError } = await supabase
    .from("bts_stations")
    .select("station_id,station_name,line_name,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (stationError) {
    alert("Load stations error: " + stationError.message);
    setLoading(false);
    return;
  }

  const loadedStations = (stationData || []) as Station[];
  setStations(loadedStations);

  if (loadedStations.length > 1) {
    setOrigin(loadedStations[0].station_id);
    setDestination(loadedStations[1].station_id);
  }

  await refreshAll();
  setLoading(false);
}

loadMasterData();
```

}, []);

useEffect(() => {
async function loadFare() {
const nextFare = await calculateFare(origin, destination, trip);
setFare(nextFare);
}

```
loadFare();
```

}, [origin, destination, trip]);

useEffect(() => {
async function loadEditFarePreview() {
if (!editingBookingId) return;
const nextFare = await calculateFare(editDraft.origin, editDraft.destination, editDraft.trip);
setEditFarePreview(nextFare);
}

```
loadEditFarePreview();
```

}, [editingBookingId, editDraft.origin, editDraft.destination, editDraft.trip]);

const selectedCard = useMemo(() => {
return cards
.filter((c) => c.card_status === "Available" && Number(c.balance) >= fare)
.sort((a, b) => Number(a.balance) - Number(b.balance))[0];
}, [cards, fare]);

const updateCardBalance = async (cardId: string, newBalance: number) => {
const { data, error } = await supabase
.from("bts_cards")
.update({ balance: newBalance })
.eq("card_id", cardId)
.select("card_id,balance,card_status,current_booking_id,is_active")
.single();

```
if (error) {
  alert("Failed to update card balance: " + error.message);
  return;
}

setCards((prev) => prev.map((card) => (card.card_id === cardId ? (data as BtsCard) : card)));
alert("Card balance updated successfully");
```

};

const createBooking = async () => {
if (!selectedCard || fare <= 0) return;
if (!user.name || !user.email) {
alert("Please enter name and email");
return;
}

```
setLoading(true);

const holdUntil = addHours(bookingAt, HOLD_HOURS);
const bookingId = `BK-${Date.now()}`;
const newBalance = Number(selectedCard.balance) - fare;

const { error: bookingError } = await supabase.from("bts_bookings").insert({
  title: bookingId,
  user_name: user.name,
  user_email: user.email.toLowerCase(),
  booking_datetime: bookingAt,
  hold_until: holdUntil,
  origin_code: origin,
  destination_code: destination,
  trip_type: trip,
  fare,
  card_id: selectedCard.card_id,
  booking_status: "Reserved",
  outlook_status: "Pending",
});

if (bookingError) {
  setLoading(false);
  alert("Failed to create booking: " + bookingError.message);
  return;
}

// Do not update current_booking_id here.
// Your current database has a foreign key connected to bts_card_transactions,
// so updating current_booking_id causes the error shown in the screenshot.
const { error: cardError } = await supabase
  .from("bts_cards")
  .update({
    balance: newBalance,
    card_status: "Reserved",
  })
  .eq("card_id", selectedCard.card_id);

if (cardError) {
  setLoading(false);
  alert("Booking created but failed to reserve card: " + cardError.message);
  return;
}

await refreshAll();
setTab("bookings");
setLoading(false);
```

};

const startEditBooking = (booking: Booking) => {
setEditingBookingId(booking.id);
setEditDraft({
origin: booking.origin,
destination: booking.destination,
trip: booking.trip,
});
};

const cancelEditBooking = () => {
setEditingBookingId(null);
setEditDraft({ origin: "", destination: "", trip: "oneway" });
setEditFarePreview(0);
};

const saveEditBooking = async (bookingId: string) => {
const b = bookings.find((x) => x.id === bookingId);
if (!b) return;

```
if (!editDraft.origin || !editDraft.destination || editDraft.origin === editDraft.destination) {
  alert("Please select different origin and destination stations");
  return;
}

const newFare = await calculateFare(editDraft.origin, editDraft.destination, editDraft.trip);
if (newFare <= 0) {
  alert("Fare not found for selected route");
  return;
}

const currentCard = cards.find((c) => c.card_id === b.cardId);
if (!currentCard) return;

const diff = newFare - b.fare;
const newBalance = Number(currentCard.balance) - diff;

if (newBalance < 0) {
  alert("Selected card does not have enough balance for the updated trip");
  return;
}

setLoading(true);

const { error: bookingError } = await supabase
  .from("bts_bookings")
  .update({
    origin_code: editDraft.origin,
    destination_code: editDraft.destination,
    trip_type: editDraft.trip,
    fare: newFare,
    outlook_status: "Updated",
  })
  .eq("title", bookingId);

if (bookingError) {
  setLoading(false);
  alert("Failed to update booking: " + bookingError.message);
  return;
}

const { error: cardError } = await supabase
  .from("bts_cards")
  .update({ balance: newBalance })
  .eq("card_id", b.cardId);

if (cardError) {
  setLoading(false);
  alert("Failed to update card balance: " + cardError.message);
  return;
}

cancelEditBooking();
await refreshAll();
setLoading(false);
```

};

const requestCancel = async (bookingId: string) => {
const { error } = await supabase
.from("bts_bookings")
.update({ booking_status: "Cancel Requested", outlook_status: "WaitingAdminCancellation" })
.eq("title", bookingId);

```
if (error) {
  alert("Failed to request cancel: " + error.message);
  return;
}

await refreshAll();
```

};

const requestReturn = async (bookingId: string) => {
const { error } = await supabase
.from("bts_bookings")
.update({ booking_status: "Return Requested", outlook_status: "WaitingAdminReturn" })
.eq("title", bookingId);

```
if (error) {
  alert("Failed to request return: " + error.message);
  return;
}

await refreshAll();
```

};

const approveRequest = async (bookingId: string) => {
const b = bookings.find((x) => x.id === bookingId);
if (!b) return;

```
const currentCard = cards.find((c) => c.card_id === b.cardId);
if (!currentCard) return;

if (b.status === "Cancel Requested") {
  const { error: bookingError } = await supabase
    .from("bts_bookings")
    .update({ booking_status: "Cancelled", outlook_status: "Cancelled" })
    .eq("title", bookingId);

  if (bookingError) {
    alert("Failed to approve cancellation: " + bookingError.message);
    return;
  }

  const { error: cardError } = await supabase
    .from("bts_cards")
    .update({
      card_status: "Available",
      current_booking_id: null,
      balance: Number(currentCard.balance) + b.fare,
    })
    .eq("card_id", b.cardId);

  if (cardError) {
    alert("Failed to update card: " + cardError.message);
    return;
  }
} else if (b.status === "Return Requested") {
  const { error: bookingError } = await supabase
    .from("bts_bookings")
    .update({ booking_status: "Returned", outlook_status: "Closed" })
    .eq("title", bookingId);

  if (bookingError) {
    alert("Failed to approve return: " + bookingError.message);
    return;
  }

  const { error: cardError } = await supabase
    .from("bts_cards")
    .update({ card_status: "Available", current_booking_id: null })
    .eq("card_id", b.cardId);

  if (cardError) {
    alert("Failed to update card: " + cardError.message);
    return;
  }
}

await refreshAll();
```

};

const statusTone = (status: string) => {
if (status === "Reserved") return "blue";
if (status.includes("Requested")) return "amber";
if (status === "Cancelled") return "red";
if (status === "Returned") return "green";
return "slate";
};

const visibleBookings =
role === "Admin" ? bookings : bookings.filter((b) => b.userEmail === user.email.toLowerCase() && user.email !== "");

return ( <main className="min-h-screen bg-slate-50 p-6 text-slate-900"> <div className="mx-auto max-w-7xl space-y-6"> <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"> <div> <h1 className="text-3xl font-bold">Internal BTS Card Booking</h1> <p className="text-slate-500">Booking, fare lookup, card balance, cancel/return approval.</p> </div>

```
      <div className="flex gap-2">
        <Button variant={role === "User" ? "primary" : "outline"} onClick={() => setRole("User")}>
          User
        </Button>

        <Button
          variant={role === "Admin" ? "primary" : "outline"}
          onClick={() => {
            const password = window.prompt("Enter Admin Password");
            if (password === ADMIN_PASSWORD) {
              setRole("Admin");
            } else if (password !== null) {
              alert("Invalid admin password");
            }
          }}
        >
          Admin
        </Button>
      </div>
    </header>

    <nav className="flex flex-wrap gap-2">
      {[
        ["booking", "Booking"],
        ["bookings", "Booking List"],
        ...(role === "Admin" ? [["admin", "Admin"]] : []),
      ].map(([key, label]) => (
        <Button key={key} variant={tab === key ? "primary" : "outline"} onClick={() => setTab(key)}>
          {label}
        </Button>
      ))}
    </nav>

    {loading && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Loading / Saving data...</div>}

    {tab === "booking" && (
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">Create Booking</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Enter Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />

            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Enter Your Email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />

            <input className="rounded-xl border px-3 py-2" type="datetime-local" value={bookingAt} onChange={(e) => setBookingAt(e.target.value)} />

            <select className="rounded-xl border px-3 py-2" value={trip} onChange={(e) => setTrip(e.target.value)}>
              <option value="oneway">One-way</option>
              <option value="round">Round trip</option>
            </select>

            <select className="rounded-xl border px-3 py-2" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.station_id} - {s.station_name}
                </option>
              ))}
            </select>

            <select className="rounded-xl border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)}>
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.station_id} - {s.station_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-100 p-4">
            <div className="text-sm text-slate-500">Estimated Fare</div>
            <div className="text-3xl font-bold">{fare} THB</div>
            <div className="mt-2 text-sm text-slate-500">
              {stationLabel(origin)} → {stationLabel(destination)} / {trip}
            </div>
          </div>

          <Button className="mt-5 w-full py-3" onClick={createBooking} disabled={!selectedCard || fare <= 0 || loading}>
            Reserve Card
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-bold">Auto Selected Card</h2>

          {selectedCard ? (
            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="text-2xl font-bold">{selectedCard.card_id}</div>
              <div>Balance before: {selectedCard.balance} THB</div>
              <Badge tone="green">Enough balance</Badge>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-50 p-4 text-red-700">No card has enough balance.</div>
          )}

          <div className="mt-4 space-y-3">
            {cards.map((c) => (
              <div key={c.card_id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <b>{c.card_id}</b>
                  <div className="text-sm text-slate-500">{c.balance} THB</div>
                </div>
                <Badge tone={c.card_status === "Available" ? "green" : "amber"}>{c.card_status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )}

    {tab === "bookings" && (
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Booking List</h2>
          <Button variant="outline" onClick={refreshAll}>Refresh</Button>
        </div>

        <div className="space-y-3">
          {visibleBookings.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">No booking yet</div>}

          {visibleBookings.map((b) => (
            <div key={b.id} className="rounded-xl border p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{b.id}</b>
                    <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                  </div>

                  <div className="text-sm text-slate-600">
                    {b.userName} ({b.userEmail})
                  </div>

                  <div className="text-sm text-slate-600">
                    {stationLabel(b.origin)} → {stationLabel(b.destination)} / {b.trip} / {b.fare} THB
                  </div>

                  <div className="text-sm text-slate-500">
                    Card: {b.cardId} | Hold: {formatDate(b.bookingAt)} - {formatDate(b.holdUntil)} | {b.calendar}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => startEditBooking(b)} disabled={b.status !== "Reserved"}>
                    Edit Trip
                  </Button>
                  <Button variant="outline" onClick={() => requestCancel(b.id)} disabled={b.status !== "Reserved"}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => requestReturn(b.id)} disabled={b.status !== "Reserved"}>
                    Return
                  </Button>
                </div>
              </div>

              {editingBookingId === b.id && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-3 font-bold">Edit Booking</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <select
                      className="rounded-xl border px-3 py-2"
                      value={editDraft.origin}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, origin: e.target.value }))}
                    >
                      {stations.map((s) => (
                        <option key={s.station_id} value={s.station_id}>
                          {s.station_id} - {s.station_name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded-xl border px-3 py-2"
                      value={editDraft.destination}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, destination: e.target.value }))}
                    >
                      {stations.map((s) => (
                        <option key={s.station_id} value={s.station_id}>
                          {s.station_id} - {s.station_name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded-xl border px-3 py-2"
                      value={editDraft.trip}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, trip: e.target.value }))}
                    >
                      <option value="oneway">One-way</option>
                      <option value="round">Round trip</option>
                    </select>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">New fare: {editFarePreview} THB</div>

                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => saveEditBooking(b.id)}>Save Edit</Button>
                    <Button variant="outline" onClick={cancelEditBooking}>Cancel Edit</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    )}

    {tab === "admin" && role === "Admin" && (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Admin Approval Queue</h2>
            <Button variant="outline" onClick={refreshAll}>Refresh</Button>
          </div>

          <div className="space-y-3">
            {bookings.filter((b) => b.status.includes("Requested")).length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">No pending request</div>}

            {bookings.filter((b) => b.status.includes("Requested")).map((b) => (
              <div key={b.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <b>{b.id}</b>
                  <Badge tone="amber">{b.status}</Badge>
                </div>

                <div className="text-sm text-slate-600">
                  {b.userName} / {b.cardId} / {b.fare} THB
                </div>

                <div className="mt-3 flex gap-2">
                  <Button onClick={() => approveRequest(b.id)}>Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-bold">Card Admin</h2>

          <div className="space-y-3">
            {cards.map((c) => (
              <div key={c.card_id} className="grid grid-cols-[1fr_120px_auto_auto] items-center gap-3 rounded-xl border p-3">
                <div>
                  <b>{c.card_id}</b>
                  <div className="text-sm text-slate-500">{c.card_status}</div>
                </div>

                <input
                  className="rounded-xl border px-3 py-2"
                  type="number"
                  value={c.balance}
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((x) => (x.card_id === c.card_id ? { ...x, balance: Number(e.target.value) } : x))
                    )
                  }
                />

                <Button variant="outline" onClick={() => updateCardBalance(c.card_id, Number(c.balance))}>
                  Save
                </Button>

                <Badge tone={c.card_status === "Available" ? "green" : "amber"}>{c.card_status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )}
  </div>
</main>
```

);
}
