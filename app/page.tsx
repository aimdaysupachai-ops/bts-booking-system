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

type Notification = {
  id: string;
  to: string;
  title: string;
  message: string;
  at: string;
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
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
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
      {children}
    </button>
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

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[tone]}`}>
      {children}
    </span>
  );
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fare, setFare] = useState(0);

  const stationLabel = (id: string) => {
    const s = stations.find((x) => x.station_id === id);
    return s ? `${s.station_id} - ${s.station_name}` : id;
  };

  const loadCards = async () => {
    const { data, error } = await supabase
      .from("bts_cards")
      .select("*")
      .eq("is_active", true)
      .order("card_id", { ascending: true });

    if (error) {
      alert("Load cards error: " + error.message);
      return;
    }

    setCards((data || []) as BtsCard[]);
  };

  useEffect(() => {
    async function loadMasterData() {
      const { data: stationData, error: stationError } = await supabase
        .from("bts_stations")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (stationError) {
        alert("Load stations error: " + stationError.message);
        return;
      }

      const loadedStations = (stationData || []) as Station[];
      setStations(loadedStations);

      if (loadedStations.length > 1) {
        setOrigin(loadedStations[0].station_id);
        setDestination(loadedStations[1].station_id);
      }

      await loadCards();
    }

    loadMasterData();
  }, []);

  useEffect(() => {
    async function loadFare() {
      if (!origin || !destination || origin === destination) {
        setFare(0);
        return;
      }

      const { data, error } = await supabase
        .from("bts_fares")
        .select("fare")
        .eq("origin_code", origin)
        .eq("destination_code", destination)
        .maybeSingle();

      if (error) {
        console.error(error);
        setFare(0);
        return;
      }

      const oneWayFare = data ? Number(data.fare) : 0;
      setFare(trip === "round" ? oneWayFare * 2 : oneWayFare);
    }

    loadFare();
  }, [origin, destination, trip]);

  const selectedCard = useMemo(() => {
    return cards
      .filter((c) => c.card_status === "Available" && Number(c.balance) >= fare)
      .sort((a, b) => Number(a.balance) - Number(b.balance))[0];
  }, [cards, fare]);

  const notify = (to: string, title: string, message: string) => {
    setNotifications((prev) => [
      {
        id: `NT-${prev.length + 1}`,
        to,
        title,
        message,
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const updateCardBalance = async (cardId: string, newBalance: number) => {
    const { error } = await supabase
      .from("bts_cards")
      .update({ balance: newBalance })
      .eq("card_id", cardId);

    if (error) {
      alert("Failed to update card balance: " + error.message);
      return;
    }

    setCards((prev) =>
      prev.map((card) =>
        card.card_id === cardId ? { ...card, balance: newBalance } : card
      )
    );

    alert("Card balance updated successfully");
  };

  const createBooking = async () => {
    if (!selectedCard || fare <= 0) return;
    if (!user.name || !user.email) {
      alert("Please enter name and email");
      return;
    }

    const holdUntil = addHours(bookingAt, HOLD_HOURS);
    const bookingId = `BK-${Date.now()}`;

    const newBalance = Number(selectedCard.balance) - fare;

    const { error: cardError } = await supabase
      .from("bts_cards")
      .update({
        balance: newBalance,
        card_status: "Reserved",
        current_booking_id: bookingId,
      })
      .eq("card_id", selectedCard.card_id);

    if (cardError) {
      alert("Failed to reserve card: " + cardError.message);
      return;
    }

    const newBooking: Booking = {
      id: bookingId,
      userName: user.name,
      userEmail: user.email,
      origin,
      destination,
      trip,
      fare,
      cardId: selectedCard.card_id,
      bookingAt,
      holdUntil,
      status: "Reserved",
      calendar: "Outlook event pending",
    };

    setBookings((prev) => [newBooking, ...prev]);
    await loadCards();

    notify(
      "Admin",
      "New booking",
      `${user.name} booked ${selectedCard.card_id}: ${stationLabel(origin)} → ${stationLabel(destination)}.`
    );

    setTab("bookings");
  };

  const editTrip = async (bookingId: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    const newTrip = b.trip === "round" ? "oneway" : "round";

    const { data } = await supabase
      .from("bts_fares")
      .select("fare")
      .eq("origin_code", b.origin)
      .eq("destination_code", b.destination)
      .maybeSingle();

    const oneWayFare = data ? Number(data.fare) : 0;
    const newFare = newTrip === "round" ? oneWayFare * 2 : oneWayFare;
    const diff = newFare - b.fare;

    const currentCard = cards.find((c) => c.card_id === b.cardId);
    if (!currentCard) return;

    const newBalance = Number(currentCard.balance) - diff;

    const { error } = await supabase
      .from("bts_cards")
      .update({ balance: newBalance })
      .eq("card_id", b.cardId);

    if (error) {
      alert("Failed to update card balance: " + error.message);
      return;
    }

    setBookings((prev) =>
      prev.map((x) =>
        x.id === bookingId
          ? {
              ...x,
              trip: newTrip,
              fare: newFare,
              calendar: "Outlook event updated",
            }
          : x
      )
    );

    await loadCards();
    notify("Admin", "Booking edited", `${b.userName} changed ${b.id} to ${newTrip}.`);
  };

  const requestCancel = (bookingId: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    setBookings((prev) =>
      prev.map((x) => (x.id === bookingId ? { ...x, status: "Cancel Requested" } : x))
    );

    notify("Admin", "Cancel approval required", `${b.userName} requested cancellation for ${b.id}.`);
  };

  const approveCancel = async (bookingId: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    const currentCard = cards.find((c) => c.card_id === b.cardId);
    if (!currentCard) return;

    const { error } = await supabase
      .from("bts_cards")
      .update({
        card_status: "Available",
        current_booking_id: null,
        balance: Number(currentCard.balance) + b.fare,
      })
      .eq("card_id", b.cardId);

    if (error) {
      alert("Failed to approve cancel: " + error.message);
      return;
    }

    setBookings((prev) =>
      prev.map((x) =>
        x.id === bookingId
          ? { ...x, status: "Cancelled", calendar: "Outlook event cancelled" }
          : x
      )
    );

    await loadCards();
    notify(b.userEmail, "Cancel approved", `Admin approved cancellation for ${b.id}.`);
  };

  const requestReturn = (bookingId: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    setBookings((prev) =>
      prev.map((x) => (x.id === bookingId ? { ...x, status: "Return Requested" } : x))
    );

    notify("Admin", "Return approval required", `${b.userName} requested return for ${b.cardId}.`);
  };

  const approveReturn = async (bookingId: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    const { error } = await supabase
      .from("bts_cards")
      .update({
        card_status: "Available",
        current_booking_id: null,
      })
      .eq("card_id", b.cardId);

    if (error) {
      alert("Failed to approve return: " + error.message);
      return;
    }

    setBookings((prev) =>
      prev.map((x) =>
        x.id === bookingId
          ? { ...x, status: "Returned", calendar: "Outlook event closed" }
          : x
      )
    );

    await loadCards();
    notify(b.userEmail, "Return approved", `Admin confirmed return of ${b.cardId}.`);
  };

  const statusTone = (status: string) => {
    if (status === "Reserved") return "blue";
    if (status.includes("Requested")) return "amber";
    if (status === "Cancelled") return "red";
    if (status === "Returned") return "green";
    return "slate";
  };

  const visibleBookings =
    role === "Admin"
      ? bookings
      : bookings.filter((b) => b.userEmail === user.email && user.email !== "");

  const visibleNoti = notifications.filter((n) =>
    role === "Admin" ? n.to === "Admin" : n.to === user.email
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Internal BTS Card Booking</h1>
            <p className="text-slate-500">
              Booking, fare lookup, card balance, cancel/return approval, in-app notification.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={role === "User" ? "primary" : "outline"}
              onClick={() => setRole("User")}
            >
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
            ["noti", `Notifications (${visibleNoti.length})`],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant={tab === key ? "primary" : "outline"}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </nav>

        {tab === "booking" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold">Create Booking</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Enter Name"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Enter Your Email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  type="datetime-local"
                  value={bookingAt}
                  onChange={(e) => setBookingAt(e.target.value)}
                />

                <select
                  className="rounded-xl border px-3 py-2"
                  value={trip}
                  onChange={(e) => setTrip(e.target.value)}
                >
                  <option value="oneway">One-way</option>
                  <option value="round">Round trip</option>
                </select>

                <select
                  className="rounded-xl border px-3 py-2"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                >
                  {stations.map((s) => (
                    <option key={s.station_id} value={s.station_id}>
                      {s.station_id} - {s.station_name}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border px-3 py-2"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
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

              <Button
                className="mt-5 w-full py-3"
                onClick={createBooking}
                disabled={!selectedCard || fare <= 0}
              >
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
                <div className="rounded-2xl bg-red-50 p-4 text-red-700">
                  No card has enough balance.
                </div>
              )}

              <div className="mt-4 space-y-3">
                {cards.map((c) => (
                  <div key={c.card_id} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <b>{c.card_id}</b>
                      <div className="text-sm text-slate-500">{c.balance} THB</div>
                    </div>
                    <Badge tone={c.card_status === "Available" ? "green" : "amber"}>
                      {c.card_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "bookings" && (
          <Card>
            <h2 className="mb-4 text-xl font-bold">Booking List</h2>

            <div className="space-y-3">
              {visibleBookings.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">
                  No booking yet
                </div>
              )}

              {visibleBookings.map((b) => (
                <div
                  key={b.id}
                  className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
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
                    <Button variant="outline" onClick={() => editTrip(b.id)} disabled={b.status !== "Reserved"}>
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
              ))}
            </div>
          </Card>
        )}

        {tab === "admin" && role === "Admin" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-xl font-bold">Admin Approval Queue</h2>

              <div className="space-y-3">
                {bookings.filter((b) => b.status.includes("Requested")).length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">
                    No pending request
                  </div>
                )}

                {bookings
                  .filter((b) => b.status.includes("Requested"))
                  .map((b) => (
                    <div key={b.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <b>{b.id}</b>
                        <Badge tone="amber">{b.status}</Badge>
                      </div>

                      <div className="text-sm text-slate-600">
                        {b.userName} / {b.cardId} / {b.fare} THB
                      </div>

                      <div className="mt-3 flex gap-2">
                        {b.status === "Cancel Requested" && (
                          <Button onClick={() => approveCancel(b.id)}>Approve Cancel</Button>
                        )}
                        {b.status === "Return Requested" && (
                          <Button onClick={() => approveReturn(b.id)}>Approve Return</Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-xl font-bold">Card Admin</h2>

              <div className="space-y-3">
                {cards.map((c) => (
                  <div
                    key={c.card_id}
                    className="grid grid-cols-[1fr_120px_auto_auto] items-center gap-3 rounded-xl border p-3"
                  >
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
                          prev.map((x) =>
                            x.card_id === c.card_id
                              ? { ...x, balance: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />

                    <Button
                      variant="outline"
                      onClick={() => updateCardBalance(c.card_id, Number(c.balance))}
                    >
                      Save
                    </Button>

                    <Badge tone={c.card_status === "Available" ? "green" : "amber"}>
                      {c.card_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "noti" && (
          <Card>
            <h2 className="mb-4 text-xl font-bold">In-App Notifications</h2>

            <div className="space-y-3">
              {visibleNoti.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">
                  No notification
                </div>
              )}

              {visibleNoti.map((n) => (
                <div key={n.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <b>{n.title}</b>
                    <span className="text-xs text-slate-400">{formatDate(n.at)}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{n.message}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}