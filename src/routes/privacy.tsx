import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PlateScan" },
      { name: "description", content: "How PlateScan handles your food photos and which AI services process them." },
      { property: "og:title", content: "Privacy Policy — PlateScan" },
      { property: "og:description", content: "Where your food photos go and which AI analyses them." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <section><h2>What we collect</h2>
        <p>We do not require an account. When you scan, the food photo and any answers you give to follow-up questions are sent for analysis. We do not store your photos or results on our servers after the analysis is done.</p></section>
      <section><h2>Where your data goes</h2>
        <p>Your photo is sent securely (HTTPS) from your phone to our app server, which forwards it to an AI service for analysis:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><span className="font-medium">Default (demo):</span> Lovable AI Gateway, which uses Google Gemini models to read the photo.</li>
          <li><span className="font-medium">Your own key:</span> if you set an AI address and key in Settings, the photo is sent to that provider (for example OpenAI) instead, under their privacy policy.</li>
        </ul></section>
      <section><h2>Stored on your phone</h2>
        <p>Your AI settings, including your API key, are saved only in your phone's browser storage. They are never saved on our servers.</p></section>
      <section><h2>Health information</h2>
        <p>Food photos can reveal health-related habits. Please avoid including faces, documents or other personal details in your photos.</p></section>
      <section><h2>Contact</h2>
        <p>Questions about privacy can be sent via eryntra.com.</p></section>
    </LegalPage>
  );
}
