import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — PlateScan" },
      {
        name: "description",
        content: "Terms of use for PlateScan, the free AI food nutrition scanner.",
      },
      { property: "og:title", content: "Terms & Conditions — PlateScan" },
      {
        property: "og:description",
        content: "AI estimates, medical disclaimer and liability terms for PlateScan.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms & Conditions">
      <section>
        <h2>1. AI-generated estimates</h2>
        <p>
          PlateScan uses artificial intelligence (AI) to look at your food photo and estimate
          calories, nutrients and health risk levels. All results are approximations. AI is not
          always correct: it can misidentify foods, portion sizes, oils or hidden ingredients.
        </p>
      </section>
      <section>
        <h2>2. Not medical advice</h2>
        <p>
          PlateScan is for general information only. It is not a medical device and does not replace
          a doctor or dietitian. If you have diabetes, kidney or liver disease, high blood pressure,
          high cholesterol, obesity, or any serious medical condition, always check results with a
          qualified dietitian and weigh your food on a measuring scale.
        </p>
      </section>
      <section>
        <h2>3. Free service, no liability</h2>
        <p>
          PlateScan is provided free of charge, "as is", without any warranty. To the fullest extent
          allowed by law, we are not responsible for any loss, injury, health outcome, dispute or
          conflict resulting from use of the app or reliance on its results. You use the app at your
          own risk.
        </p>
      </section>
      <section>
        <h2>4. Your own AI key</h2>
        <p>
          If you enter your own AI service address and key in Settings, your use of that service is
          subject to that provider's terms and charges.
        </p>
      </section>
      <section>
        <h2>5. Changes</h2>
        <p>
          We may update these terms at any time. Continued use means you accept the updated terms.
        </p>
      </section>
    </LegalPage>
  );
}
