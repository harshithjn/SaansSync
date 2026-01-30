"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDoctorSession, storeDoctorSession } from "@/lib/doctor-session";

export default function DoctorPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const handleLogin = () => {
    if (email === "test@doctor.com" && password === "doctor123") {
      setError("");
      // Create and store session so dashboard layout can verify (doctorId must match URL)
      let session = createDoctorSession(email);
      if (!session) {
        session = {
          doctorId: "1",
          name: "Test Doctor",
          email: "test@doctor.com",
          phoneNumber: "",
          loginTime: new Date().toISOString(),
          token: btoa(JSON.stringify({ email, timestamp: Date.now() }))
        };
      }
      if (session.doctorId !== "1") {
        session = { ...session, doctorId: "1" };
      }
      storeDoctorSession(session);
      router.push("/doctor/dashboard/1");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Doctor Portal</h2>

      {!showCreateAccount ? (
        <>
          <Input
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            className="mt-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 mt-2">{error}</p>}

          <Button className="mt-4 w-full" onClick={handleLogin}>
            Login
          </Button>

          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setShowCreateAccount(true)}
          >
            Create Account
          </Button>
        </>
      ) : (
        <>
          <Input placeholder="Full Name" />
          <Input placeholder="Age" type="number" className="mt-3" />
          <Input placeholder="Email ID" className="mt-3" />
          <Input type="file" className="mt-3" />

          <Button className="mt-4 w-full">Create Account</Button>

          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => setShowCreateAccount(false)}
          >
            Back to Login
          </Button>
        </>
      )}
    </main>
  );
}
