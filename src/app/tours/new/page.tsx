"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TourForm } from "@/components/tours/TourForm";
import { TourFormData } from "@/lib/validations";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Download, Loader2 } from "lucide-react";

export default function NewTourPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importedData, setImportedData] =
    useState<Partial<TourFormData> | null>(null);
  const [importError, setImportError] = useState("");

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setImportError("Please enter a URL");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const response = await fetch("/api/tours/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        setImportError(error.error || "Failed to import tour");
        return;
      }

      const data = await response.json();
      setImportedData(data);
    } catch (error) {
      setImportError("Failed to import tour. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (data: TourFormData) => {
    try {
      const response = await fetch("/api/tours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create tour");
      }

      router.push("/tours");
      router.refresh();
    } catch (error) {
      console.error("Error creating tour:", error);
      alert("Failed to create tour. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-mountain-900 mb-8">
        Create New Tour
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-mountain-800">
            Import from bergsteigen.com
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.bergsteigen.com/..."
              className="flex-1"
            />
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
          {importError && (
            <p className="mt-2 text-sm text-red-600">{importError}</p>
          )}
          {importedData && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Tour data imported! Review and save below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-mountain-800">
            Tour Details
          </h2>
        </CardHeader>
        <CardContent>
          <TourForm
            initialData={importedData as any}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/tours")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
