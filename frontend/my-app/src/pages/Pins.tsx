import React, { useEffect, useState } from "react";

// Define TypeScript type for a Pin
interface Pin {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
}

const Pins: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/pins/", {
          credentials: "include", // if using session auth
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: Pin[] = await res.json();
        setPins(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch pins from Django API");
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, []);

  if (loading) return <div>Loading pins...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h2>Pins List</h2>
      <ul>
        {pins.map((pin) => (
          <li key={pin.id}>
            {pin.name} ({pin.latitude}, {pin.longitude})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pins;
