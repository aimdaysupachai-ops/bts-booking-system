"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const HOLD_HOURS = 12;
const ADMIN_PASSWORD = "admin123";

function getCurrentDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const stations = [
  { id: "N24", name: "Khu Khot", line: "Sukhumvit North" },
  { id: "N23", name: "Yaek Kor Por Aor", line: "Sukhumvit North" },
  { id: "N22", name: "Royal Thai Air Force Museum", line: "Sukhumvit North" },
  { id: "N21", name: "Bhumibol Adulyadej Hospital", line: "Sukhumvit North" },
  { id: "N20", name: "Saphan Mai", line: "Sukhumvit North" },
  { id: "N19", name: "Sai Yud", line: "Sukhumvit North" },
  { id: "N18", name: "Phahon Yothin 59", line: "Sukhumvit North" },
  { id: "N17", name: "Wat Phra Sri Mahathat", line: "Sukhumvit North" },
  { id: "N16", name: "11th Infantry Regiment", line: "Sukhumvit North" },
  { id: "N15", name: "Bang Bua", line: "Sukhumvit North" },
  { id: "N14", name: "Royal Forest Department", line: "Sukhumvit North" },
  { id: "N13", name: "Kasetsart University", line: "Sukhumvit North" },
  { id: "N12", name: "Sena Nikhom", line: "Sukhumvit North" },
  { id: "N11", name: "Ratchayothin", line: "Sukhumvit North" },
  { id: "N10", name: "Phahon Yothin 24", line: "Sukhumvit North" },
  { id: "N9", name: "Ha Yaek Lat Phrao", line: "Sukhumvit North" },
  { id: "N8", name: "Mo Chit", line: "Sukhumvit North" },
  { id: "N7", name: "Saphan Khwai", line: "Sukhumvit North" },
  { id: "N5", name: "Ari", line: "Sukhumvit North" },
  { id: "N4", name: "Sanam Pao", line: "Sukhumvit North" },
  { id: "N3", name: "Victory Monument", line: "Sukhumvit North" },
  { id: "N2", name: "Phaya Thai", line: "Sukhumvit North" },
  { id: "N1", name: "Ratchathewi", line: "Sukhumvit North" },
  { id: "CEN", name: "Siam", line: "Interchange" },
  { id: "E1", name: "Chit Lom", line: "Sukhumvit East" },
  { id: "E2", name: "Phloen Chit", line: "Sukhumvit East" },
  { id: "E3", name: "Nana", line: "Sukhumvit East" },
  { id: "E4", name: "Asok", line: "Sukhumvit East" },
  { id: "E5", name: "Phrom Phong", line: "Sukhumvit East" },
  { id: "E6", name: "Thong Lo", line: "Sukhumvit East" },
  { id: "E7", name: "Ekkamai", line: "Sukhumvit East" },
  { id: "E8", name: "Phra Khanong", line: "Sukhumvit East" },
  { id: "E9", name: "On Nut", line: "Sukhumvit East" },
  { id: "E10", name: "Bang Chak", line: "Sukhumvit East" },
  { id: "E11", name: "Punnawithi", line: "Sukhumvit East" },
  { id: "E12", name: "Udom Suk", line: "Sukhumvit East" },
  { id: "E13", name: "Bang Na", line: "Sukhumvit East" },
  { id: "E14", name: "Bearing", line: "Sukhumvit East" },
  { id: "E15", name: "Samrong", line: "Sukhumvit East" },
  { id: "E16", name: "Pu Chao", line: "Sukhumvit East" },
  { id: "E17", name: "Chang Erawan", line: "Sukhumvit East" },
  { id: "E18", name: "Royal Thai Naval Academy", line: "Sukhumvit East" },
  { id: "E19", name: "Pak Nam", line: "Sukhumvit East" },
  { id: "E20", name: "Srinagarindra", line: "Sukhumvit East" },
  { id: "E21", name: "Phraek Sa", line: "Sukhumvit East" },
  { id: "E22", name: "Sai Luat", line: "Sukhumvit East" },
  { id: "E23", name: "Kheha", line: "Sukhumvit East" },
  { id: "W1", name: "National Stadium", line: "Silom" },
  { id: "S1", name: "Ratchadamri", line: "Silom" },
  { id: "S2", name: "Sala Daeng", line: "Silom" },
  { id: "S3", name: "Chong Nonsi", line: "Silom" },
  { id: "S4", name: "Saint Louis", line: "Silom" },
  { id: "S5", name: "Surasak", line: "Silom" },
  { id: "S6", name: "Saphan Taksin", line: "Silom" },
  { id: "S7", name: "Krung Thon Buri", line: "Silom" },
  { id: "S8", name: "Wongwian Yai", line: "Silom" },
  { id: "S9", name: "Pho Nimit", line: "Silom" },
  { id: "S10", name: "Talat Phlu", line: "Silom" },
  { id: "S11", name: "Wutthakat", line: "Silom" },
  { id: "S12", name: "Bang Wa", line: "Silom" },
];

const initialCards = [
  { id: "BTS-001", balance: 320, status: "Available" },
  { id: "BTS-002", balance: 110, status: "Available" },
  { id: "BTS-003", balance: 58, status: "Available" },
];

const fareTable = [
  { origin: "E4", destination: "CEN", trip: "oneway", fare: 32 },
  { origin: "E4", destination: "CEN", trip: "round", fare: 64 },
  { origin: "CEN", destination: "E4", trip: "oneway", fare: 32 },
  { origin: "CEN", destination: "E4", trip: "round", fare: 64 },
  { origin: "E4", destination: "N8", trip: "oneway", fare: 47 },
  { origin: "E4", destination: "N8", trip: "round", fare: 94 },
  { origin: "N8", destination: "E4", trip: "oneway", fare: 47 },
  { origin: "N8", destination: "E4", trip: "round", fare: 94 },
];

function stationLabel(id) {
  const s = stations.find((x) => x.id === id);
  return s ? `${s.id} - ${s.name}` : id;
}

function fallbackFare(origin, destination, trip) {
  if (!origin || !destination || origin === destination) return 0;
  const n1 = Number(origin.replace(/\D/g, "")) || 1;
  const n2 = Number(destination.replace(/\D/g, "")) || 1;
  const cross = origin[0] !== destination[0] ? 10 : 0;
  const oneWay = Math.min(65, 17 + Math.abs(n1 - n2) * 3 + cross);
  return trip === "round" ? oneWay * 2 : oneWay;
}

function getFare(origin, destination, trip) {
  const row = fareTable.find(
    (x) => x.origin === origin && x.destination === destination && x.trip === trip
  );
  return row ? row.fare : fallbackFare(origin, destination, trip);
}

function addHours(value, hours) {
  const d = new Date(value);
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function Button({ children, variant = "primary", ...props }) {
  const style = variant === "primary"
    ? "bg-slate-900 text-white hover:bg-slate-700"
    : variant === "danger"
    ? "bg-red-600 text-white hover:bg-red-500"
    : "border bg-white hover:bg-slate-50";
  return <button {...props} className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${style} ${props.className || ""}`}>{children}</button>;
}

function Badge({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[tone]}`}>{children}</span>;
}

function StationSelector({ label, value, onChange, disabledStation }) {
  const groups = ["Sukhumvit North", "Interchange", "Sukhumvit East", "Silom"];
  const lineStyle = {
    "Sukhumvit North": "border-emerald-500 bg-emerald-50",
    Interchange: "border-slate-900 bg-slate-50",
    "Sukhumvit East": "border-emerald-500 bg-emerald-50",
    Silom: "border-lime-500 bg-lime-50",
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="text-lg font-bold">{stationLabel(value)}</div>
        </div>
        <Badge tone="blue">Tap station</Badge>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group} className={`rounded-2xl border-l-8 p-3 ${lineStyle[group]}`}>
            <div className="mb-2 text-sm font-bold text-slate-700">{group}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {stations.filter((s) => s.line === group).map((station) => {
                const selected = station.id === value;
                const disabled = station.id === disabledStation;
                return (
                  <button
                    key={station.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(station.id)}
                    className={`rounded-xl border px-2 py-2 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white shadow"
                        : "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-black">{station.id}</div>
                    <div className="truncate">{station.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState("User");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [tab, setTab] = useState("booking");
  const [user, setUser] = useState({ name: "", email: "" });
  const [origin, setOrigin] = useState("E4");
  const [destination, setDestination] = useState("CEN");
  const [trip, setTrip] = useState("round");
  const [bookingAt, setBookingAt] = useState(getCurrentDateTimeLocal());
  const [cards, setCards] = useState(initialCards);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fare = useMemo(() => getFare(origin, destination, trip), [origin, destination, trip]);
  const selectedCard = useMemo(() => {
    return cards
      .filter((c) => c.status === "Available" && c.balance >= fare)
      .sort((a, b) => a.balance - b.balance)[0];
  }, [cards, fare]);

  const notify = (to, title, message) => {
    setNotifications((prev) => [
      { id: `NT-${prev.length + 1}`, to, title, message, at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const createBooking = () => {
    if (!selectedCard || fare <= 0) return;
    const holdUntil = addHours(bookingAt, HOLD_HOURS);
    const newBooking = {
      id: `BK-${String(bookings.length + 1).padStart(4, "0")}`,
      userName: user.name,
      userEmail: user.email,
      origin,
      destination,
      trip,
      fare,
      cardId: selectedCard.id,
      bookingAt,
      holdUntil,
      status: "Reserved",
      calendar: "Outlook event created",
    };
    setBookings((prev) => [newBooking, ...prev]);
    setCards((prev) => prev.map((c) => c.id === selectedCard.id ? { ...c, balance: c.balance - fare, status: "Reserved" } : c));
    notify("Admin", "New booking", `${user.name} booked ${selectedCard.id}: ${stationLabel(origin)} → ${stationLabel(destination)}.`);
    setTab("bookings");
  };

  const editTrip = (bookingId) => {
    const b = bookings.find((x) => x.id === bookingId);
    const newTrip = b.trip === "round" ? "oneway" : "round";
    const newFare = getFare(b.origin, b.destination, newTrip);
    const diff = newFare - b.fare;
    setBookings((prev) => prev.map((x) => x.id === bookingId ? { ...x, trip: newTrip, fare: newFare, calendar: "Outlook event updated" } : x));
    setCards((prev) => prev.map((c) => c.id === b.cardId ? { ...c, balance: c.balance - diff } : c));
    notify("Admin", "Booking edited", `${b.userName} changed ${b.id} to ${newTrip}.`);
  };

  const requestCancel = (bookingId) => {
    const b = bookings.find((x) => x.id === bookingId);
    setBookings((prev) => prev.map((x) => x.id === bookingId ? { ...x, status: "Cancel Requested" } : x));
    notify("Admin", "Cancel approval required", `${b.userName} requested cancellation for ${b.id}.`);
  };

  const approveCancel = (bookingId) => {
    const b = bookings.find((x) => x.id === bookingId);
    setBookings((prev) => prev.map((x) => x.id === bookingId ? { ...x, status: "Cancelled", calendar: "Outlook event cancelled" } : x));
    setCards((prev) => prev.map((c) => c.id === b.cardId ? { ...c, status: "Available", balance: c.balance + b.fare } : c));
    notify(b.userEmail, "Cancel approved", `Admin approved cancellation for ${b.id}.`);
  };

  const requestReturn = (bookingId) => {
    const b = bookings.find((x) => x.id === bookingId);
    setBookings((prev) => prev.map((x) => x.id === bookingId ? { ...x, status: "Return Requested" } : x));
    notify("Admin", "Return approval required", `${b.userName} requested return for ${b.cardId}.`);
  };

  const approveReturn = (bookingId) => {
    const b = bookings.find((x) => x.id === bookingId);
    setBookings((prev) => prev.map((x) => x.id === bookingId ? { ...x, status: "Returned", calendar: "Outlook event closed" } : x));
    setCards((prev) => prev.map((c) => c.id === b.cardId ? { ...c, status: "Available" } : c));
    notify(b.userEmail, "Return approved", `Admin confirmed return of ${b.cardId}.`);
  };

  const statusTone = (status) => {
    if (status === "Reserved") return "blue";
    if (status.includes("Requested")) return "amber";
    if (status === "Cancelled") return "red";
    if (status === "Returned") return "green";
    return "slate";
  };

  const visibleBookings = role === "Admin" ? bookings : bookings.filter((b) => b.userEmail === user.email && user.email !== "");
  const visibleNoti = notifications.filter((n) => role === "Admin" ? n.to === "Admin" : n.to === user.email);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Internal BTS Card Booking</h1>
            <p className="text-slate-500">Web prototype: booking, fare lookup, card balance, cancel/return approval, in-app notification.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={role === "User" ? "primary" : "outline"} onClick={() => setRole("User")}>User</Button>
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
            <Button key={key} variant={tab === key ? "primary" : "outline"} onClick={() => setTab(key)} disabled={key === "admin" && role !== "Admin"}>{label}</Button>
          ))}
        </nav>

        {tab === "booking" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold">Create Booking</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-xl border px-3 py-2" placeholder="Enter Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
                <input className="rounded-xl border px-3 py-2" placeholder="Enter Your Email" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
                <input className="rounded-xl border px-3 py-2" type="datetime-local" value={bookingAt} onChange={(e) => setBookingAt(e.target.value)} />
                <select className="rounded-xl border px-3 py-2" value={trip} onChange={(e) => setTrip(e.target.value)}>
                  <option value="oneway">One-way</option>
                  <option value="round">Round trip</option>
                </select>
                <select className="rounded-xl border px-3 py-2" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                </select>
                <select className="rounded-xl border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                </select>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-100 p-4">
                <div className="text-sm text-slate-500">Estimated Fare</div>
                <div className="text-3xl font-bold">{fare} THB</div>
                <div className="mt-2 text-sm text-slate-500">{stationLabel(origin)} → {stationLabel(destination)} / {trip}</div>
              </div>
              <Button className="mt-5 w-full py-3" onClick={createBooking} disabled={!selectedCard || fare <= 0}>Reserve Card & Create Outlook Event</Button>
            </Card>

            <Card>
              <h2 className="mb-4 text-xl font-bold">Auto Selected Card</h2>
              {selectedCard ? (
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-2xl font-bold">{selectedCard.id}</div>
                  <div>Balance before: {selectedCard.balance} THB</div>
                  <Badge tone="green">Enough balance</Badge>
                </div>
              ) : (
                <div className="rounded-2xl bg-red-50 p-4 text-red-700">No card has enough balance.</div>
              )}
              <div className="mt-4 space-y-3">
                {cards.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div><b>{c.id}</b><div className="text-sm text-slate-500">{c.balance} THB</div></div>
                    <Badge tone={c.status === "Available" ? "green" : "amber"}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "bookings" && (
          <Card>
            <h2 className="mb-4 text-xl font-bold">Bookings</h2>
            <div className="space-y-3">
              {visibleBookings.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">No booking yet</div>}
              {visibleBookings.map((b) => (
                <div key={b.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><b>{b.id}</b><Badge tone={statusTone(b.status)}>{b.status}</Badge></div>
                    <div className="text-sm text-slate-600">{b.userName} ({b.userEmail})</div>
                    <div className="text-sm text-slate-600">{stationLabel(b.origin)} → {stationLabel(b.destination)} / {b.trip} / {b.fare} THB</div>
                    <div className="text-sm text-slate-500">Card: {b.cardId} | Hold: {formatDate(b.bookingAt)} - {formatDate(b.holdUntil)} | {b.calendar}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => editTrip(b.id)} disabled={b.status !== "Reserved"}>Edit Trip</Button>
                    <Button variant="outline" onClick={() => requestCancel(b.id)} disabled={b.status !== "Reserved"}>Cancel</Button>
                    <Button variant="outline" onClick={() => requestReturn(b.id)} disabled={b.status !== "Reserved"}>Return</Button>
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
                {bookings.filter((b) => b.status.includes("Requested")).length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">No pending request</div>}
                {bookings.filter((b) => b.status.includes("Requested")).map((b) => (
                  <div key={b.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between"><b>{b.id}</b><Badge tone="amber">{b.status}</Badge></div>
                    <div className="text-sm text-slate-600">{b.userName} / {b.cardId} / {b.fare} THB</div>
                    <div className="mt-3 flex gap-2">
                      {b.status === "Cancel Requested" && <Button onClick={() => approveCancel(b.id)}>Approve Cancel</Button>}
                      {b.status === "Return Requested" && <Button onClick={() => approveReturn(b.id)}>Approve Return</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-xl font-bold">Card Admin</h2>
              <div className="space-y-3">
                {cards.map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-3 rounded-xl border p-3">
                    <div><b>{c.id}</b><div className="text-sm text-slate-500">{c.status}</div></div>
                    <input className="rounded-xl border px-3 py-2" type="number" value={c.balance} onChange={(e) => setCards((prev) => prev.map((x) => x.id === c.id ? { ...x, balance: Number(e.target.value) } : x))} />
                    <Badge tone={c.status === "Available" ? "green" : "amber"}>{c.status}</Badge>
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
              {visibleNoti.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">No notification</div>}
              {visibleNoti.map((n) => (
                <div key={n.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between"><b>{n.title}</b><span className="text-xs text-slate-400">{formatDate(n.at)}</span></div>
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
