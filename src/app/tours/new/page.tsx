"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TourForm } from "@/components/tours/TourForm";
import { TourFormData } from "@/lib/validations";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Download, Loader2, Sparkles } from "lucide-react";

function isBergsteigenUrl(value: string): boolean {
  try {
    return new URL(value).hostname.includes("bergsteigen.com");
  } catch {
    return false;
  }
}

function looksLikeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function NewTourPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importedData, setImportedData] =
    useState<Partial<TourFormData> | null>(null);
  const [importError, setImportError] = useState("");

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      setImportError("Paste a bergsteigen.com URL or copied tour text first.");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const candidateUrl =
        looksLikeUrl(importText) && isBergsteigenUrl(importText)
          ? importText
          : "";

      const response = await fetch("/api/tours/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: importText,
          url: candidateUrl,
        }),
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
            Import from bergsteigen.com or pasted text
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={7}
              placeholder="Paste a bergsteigen.com URL here, or copy the tour page text and paste it in."
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-mountain-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Paste the copied page content and OpenAI will extract the
                fields.
              </p>
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
