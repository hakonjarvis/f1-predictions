"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Driver = {
  id: number;
  name: string;
  code: string;
  number: number | null;
  country: string | null;
  headshotUrl: string | null;
  teamId: number;
  team: {
    id: number;
    name: string;
    constructor: string | null;
  };
};

type ExistingPrediction = {
  id: number;
  createdAt: string;
  predictions: Array<{
    id: number;
    predictedPosition: number;
    driver: Driver;
  }>;
};

function ReadOnlyDriver({ driver, position }: { driver: Driver; position: number }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-800 rounded p-3 mb-2">
      <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 text-zinc-400 rounded flex items-center justify-center font-semibold text-sm border border-zinc-600">
        {position}
      </div>
      {driver.headshotUrl && (
        <img
          src={driver.headshotUrl}
          alt={driver.name}
          className="w-10 h-10 rounded-full object-cover border border-zinc-700"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-zinc-200">{driver.name}</p>
        <p className="text-sm text-zinc-500">{driver.team.name}</p>
      </div>
      <div className="text-right">
        {driver.number && (
          <span className="text-lg font-semibold text-zinc-400">#{driver.number}</span>
        )}
        {driver.country && (
          <p className="text-xs text-zinc-600">{driver.country}</p>
        )}
      </div>
    </div>
  );
}

function SortableDriver({ driver, position }: { driver: Driver; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: driver.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-800 rounded p-3 mb-2 cursor-grab hover:border-zinc-700 transition-colors"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 text-zinc-400 rounded flex items-center justify-center font-semibold text-sm border border-zinc-600">
        {position}
      </div>
      {driver.headshotUrl && (
        <img
          src={driver.headshotUrl}
          alt={driver.name}
          className="w-10 h-10 rounded-full object-cover border border-zinc-700"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-zinc-200">{driver.name}</p>
        <p className="text-sm text-zinc-500">{driver.team.name}</p>
      </div>
      <div className="text-right">
        {driver.number && (
          <span className="text-lg font-semibold text-zinc-400">#{driver.number}</span>
        )}
        {driver.country && (
          <p className="text-xs text-zinc-600">{driver.country}</p>
        )}
      </div>
    </div>
  );
}

export default function NewPredictionPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [existingPrediction, setExistingPrediction] = useState<ExistingPrediction | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    // Redirect to auth page if not logged in
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      checkExistingPrediction();
    }
  }, [user]);

  async function checkExistingPrediction() {
    try {
      const response = await fetch("/api/predictions/me");
      const data = await response.json();

      if (data.prediction) {
        setExistingPrediction(data.prediction);
        setLoading(false);
      } else {
        // No existing prediction, fetch drivers for new prediction
        await fetchDrivers();
      }
    } catch (err) {
      console.error("Error checking prediction:", err);
      setError("Kunne ikke laste data. Prøv igjen senere.");
      setLoading(false);
    }
  }

  async function fetchDrivers() {
    try {
      const response = await fetch("/api/drivers");
      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      setError("Kunne ikke laste drivers. Prøv igjen senere.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = drivers.findIndex((d) => d.id === active.id);
      const newIndex = drivers.findIndex((d) => d.id === over.id);
      setDrivers(arrayMove(drivers, oldIndex, newIndex));
    }
  }

  async function handleSubmit() {
    setError("");

    if (!user) {
      setError("Du må være logget inn for å sende inn en prediction");
      return;
    }

    setSubmitting(true);

    try {
      const predictions = drivers.map((driver, index) => ({
        driverId: driver.id,
        position: index + 1,
      }));

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Noe gikk galt");
        return;
      }

      // Fetch the newly created prediction to show in read-only mode
      await checkExistingPrediction();
    } catch (err) {
      setError("Kunne ikke lagre prediction. Prøv igjen.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // Show loading while checking auth or fetching drivers
  if (authLoading || loading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-zinc-400">Laster...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show existing prediction in read-only mode
  if (existingPrediction) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <a
            href="/"
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors inline-flex items-center gap-1"
          >
            ← Tilbake
          </a>
        </div>

        <h1 className="text-2xl font-semibold mb-2 text-white">Din prediction</h1>
        <p className="text-zinc-400 mb-8 text-sm">
          Du har allerede levert din prediction. Den kan ikke endres.
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-4">
          <p className="text-sm text-zinc-400">
            Levert: <span className="text-zinc-200 font-medium">
              {new Date(existingPrediction.createdAt).toLocaleString('no-NO')}
            </span>
          </p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Ditt championship-tips:</h2>
          {existingPrediction.predictions.map((pred) => (
            <ReadOnlyDriver
              key={pred.id}
              driver={pred.driver}
              position={pred.predictedPosition}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <a
            href="/leaderboard"
            className="flex-1 text-center bg-white text-black px-6 py-2.5 rounded hover:bg-zinc-200 transition font-medium"
          >
            Se leaderboard
          </a>
          <a
            href="/"
            className="flex-1 text-center bg-zinc-800 text-zinc-300 px-6 py-2.5 rounded hover:bg-zinc-700 transition font-medium border border-zinc-700"
          >
            Tilbake til hjem
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">Takk!</h2>
          <p className="text-zinc-400 mb-6">
            Din prediction er lagret. Lykke til i konkurransen!
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/leaderboard"
              className="inline-block bg-white text-black px-6 py-2 rounded hover:bg-zinc-200 transition font-medium"
            >
              Se leaderboard
            </a>
            <a
              href="/"
              className="inline-block bg-zinc-800 text-zinc-300 px-6 py-2 rounded hover:bg-zinc-700 transition font-medium border border-zinc-700"
            >
              Tilbake til hjem
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <a
          href="/"
          className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors inline-flex items-center gap-1"
        >
          ← Tilbake
        </a>
      </div>
      <h1 className="text-2xl font-semibold mb-2 text-white">Lag din prediction</h1>
      <p className="text-zinc-400 mb-8 text-sm">
        Dra og slipp for å rangere drivers i den rekkefølgen du tror de vil ende opp
        i championship
      </p>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-4">
        <p className="text-sm text-zinc-400">
          Logget inn som: <span className="text-zinc-200 font-medium">{user.email}</span>
        </p>
      </div>

      {/* Driver List */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={drivers.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {drivers.map((driver, index) => (
              <SortableDriver
                key={driver.id}
                driver={driver}
                position={index + 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-white text-black py-2.5 rounded hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition font-medium"
      >
        {submitting ? "Lagrer..." : "Lagre prediction"}
      </button>

      <p className="text-center text-xs text-zinc-600 mt-4">
        Du kan kun sende inn én prediction. Den kan ikke endres etter innsending.
      </p>
    </div>
  );
}
